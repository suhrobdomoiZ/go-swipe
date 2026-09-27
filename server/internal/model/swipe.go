package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
)

type SwipeRequestDTO struct {
	Action string `json:"action"`
}

type SwipeDTO struct {
	ID        uuid.UUID `json:"id"`
	EventID   uuid.UUID `json:"event_id"`
	Action    string    `json:"action"`
	Confirmed bool      `json:"confirmed"`
	CreatedAt time.Time `json:"created_at"`
}

func ToSwipeDTO(s domain.Swipe) SwipeDTO {
	return SwipeDTO{
		ID:        s.ID,
		EventID:   s.EventID,
		Action:    string(s.Action),
		Confirmed: s.Confirmed,
		CreatedAt: s.CreatedAt,
	}
}
