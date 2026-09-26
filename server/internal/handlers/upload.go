package handlers

import (
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/model"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/services"
)

type Upload struct {
	service *services.Upload
}

func NewUpload(service *services.Upload) *Upload {
	return &Upload{service}
}

func (h *Upload) Create(ctx *echo.Context) error {
	fileHeader, err := ctx.FormFile("file")
	if err != nil {
		return domain.MapAppError(ctx, domain.NewBadRequest(domain.CodeBadRequest, "uploads.Create: file is required", err))
	}

	url, err := h.service.Save(ctx.Request().Context(), fileHeader)
	if err != nil {
		return domain.MapAppError(ctx, err)
	}

	return ctx.JSON(http.StatusCreated, model.UploadResponseDTO{URL: url})
}
