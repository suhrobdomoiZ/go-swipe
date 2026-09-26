package app

import (
	"github.com/suhrobdomoiZ/go-swipe/server/config"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/services"
)

type Services struct {
	auth *services.Auth
}

func InitServices(config *config.AppConfig, repositories *Repositories) *Services {
	return &Services{
		auth: services.NewAuth(config.Server, repositories.user),
	}
}
