package services

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/repository"
)

const maxInterestWeight = 100.0

type Profile struct {
	users     repository.IUser
	interests repository.IUserInterest
	tx        repository.TransactionManager
}

func NewProfile(users repository.IUser, interests repository.IUserInterest, tx repository.TransactionManager) *Profile {
	return &Profile{users, interests, tx}
}

func (s *Profile) Get(ctx context.Context, userID uuid.UUID) (domain.User, []domain.Interest, error) {
	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return domain.User{}, nil, err
	}
	interests, err := s.interests.List(ctx, userID)
	if err != nil {
		return domain.User{}, nil, err
	}
	return user, interests, nil
}

func (s *Profile) Update(ctx context.Context, userID uuid.UUID, city *string, interests *[]domain.Interest) (domain.User, []domain.Interest, error) {
	if city != nil {
		trimmed := strings.TrimSpace(*city)
		if trimmed == "" {
			return domain.User{}, nil, domain.NewBadRequest(domain.CodeBadRequest, "profile.Update: city must not be empty")
		}
		if len([]rune(trimmed)) > maxCityLength {
			return domain.User{}, nil, domain.NewBadRequest(domain.CodeBadRequest, "profile.Update: city is too long")
		}
		city = &trimmed
	}

	var normalizedInterests []domain.Interest
	if interests != nil {
		normalizedInterests = normalizeInterests(*interests)
	}

	err := s.tx.WithTransaction(ctx, func(ctx context.Context) error {
		if city != nil {
			if _, err := s.users.UpdateCity(ctx, userID, *city); err != nil {
				return err
			}
		}
		if interests != nil {
			if err := s.interests.ReplaceAll(ctx, userID, normalizedInterests); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return domain.User{}, nil, err
	}

	return s.Get(ctx, userID)
}

func normalizeInterests(interests []domain.Interest) []domain.Interest {
	byTag := make(map[string]float64, len(interests))
	order := make([]string, 0, len(interests))
	for _, interest := range interests {
		tag := normalizeTag(interest.Tag)
		if tag == "" {
			continue
		}
		weight := interest.Weight
		if weight > maxInterestWeight {
			weight = maxInterestWeight
		}
		if weight < -maxInterestWeight {
			weight = -maxInterestWeight
		}
		if _, exists := byTag[tag]; !exists {
			order = append(order, tag)
		}
		byTag[tag] = weight
	}

	result := make([]domain.Interest, 0, len(order))
	for _, tag := range order {
		result = append(result, domain.Interest{Tag: tag, Weight: byTag[tag]})
	}
	return result
}
