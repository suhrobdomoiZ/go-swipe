package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v5"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/middleware"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/model"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/services"
)

type Events struct {
	service *services.Events
}

func NewEvents(service *services.Events) *Events {
	return &Events{service}
}

func (h *Events) Feed(ctx *echo.Context) error {
	userID, err := middleware.GetUserID(ctx)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	params, err := parseEventFeedParams(ctx)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	events, total, err := h.service.Feed(ctx.Request().Context(), userID, params)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	return ctx.JSON(http.StatusOK, model.ToEventListDTO(events, total))
}

func parseEventFeedParams(ctx *echo.Context) (services.EventFeedParams, error) {
	var params services.EventFeedParams

	if q := ctx.QueryParam("q"); q != "" {
		params.Query = &q
	}
	if category := ctx.QueryParam("category"); category != "" {
		params.Category = &category
	}
	if raw := ctx.QueryParam("is_free"); raw != "" {
		v, err := strconv.ParseBool(raw)
		if err != nil {
			return params, domain.NewBadRequest(domain.CodeBadRequest, "events.Feed: is_free must be a boolean", err)
		}
		params.IsFree = &v
	}
	if v, ok, err := queryInt(ctx, "price_max"); err != nil {
		return params, err
	} else if ok {
		params.PriceMax = &v
	}
	if v, ok, err := queryInt(ctx, "age_limit"); err != nil {
		return params, err
	} else if ok {
		params.AgeLimit = &v
	}
	if raw := ctx.QueryParam("date_from"); raw != "" {
		v, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			return params, domain.NewBadRequest(domain.CodeBadRequest, "events.Feed: date_from must be an RFC3339 timestamp", err)
		}
		params.DateFrom = &v
	}
	if raw := ctx.QueryParam("date_to"); raw != "" {
		v, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			return params, domain.NewBadRequest(domain.CodeBadRequest, "events.Feed: date_to must be an RFC3339 timestamp", err)
		}
		params.DateTo = &v
	}
	if v, _, err := queryInt(ctx, "limit"); err != nil {
		return params, err
	} else {
		params.Limit = v
	}
	if v, _, err := queryInt(ctx, "offset"); err != nil {
		return params, err
	} else {
		params.Offset = v
	}

	return params, nil
}

func queryInt(ctx *echo.Context, key string) (int, bool, error) {
	raw := ctx.QueryParam(key)
	if raw == "" {
		return 0, false, nil
	}
	v, err := strconv.Atoi(raw)
	if err != nil {
		return 0, false, domain.NewBadRequest(domain.CodeBadRequest, key+" must be an integer", err)
	}
	return v, true, nil
}

func (h *Events) Create(ctx *echo.Context) error {
	input, err := bindEventInput(ctx)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	userID, err := middleware.GetUserID(ctx)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	event, err := h.service.Create(ctx.Request().Context(), userID, input)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	return ctx.JSON(http.StatusCreated, model.ToEventDTO(event))
}

func (h *Events) Update(ctx *echo.Context) error {
	id, err := uuid.Parse(ctx.Param("eventId"))
	if err != nil {
		return domain.MapAppError(ctx, domain.NewBadRequest(domain.CodeBadRequest, "events.Update: invalid event id", err))
	}

	input, err := bindEventInput(ctx)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	userID, err := middleware.GetUserID(ctx)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	event, err := h.service.Update(ctx.Request().Context(), userID, id, input)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	return ctx.JSON(http.StatusOK, model.ToEventDTO(event))
}

func bindEventInput(ctx *echo.Context) (services.EventInput, error) {
	var req model.EventInputDTO
	if err := ctx.Bind(&req); err != nil {
		return services.EventInput{}, domain.NewBadRequest(domain.CodeBadRequest, "request body is invalid", err)
	}
	return services.EventInput{
		Title:       req.Title,
		Description: req.Description,
		Category:    req.Category,
		Tags:        req.Tags,
		City:        req.City,
		Venue:       req.Venue,
		StartsAt:    req.StartsAt,
		EndsAt:      req.EndsAt,
		Price:       req.Price,
		AgeLimit:    req.AgeLimit,
		URL:         req.URL,
		ImageURL:    req.ImageURL,
	}, nil
}

func (h *Events) Mine(ctx *echo.Context) error {
	userID, err := middleware.GetUserID(ctx)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	limit, _, err := queryInt(ctx, "limit")
	if err != nil {
		return domain.MapAppError(ctx, err)
	}
	offset, _, err := queryInt(ctx, "offset")
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	events, total, err := h.service.Mine(ctx.Request().Context(), userID, limit, offset)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	return ctx.JSON(http.StatusOK, model.ToEventListDTO(events, total))
}

func (h *Events) GetByID(ctx *echo.Context) error {
	id, err := uuid.Parse(ctx.Param("eventId"))
	if err != nil {
		return domain.MapAppError(ctx, domain.NewBadRequest(domain.CodeBadRequest, "events.GetByID: invalid event id", err))
	}

	event, err := h.service.GetByID(ctx.Request().Context(), id)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	return ctx.JSON(http.StatusOK, model.ToEventDTO(event))
}
