package handlers

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/middleware"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/model"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/services"
)

type Profile struct {
	service *services.Profile
}

func NewProfile(service *services.Profile) *Profile {
	return &Profile{service}
}

func (h *Profile) Get(ctx *echo.Context) error {
	userID, err := middleware.GetUserID(ctx)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	user, interests, err := h.service.Get(ctx.Request().Context(), userID)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	return ctx.JSON(http.StatusOK, model.ToProfileDTO(user, interests))
}

func (h *Profile) Update(ctx *echo.Context) error {
	var req model.ProfilePatchRequestDTO
	if err := ctx.Bind(&req); err != nil {
		return domain.MapAppError(ctx, domain.NewBadRequest(domain.CodeBadRequest, "request body is invalid", err))
	}

	userID, err := middleware.GetUserID(ctx)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	var interests *[]domain.Interest
	if req.Interests != nil {
		converted := model.FromInterestDTOs(*req.Interests)
		interests = &converted
	}

	var birthDate *time.Time
	if req.BirthDate != nil && *req.BirthDate != "" {
		parsed, err := time.Parse(time.DateOnly, *req.BirthDate)
		if err != nil {
			err = domain.NewBadRequest(domain.CodeBadRequest, "profile.Update: birth_date must be YYYY-MM-DD", err)

			return domain.MapAppError(ctx, err)
		}
		birthDate = &parsed
	}

	user, updatedInterests, err := h.service.Update(ctx.Request().Context(), userID, req.City, interests, req.RemoveInterests, birthDate)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	return ctx.JSON(http.StatusOK, model.ToProfileDTO(user, updatedInterests))
}
