package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	maxbot "github.com/max-messenger/max-bot-api-client-go/v2"
	"github.com/suhrobdomoiZ/go-swipe/server/config"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/model"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/repository"
)

const onboardingStartWeight = 1.0

const onboardingTextMaxLength = 500

type Auth struct {
	repository repository.IUser
	interests  repository.IUserInterest
	tx         repository.TransactionManager
	secretKey  []byte
	jwtTTL     time.Duration
}

func NewAuth(config *config.ServerConfig, repository repository.IUser, interests repository.IUserInterest, tx repository.TransactionManager) *Auth {
	return &Auth{repository, interests, tx, config.SecretKey(), config.JWTTTL()}
}

func (s *Auth) Login(ctx context.Context, initData string, maxToken string) (token string, user domain.User, needOnboarding bool, err error) {
	data, err := maxbot.ValidateInitData(initData, maxToken)
	if err != nil {
		return "", domain.User{}, false, domain.NewUnauthorized(domain.CodeUnauthorized, "auth.Login: invalid init data", err)
	}
	if data.User.ID == 0 {
		return "", domain.User{}, false, domain.NewUnauthorized(domain.CodeUnauthorized, "auth.Login: init data has no user", nil)
	}

	user, err = s.repository.GetOrCreateByMaxID(ctx, data.User.ID)
	if err != nil {
		return "", domain.User{}, false, fmt.Errorf("get or create user: %w", err)
	}

	token, err = s.issueJWT(user.ID)
	if err != nil {
		return "", domain.User{}, false, fmt.Errorf("issue jwt: %w", err)
	}
	return token, user, user.NeedsOnboarding(), nil
}

func (s *Auth) Onboarding(
	ctx context.Context,
	userID uuid.UUID,
	city string,
	birthDate *time.Time,
	categories []string,
	onboardingText *string,
) (domain.User, error) {
	city = strings.TrimSpace(city)
	if city == "" {
		return domain.User{}, domain.NewBadRequest(domain.CodeBadRequest, "auth.Onboarding: city is required")
	}
	if len(city) > 64 {
		return domain.User{}, domain.NewBadRequest(domain.CodeBadRequest, "auth.Onboarding: city is too long")
	}

	if birthDate != nil {
		age := calculateAge(*birthDate, time.Now())
		if age < 10 || age > 110 {
			return domain.User{}, domain.NewBadRequest(domain.CodeBadRequest, "auth.Onboarding: birth date gives an implausible age")
		}
	}

	validCategories := make([]domain.EventCategory, 0, len(categories))
	seen := make(map[domain.EventCategory]struct{}, len(categories))
	for _, raw := range categories {
		category := domain.EventCategory(strings.ToLower(strings.TrimSpace(raw)))
		if !category.Valid() {
			continue
		}
		if _, ok := seen[category]; ok {
			continue
		}
		seen[category] = struct{}{}
		validCategories = append(validCategories, category)
	}
	if len(validCategories) == 0 {
		return domain.User{}, domain.NewBadRequest(domain.CodeBadRequest, "auth.Onboarding: at least one valid category is required")
	}

	var info *string
	if onboardingText != nil {
		trimmed := strings.TrimSpace(*onboardingText)
		if trimmed != "" {
			trimmed = truncateRunes(trimmed, onboardingTextMaxLength)
			info = &trimmed
		}
	}

	var user domain.User
	err := s.tx.WithTransaction(ctx, func(ctx context.Context) error {
		var err error
		user, err = s.repository.UpdateOnboarding(ctx, userID, city, birthDate, info)
		if err != nil {
			return err
		}

		weights := make(map[string]float64, len(validCategories))
		for _, category := range validCategories {
			weights[string(category)] = onboardingStartWeight
		}
		return s.interests.IncrementWeights(ctx, userID, weights)
	})
	if err != nil {
		return domain.User{}, err
	}
	return user, nil
}

func (s *Auth) issueJWT(userID uuid.UUID) (string, error) {
	claims := &model.JWTAuthData{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.jwtTTL)),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.secretKey)
}
