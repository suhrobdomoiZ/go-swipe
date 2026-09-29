package services

import (
	"strings"
	"time"

	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
)

const (
	minPlausibleAge = 10
	maxPlausibleAge = 110
)

func calculateAge(birthDate, now time.Time) int {
	age := now.Year() - birthDate.Year()
	if now.Month() < birthDate.Month() || (now.Month() == birthDate.Month() && now.Day() < birthDate.Day()) {
		age--
	}
	return age
}

func validateBirthDate(birthDate *time.Time) error {
	if birthDate == nil {
		return nil
	}
	age := calculateAge(*birthDate, time.Now())
	if age < minPlausibleAge || age > maxPlausibleAge {
		return domain.NewBadRequest(domain.CodeBadRequest, "birth date gives an implausible age")
	}
	return nil
}

func truncateRunes(s string, max int) string {
	runes := []rune(s)
	if len(runes) <= max {
		return s
	}
	return string(runes[:max])
}

func normalizeTag(tag string) string {
	return truncateRunes(strings.ToLower(strings.TrimSpace(tag)), 128)
}
