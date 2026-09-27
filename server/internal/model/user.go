package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
)

type UserDTO struct {
	ID        uuid.UUID `json:"id"`
	MaxUserID int64     `json:"max_user_id"`
	Name      *string   `json:"name"`
	City      *string   `json:"city"`
	BirthDate *string   `json:"birth_date"`
	CreatedAt time.Time `json:"created_at"`
}

func ToUserDTO(u domain.User) UserDTO {
	dto := UserDTO{
		ID:        u.ID,
		MaxUserID: u.MaxUserID,
		Name:      u.Name,
		City:      u.City,
		CreatedAt: u.CreatedAt,
	}
	if u.BirthDate != nil {
		s := u.BirthDate.Format(time.DateOnly)
		dto.BirthDate = &s
	}
	return dto
}
