package app

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/repository"
)

type Repositories struct {
	txManager repository.TransactionManager
	user      repository.IUser
	event     repository.IEvent
	swipe     repository.ISwipe
	interest  repository.IUserInterest
}

func InitRepositories(pool *pgxpool.Pool) *Repositories {
	executor := repository.NewExecutor(pool)
	user := repository.NewUser(executor)
	event := repository.NewEvent(executor)
	swipe := repository.NewSwipe(executor)
	interest := repository.NewUserInterest(executor)

	return &Repositories{
		txManager: executor,
		user:      user,
		event:     event,
		swipe:     swipe,
		interest:  interest,
	}
}
