package app

import (
	"github.com/suhrobdomoiZ/go-swipe/server/config"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/services"
)

const uploadsDir = "./uploads"

type Services struct {
	auth      *services.Auth
	events    *services.Events
	swipes    *services.Swipes
	favorites *services.Favorites
	profile   *services.Profile
	upload    *services.Upload
	reminder  *services.Reminder
}

func InitServices(config *config.AppConfig, repositories *Repositories, sender services.MaxSender) *Services {
	return &Services{
		auth:      services.NewAuth(config.Server, repositories.user, repositories.interest, repositories.txManager),
		events:    services.NewEvents(repositories.event, repositories.user, repositories.interest),
		swipes:    services.NewSwipes(repositories.swipe, repositories.event, repositories.interest, repositories.txManager),
		favorites: services.NewFavorites(repositories.swipe, repositories.event),
		profile:   services.NewProfile(repositories.user, repositories.interest, repositories.txManager),
		upload:    services.NewUpload(uploadsDir),
		reminder:  services.NewReminder(repositories.swipe, repositories.user, repositories.event, sender),
	}
}
