package config

import (
	"fmt"
	"log/slog"
	"strconv"
)

const defaultPort = 8080

type ServerConfig struct {
	port     int
	logLevel slog.Level
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
	return &ServerConfig{
		port:     port,
		logLevel: logLevel,
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
