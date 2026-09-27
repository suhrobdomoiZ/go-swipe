package services

import "github.com/labstack/echo/v5"

type IAuth interface {
	Login(ctx *echo.Context) error
}
