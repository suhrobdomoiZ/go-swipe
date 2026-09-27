package services

import (
	"strings"
	"time"
)

func calculateAge(birthDate, now time.Time) int {
	age := now.Year() - birthDate.Year()
	if now.Month() < birthDate.Month() || (now.Month() == birthDate.Month() && now.Day() < birthDate.Day()) {
		age--
	}
	return age
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
