package app

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/repository"
)

type Repositories struct {
	txManager repository.TransactionManager
	user      repository.IUser
}

func InitRepositories(pool *pgxpool.Pool) *Repositories {
	executor := repository.NewExecutor(pool)
	user := repository.NewUser(executor)

	return &Repositories{
		txManager: executor,
		user:      user,
	}
}
