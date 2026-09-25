package domain

import (
	"errors"
	"fmt"
)

type (
	AppErrorType int
	AppErrorCode string
)

const (
	TypeBadRequest AppErrorType = iota
	TypeNotFound
	TypeUnauthorized
	TypeForbidden
	TypeInternalServerError
)

const (
	CodeBadRequest          AppErrorCode = "BAD_REQUEST"
	CodeNotFound            AppErrorCode = "NOT_FOUND"
	CodeUnauthorized        AppErrorCode = "UNAUTHORIZED"
	CodeForbidden           AppErrorCode = "FORBIDDEN"
	CodeInternalServerError AppErrorCode = "INTERNAL_SERVER_ERROR"
)

type AppError struct {
	errorType AppErrorType
	code      AppErrorCode
	message   string
	err       error
}

func NewAppError(
	errorType AppErrorType,
	code AppErrorCode,
	message string,
	errs ...error,
) AppError {
	return AppError{
		errorType: errorType,
		code:      code,
		message:   message,
		err:       errors.Join(errs...),
	}
}

func NewBadRequest(code AppErrorCode, message string, errs ...error) AppError {
	return NewAppError(TypeBadRequest, code, message, errs...)
}

func NewNotFound(code AppErrorCode, message string, errs ...error) AppError {
	return NewAppError(TypeNotFound, code, message, errs...)
}

func NewUnauthorized(code AppErrorCode, message string, errs ...error) AppError {
	return NewAppError(TypeUnauthorized, code, message, errs...)
}

func NewForbidden(code AppErrorCode, message string, errs ...error) AppError {
	return NewAppError(TypeForbidden, code, message, errs...)
}

func NewInternalServerError(code AppErrorCode, message string, errs ...error) AppError {
	return NewAppError(TypeInternalServerError, code, message, errs...)
}

func (a AppError) Error() string {
	return fmt.Errorf("(%s) %s: %w", a.code, a.message, a.err).Error()
}
