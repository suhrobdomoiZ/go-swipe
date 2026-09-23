package config

import "os"

type Key string

func (k Key) GetValue() string {
	return os.Getenv(string(k))
}

func (k Key) GetValueDefault(defaultValue string) string {
	value := k.GetValue()
	if value == "" {
		return defaultValue
	}
	return value
}
