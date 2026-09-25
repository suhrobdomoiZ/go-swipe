package app

import (
	"github.com/suhrobdomoiZ/go-swipe/server/config"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/handlers"
)

type Handlers struct {
	health *handlers.Health
}

func InitHandlers(config *config.AppConfig, services *Services) *Handlers {
	return &Handlers{}
}
