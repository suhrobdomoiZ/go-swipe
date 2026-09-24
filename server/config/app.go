package config

type AppConfig struct {
	Max      *MaxConfig
	Server   *ServerConfig
	Postgres *PostgresConfig
}

func NewAppConfig() *AppConfig {
	return &AppConfig{
		Max:      NewMaxConfig(),
		Server:   NewServerConfig(),
		Postgres: NewPostgresConfig(),
	}
}
