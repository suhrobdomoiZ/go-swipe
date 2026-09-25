package handlers

import (
	"net/http"

	"github.com/labstack/echo/v5"
)

type Health struct{}

func NewHealth() *Health {
	return &Health{}
}

func (h *Health) Health(ctx *echo.Context) error {
	return ctx.NoContent(http.StatusOK)
}
