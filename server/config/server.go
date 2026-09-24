package config

import (
	"fmt"
	"log/slog"
	"strconv"
)

const defaultPort = 8080

type ServerConfig struct {
	port     int
	logLevel string
}

func NewServerConfig() *ServerConfig {
	port, err := strconv.Atoi(KeyPort.GetValue())
	if err != nil {
		port = defaultPort
	}

	logLevel := KeyLogLevel.GetValueDefault(slog.LevelInfo.String())
	return &ServerConfig{
		port:     port,
		logLevel: logLevel,
	}
}

func (c *ServerConfig) Port() int {
	return c.port
}

func (c *ServerConfig) Address() string {
	return fmt.Sprintf(":%d", c.port)
}

func (c *ServerConfig) LogLevel() string {
	return c.logLevel
}
