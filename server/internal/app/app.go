package app

import (
	"context"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	echojwt "github.com/labstack/echo-jwt/v5"
	"github.com/labstack/echo/v5"
	echomw "github.com/labstack/echo/v5/middleware"
	"github.com/suhrobdomoiZ/go-swipe/server/config"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/maxclient"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/middleware"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/model"
	"github.com/suhrobdomoiZ/go-swipe/server/pkg/logger"
)

const reminderInterval = time.Minute

const maxUploadBodySize = 6 << 20

func InitServer(ctx context.Context, config *config.AppConfig, pool *pgxpool.Pool) (*echo.Echo, error) {
	server := echo.New()
	server.Logger = logger.InitLogger(config.Server.LogLevel())

	maxClient, err := maxclient.New(config.Max.Token())
	if err != nil {
		return nil, err
	}

	repositories := InitRepositories(pool)
	services := InitServices(config, repositories, maxClient)
	handlers := InitHandlers(config, services, maxClient)

	AddHandlers(config, server, handlers)

	go services.reminder.Run(ctx, reminderInterval)

	return server, nil
}

func AddHandlers(config *config.AppConfig, server *echo.Echo, handlers *Handlers) {
	jwtConfig := InitJWTConfig(config.Server.SecretKey())

	server.Use(echomw.Recover())
	server.Use(echomw.RequestLogger())
	server.Use(echomw.CORSWithConfig(echomw.CORSConfig{
		AllowOrigins: config.Server.CORSOrigins(), // []string
		AllowMethods: []string{
			http.MethodGet, http.MethodPost, http.MethodPatch,
			http.MethodDelete, http.MethodOptions,
		},
		AllowHeaders: []string{"Authorization", "Content-Type"},
		MaxAge:       86400, // браузер кэширует preflight на сутки
	}))

	server.GET("/health", handlers.health.Health)
	server.GET("/test-bot", handlers.maxBot.SendMessage)
	server.POST("/api/auth/max", handlers.auth.Login)

	server.Static("/uploads", uploadsDir)

	api := server.Group("/api")
	api.Use(echojwt.WithConfig(jwtConfig))

	api.POST("/auth/onboarding", handlers.auth.Onboarding)

	api.GET("/events", handlers.events.Feed)
	api.POST("/events", handlers.events.Create)
	api.GET("/events/mine", handlers.events.Mine)
	api.GET("/events/:eventId", handlers.events.GetByID)
	api.POST("/events/:eventId/swipe", handlers.swipes.Create)

	api.GET("/favorites", handlers.favorites.List)
	api.PATCH("/favorites/:eventId", handlers.favorites.Confirm)
	api.DELETE("/favorites/:eventId", handlers.favorites.Remove)

	api.GET("/profile", handlers.profile.Get)
	api.PATCH("/profile", handlers.profile.Update)

	api.POST("/uploads", handlers.upload.Create, echomw.BodyLimit(maxUploadBodySize))
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
		TokenLookup: "header:Authorization:Bearer ",
		NewClaimsFunc: func(_ *echo.Context) jwt.Claims {
			return new(model.JWTAuthData)
		},
	}
}
