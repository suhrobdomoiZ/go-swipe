package handlers

import (
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v5"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/middleware"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/model"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/services"
)

type Favorites struct {
	service *services.Favorites
}

func NewFavorites(service *services.Favorites) *Favorites {
	return &Favorites{service}
}

func (h *Favorites) List(ctx *echo.Context) error {
	userID, err := middleware.GetUserID(ctx)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	var confirmed *bool
	if raw := ctx.QueryParam("confirmed"); raw != "" {
		v, err := strconv.ParseBool(raw)
		if err != nil {
			return domain.MapAppError(ctx, domain.NewBadRequest(domain.CodeBadRequest, "favorites.List: confirmed must be a boolean", err))
		}
		confirmed = &v
	}

	favorites, err := h.service.List(ctx.Request().Context(), userID, confirmed)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	return ctx.JSON(http.StatusOK, model.FavoriteListDTO{Items: model.ToFavoriteItemDTOs(favorites)})
}

func (h *Favorites) Confirm(ctx *echo.Context) error {
	eventID, err := uuid.Parse(ctx.Param("eventId"))
	if err != nil {
		return domain.MapAppError(ctx, domain.NewBadRequest(domain.CodeBadRequest, "favorites.Confirm: invalid event id", err))
	}

	var req model.FavoritePatchRequestDTO
	if err := ctx.Bind(&req); err != nil {
		return domain.MapAppError(ctx, domain.NewBadRequest(domain.CodeBadRequest, "request body is invalid", err))
	}
	if req.Confirmed == nil {
		return domain.MapAppError(ctx, domain.NewBadRequest(domain.CodeBadRequest, "favorites.Confirm: confirmed is required"))
	}

	userID, err := middleware.GetUserID(ctx)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	favorite, err := h.service.Confirm(ctx.Request().Context(), userID, eventID, *req.Confirmed)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	return ctx.JSON(http.StatusOK, model.ToFavoriteItemDTO(favorite))
}

func (h *Favorites) Remove(ctx *echo.Context) error {
	eventID, err := uuid.Parse(ctx.Param("eventId"))
	if err != nil {
		return domain.MapAppError(ctx, domain.NewBadRequest(domain.CodeBadRequest, "favorites.Remove: invalid event id", err))
	}

	userID, err := middleware.GetUserID(ctx)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	if err := h.service.Remove(ctx.Request().Context(), userID, eventID); err != nil {
		return domain.MapAppError(ctx, err)
	}

	return ctx.NoContent(http.StatusNoContent)
}
