package config

type MaxConfig struct {
	botToken string
}

func NewMaxConfig() *MaxConfig {
	token := KeyMaxBotToken.GetValue()
	return &MaxConfig{
		botToken: token,
	}
}

func (c *MaxConfig) Token() string {
	return c.botToken
}
