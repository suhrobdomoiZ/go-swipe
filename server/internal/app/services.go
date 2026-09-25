package app

import "github.com/suhrobdomoiZ/go-swipe/server/config"

type Services struct {
	// Сервисы
}

func InitServices(config *config.AppConfig, repositories *Repositories) *Services {
	return &Services{}
}
