package handlers

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v5"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/middleware"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/model"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/services"
)

type Swipes struct {
	service *services.Swipes
}

func NewSwipes(service *services.Swipes) *Swipes {
	return &Swipes{service}
}

func (h *Swipes) Create(ctx *echo.Context) error {
	eventID, err := uuid.Parse(ctx.Param("eventId"))
	if err != nil {
		return domain.MapAppError(ctx, domain.NewBadRequest(domain.CodeBadRequest, "swipes.Create: invalid event id", err))
	}

	var req model.SwipeRequestDTO
	if err := ctx.Bind(&req); err != nil {
		return domain.MapAppError(ctx, domain.NewBadRequest(domain.CodeBadRequest, "request body is invalid", err))
	}

	userID, err := middleware.GetUserID(ctx)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	swipe, err := h.service.Create(ctx.Request().Context(), userID, eventID, req.Action)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	return ctx.JSON(http.StatusOK, model.ToSwipeDTO(swipe))
}
