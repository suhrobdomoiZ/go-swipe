package model

import (
	"time"

	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
)

type FavoriteItemDTO struct {
	Event     EventDTO   `json:"event"`
	Confirmed bool       `json:"confirmed"`
	RemindAt  *time.Time `json:"remind_at"`
	CreatedAt time.Time  `json:"created_at"`
}

func ToFavoriteItemDTO(f domain.Favorite) FavoriteItemDTO {
	return FavoriteItemDTO{
		Event:     ToEventDTO(f.Event),
		Confirmed: f.Confirmed,
		RemindAt:  f.RemindAt,
		CreatedAt: f.CreatedAt,
	}
}

func ToFavoriteItemDTOs(favorites []domain.Favorite) []FavoriteItemDTO {
	dtos := make([]FavoriteItemDTO, 0, len(favorites))
	for _, f := range favorites {
		dtos = append(dtos, ToFavoriteItemDTO(f))
	}
	return dtos
}

type FavoriteListDTO struct {
	Items []FavoriteItemDTO `json:"items"`
}

type FavoritePatchRequestDTO struct {
	Confirmed *bool `json:"confirmed"`
}
