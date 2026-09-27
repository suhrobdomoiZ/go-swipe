package domain

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID        uuid.UUID
	MaxUserID int64
	Name      *string
	City      *string
	BirthDate *time.Time
	Info      *string
	CreatedAt time.Time
}

func (u User) NeedsOnboarding() bool {
	return u.City == nil
}
