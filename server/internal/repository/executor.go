package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Executor struct {
	pool *pgxpool.Pool
}

func NewExecutor(pool *pgxpool.Pool) *Executor {
	return &Executor{pool: pool}
}

func (e *Executor) WithTransaction(
	ctx context.Context,
	function func(ctx context.Context) error,
) error {
	return pgx.BeginFunc(ctx, e.pool, func(tx pgx.Tx) error {
		txCtx := context.WithValue(ctx, KeyTx, tx)

		return function(txCtx)
	})
}

func (e *Executor) GetExecutor(ctx context.Context) IExecutor {
	tx, ok := ctx.Value(KeyTx).(pgx.Tx)
	if ok {
		return tx
	}

	return e.pool
}
