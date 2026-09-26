package services

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	maxbot "github.com/max-messenger/max-bot-api-client-go/v2"
	"github.com/suhrobdomoiZ/go-swipe/server/config"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/model"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/repository"
)

type Auth struct {
	repository repository.IUser
	secretKey  []byte
	jwtTTL     time.Duration
}

func NewAuth(config *config.ServerConfig, repository repository.IUser) *Auth {
	return &Auth{repository, config.SecretKey(), config.JWTTTL()}
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

func (s *Auth) issueJWT(userID uuid.UUID) (string, error) {
	claims := &model.JWTAuthData{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.jwtTTL)),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.secretKey)
}
