package config

type AppConfig struct {
	Max      *MaxConfig
	Server   *ServerConfig
	Postgres *PostgresConfig
}

func NewAppConfig(maxConfig *MaxConfig, serverConfig *ServerConfig, postgresConfig *PostgresConfig) *AppConfig {
	return &AppConfig{
		Max:      maxConfig,
		Server:   serverConfig,
		Postgres: postgresConfig,
	}
}
