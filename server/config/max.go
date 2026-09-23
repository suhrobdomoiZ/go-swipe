package config

type MaxConfig struct {
	BotToken string
}

func NewMaxConfig() *MaxConfig {
	token := KeyMaxBotToken.GetValue()
	return &MaxConfig{
		BotToken: token,
	}
}

func (c *MaxConfig) Token() string {
	return c.BotToken
}
