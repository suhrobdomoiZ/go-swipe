package handlers

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/suhrobdomoiZ/go-swipe/server/config"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/middleware"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/model"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/services"
)

type Auth struct {
	service  *services.Auth
	maxToken string
}

func NewAuth(service *services.Auth, config *config.MaxConfig) *Auth {
	return &Auth{
		service:  service,
		maxToken: config.Token(),
	}
}
func (s *Auth) Login(ctx *echo.Context) error {
	var req model.LoginRequest

	err := ctx.Bind(&req)
	if err != nil {
		err = domain.NewBadRequest(domain.CodeBadRequest, "request body is invalid", err)

		return domain.MapAppError(ctx, err)
	}

	token, user, needOnboarding, err := s.service.Login(ctx.Request().Context(), req.InitData, s.maxToken)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	return ctx.JSON(http.StatusOK, model.LoginResponse{
		Token:          token,
		NeedOnboarding: needOnboarding,
		User:           model.ToUserDTO(user),
	})
}

func (s *Auth) Onboarding(ctx *echo.Context) error {
	var req model.OnboardingRequestDTO

	err := ctx.Bind(&req)
	if err != nil {
		err = domain.NewBadRequest(domain.CodeBadRequest, "request body is invalid", err)

		return domain.MapAppError(ctx, err)
	}

	userID, err := middleware.GetUserID(ctx)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	var birthDate *time.Time
	if req.BirthDate != nil && *req.BirthDate != "" {
		parsed, err := time.Parse(time.DateOnly, *req.BirthDate)
		if err != nil {
			err = domain.NewBadRequest(domain.CodeBadRequest, "auth.Onboarding: birth_date must be YYYY-MM-DD", err)

			return domain.MapAppError(ctx, err)
		}
		birthDate = &parsed
	}

	user, err := s.service.Onboarding(ctx.Request().Context(), userID, req.City, birthDate, req.Categories, req.OnboardingText)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	return ctx.JSON(http.StatusOK, model.ToUserDTO(user))
}
