package config

import (
	"fmt"
	"net"
)

type PostgresConfig struct {
	host     string
	port     string
	user     string
	password string
	dbName   string
	sslMode  string
}

func NewPostgresConfig() *PostgresConfig {
	host := KeyPostgresHost.GetValue()
	port := KeyPostgresPort.GetValue()
	user := KeyPostgresUser.GetValue()
	password := KeyPostgresPassword.GetValue()
	dbName := KeyPostgresDatabase.GetValue()
	sslMode := KeyPostgresSSLMode.GetValue()
	return &PostgresConfig{
		host:     host,
		port:     port,
		user:     user,
		password: password,
		dbName:   dbName,
		sslMode:  sslMode,
	}
}

func (p *PostgresConfig) DSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s/%s?sslmode=%s",
		p.user,
		p.password,
		net.JoinHostPort(p.host, p.port),
		p.dbName,
		p.sslMode,
	)
}
