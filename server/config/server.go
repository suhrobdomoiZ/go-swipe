package config

import (
	"fmt"
	"log/slog"
	"strconv"
)

type ServerConfig struct {
	port      int
	logLevel  slog.Level
	secretKey []byte
}

func NewServerConfig() (*ServerConfig, error) {
	port, err := strconv.Atoi(KeyPort.GetValue())
	if err != nil {
		return nil, err
	}

	var logLevel slog.Level
	err = logLevel.UnmarshalText([]byte(KeyLogLevel.GetValueDefault(slog.LevelInfo.String())))
	if err != nil {
		return nil, err
	}

	secretKey := []byte(KeySecretKey.GetValueDefault("secret-key"))
	return &ServerConfig{
		port:      port,
		logLevel:  logLevel,
		secretKey: secretKey,
	}, nil
}

func (c *ServerConfig) Port() int {
	return c.port
}

func (c *ServerConfig) Address() string {
	return fmt.Sprintf(":%d", c.port)
}

func (c *ServerConfig) LogLevel() slog.Level {
	return c.logLevel
}

func (c *ServerConfig) SecretKey() []byte {
	return c.secretKey
}
