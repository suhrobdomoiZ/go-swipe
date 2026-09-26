package handlers

import (
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/suhrobdomoiZ/go-swipe/server/config"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
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
