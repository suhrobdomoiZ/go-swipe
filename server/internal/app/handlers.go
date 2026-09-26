package app

import (
	"github.com/suhrobdomoiZ/go-swipe/server/config"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/handlers"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/maxclient"
)

type Handlers struct {
	health *handlers.Health
	maxBot *handlers.MaxBot
}

func InitHandlers(config *config.AppConfig, services *Services, maxClient *maxclient.Client) *Handlers {
	return &Handlers{
		handlers.NewHealth(),
		handlers.NewMaxBot(maxClient),
	}
}
