package app

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/repository"
)

type Repositories struct {
	txManager repository.TransactionManager
	// Интерфейсы репозиториев
}

func InitRepositories(pool *pgxpool.Pool) *Repositories {
	executor := repository.NewExecutor(pool)

	return &Repositories{
		txManager: executor,
	}
}
