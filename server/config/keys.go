package config

import "github.com/suhrobdomoiZ/go-swipe/server/pkg/config"

const (
	KeyMaxBotToken config.Key = "MAX_BOT_TOKEN"

	KeyPostgresHost     config.Key = "POSTGRES_HOST"
	KeyPostgresPort     config.Key = "POSTGRES_PORT"
	KeyPostgresUser     config.Key = "POSTGRES_USER"
	KeyPostgresPassword config.Key = "POSTGRES_PASSWORD"
	KeyPostgresDatabase config.Key = "POSTGRES_DATABASE"
	KeyPostgresSSLMode  config.Key = "POSTGRES_SSL_MODE"

	KeyPort      config.Key = "PORT"
	KeyLogLevel  config.Key = "LOG_LEVEL"
	KeySecretKey config.Key = "SECRET_KEY"
)
