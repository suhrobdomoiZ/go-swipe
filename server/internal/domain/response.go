package domain

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/labstack/echo/v5"
)

type ErrorResponse struct {
	Code    AppErrorCode `json:"code"`
	Message string       `json:"message"`
}

func JSON(ctx *echo.Context, code int, data any) error {
	return ctx.JSON(code, data)
}

func MapAppError(ctx *echo.Context, err error) error {
	mapAppErr := map[AppErrorType]int{
		TypeBadRequest:          http.StatusBadRequest,
		TypeNotFound:            http.StatusNotFound,
		TypeUnauthorized:        http.StatusUnauthorized,
		TypeForbidden:           http.StatusForbidden,
		TypeConflict:            http.StatusConflict,
		TypeInternalServerError: http.StatusInternalServerError,
	}

	var appError AppError
	if errors.As(err, &appError) {
		status, ok := mapAppErr[appError.errorType]
		if ok {
			ctx.Logger().Debug("known app error", slog.String("error", err.Error()))

			return JSON(ctx, status, ErrorResponse{Code: appError.code, Message: appError.message})
		}

		ctx.Logger().Error("unknown app error", slog.String("error", err.Error()))

		return JSON(
			ctx,
			http.StatusInternalServerError,
			ErrorResponse{Code: CodeInternalServerError, Message: "internal server error"},
		)
	}

	ctx.Logger().Error("unknown error", slog.String("error", err.Error()))

	return JSON(
		ctx,
		http.StatusInternalServerError,
		ErrorResponse{Code: CodeInternalServerError, Message: "internal server error"},
	)
}
