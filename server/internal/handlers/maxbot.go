package handlers

import (
	"log/slog"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v5"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/maxclient"
)

type MaxBot struct {
	client *maxclient.Client
}

func NewMaxBot(client *maxclient.Client) *MaxBot {
	return &MaxBot{
		client: client,
	}
}

func (h *MaxBot) Ping(ctx *echo.Context) error {
	if err := h.client.Ping(ctx.Request().Context()); err != nil {
		slog.Error(err.Error())
		return domain.MapAppError(ctx, err)
	}
	return domain.JSON(ctx, http.StatusOK, nil)
}

func (h *MaxBot) SendMessage(ctx *echo.Context) error {
	userId, err := strconv.ParseInt(ctx.QueryParam("user_id"), 10, 64)
	if err != nil {
		return domain.NewBadRequest(domain.CodeBadRequest, "MaxBot handler: user_id must be an integer", err)
	}
	text := ctx.QueryParam("text")
	if text == "" {
		text = "пустой текстик"
	}
	if err := h.client.SendText(ctx.Request().Context(), userId, text); err != nil {
		return domain.MapAppError(ctx, err)
	}
	return domain.JSON(ctx, http.StatusOK, "status: sent")
}
