package main

import (
	"context"

	"github.com/suhrobdomoiZ/go-swipe/server/config"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/app"
	"github.com/suhrobdomoiZ/go-swipe/server/pkg/postgres"
)

func main() {
	srvConfig, err := config.NewServerConfig()
	if err != nil {
		panic(err)
	}

	config := config.NewAppConfig(
		config.NewMaxConfig(),
		srvConfig,
		config.NewPostgresConfig(),
	)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pool, err := postgres.NewPool(ctx, config.Postgres.DSN())
	if err != nil {
		panic(err)
	}

	server, err := app.InitServer(config, pool)
	if err != nil {
		panic(err)
	}
	err = server.Start(config.Server.Address())
	if err != nil {
		panic(err)
	}
}
