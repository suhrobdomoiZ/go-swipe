package app

import (
	"github.com/jackc/pgx/v5/pgxpool"
	echojwt "github.com/labstack/echo-jwt/v5"
	"github.com/labstack/echo/v5"
	"github.com/suhrobdomoiZ/go-swipe/server/config"
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

//func InitJWTConfig(secretKey []byte) echojwt.Config {
//	return echojwt.Config{
//
//	}
//}
