package model

type OnboardingRequestDTO struct {
	City           string   `json:"city"`
	BirthDate      *string  `json:"birth_date"`
	Categories     []string `json:"categories"`
	OnboardingText *string  `json:"onboarding_text"`
}
