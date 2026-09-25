package app

import (
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	echojwt "github.com/labstack/echo-jwt/v5"
	"github.com/labstack/echo/v5"
	"github.com/suhrobdomoiZ/go-swipe/server/config"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/middleware"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/model"
	"github.com/suhrobdomoiZ/go-swipe/server/pkg/logger"
)

func InitServer(config *config.AppConfig, pool *pgxpool.Pool) (*echo.Echo, error) {
	server := echo.New()
	server.Logger = logger.InitLogger(config.Server.LogLevel())

	// repositories := InitRepositories(pool)
	// services(repositories)
	// handlers(services)

	// AddHandlers
	return server, nil
}

func AddHandlers(config *config.AppConfig, server *echo.Echo) {

}

func InitJWTConfig(secretKey []byte) echojwt.Config {
	return echojwt.Config{
		ErrorHandler: func(ctx *echo.Context, err error) error {
			err = domain.MapAppError(
				ctx,
				domain.NewUnauthorized(domain.CodeUnauthorized, "jwt middleware error", err),
			)

			return domain.MapAppError(ctx, err)
		},
		SigningKey:  secretKey,
		ContextKey:  middleware.KeyToken,
		TokenLookup: "cookie:" + domain.CookieAuthJWT,
		NewClaimsFunc: func(_ *echo.Context) jwt.Claims {
			return new(model.JWTAuthData)
		},
	}
}
