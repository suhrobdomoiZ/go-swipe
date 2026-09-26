package domain

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/labstack/echo/v5"
)

type ErrorResponse struct {
	Code AppErrorCode `json:"code"`
}

type ErrorWrapper struct {
	Error ErrorResponse `json:"error"`
}

func JSON(ctx *echo.Context, code int, data any) error {
	return ctx.JSON(code, data)
}

func MapAppError(ctx *echo.Context, err error) error {
	mapAppErr := map[AppErrorType]int{
		TypeBadRequest:          http.StatusBadRequest,
		TypeUnauthorized:        http.StatusUnauthorized,
		TypeForbidden:           http.StatusForbidden,
		TypeInternalServerError: http.StatusInternalServerError,
	}

	var appError AppError
	if errors.As(err, &appError) {
		status, ok := mapAppErr[appError.errorType]
		if ok {
			ctx.Logger().Debug("known app error", slog.String("error", err.Error()))

			return JSON(ctx, status, ErrorWrapper{Error: ErrorResponse{Code: appError.code}})
		}

		ctx.Logger().Error("unknown app error", slog.String("error", err.Error()))

		return JSON(
			ctx,
			http.StatusInternalServerError,
			ErrorWrapper{Error: ErrorResponse{Code: CodeInternalServerError}},
		)
	}

	ctx.Logger().Error("unknown error", slog.String("error", err.Error()))

	return JSON(
		ctx,
		http.StatusInternalServerError,
		ErrorWrapper{Error: ErrorResponse{Code: CodeInternalServerError}},
	)
}
