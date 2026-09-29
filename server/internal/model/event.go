package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
)

type EventDTO struct {
	ID          uuid.UUID  `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Category    string     `json:"category"`
	Tags        []string   `json:"tags"`
	City        string     `json:"city"`
	Venue       *string    `json:"venue"`
	StartsAt    time.Time  `json:"starts_at"`
	EndsAt      *time.Time `json:"ends_at"`
	Price       int        `json:"price"`
	AgeLimit    int        `json:"age_limit"`
	URL         *string    `json:"url"`
	ImageURL    *string    `json:"image_url"`
	Status      string     `json:"status"`
	Source      string     `json:"source"`
	IsSynthetic bool       `json:"is_synthetic"`
	CreatedBy   *uuid.UUID `json:"created_by"`
	FetchedAt   time.Time  `json:"fetched_at"`
}

func ToEventDTO(e domain.Event) EventDTO {
	tags := e.Tags
	if tags == nil {
		tags = []string{}
	}
	return EventDTO{
		ID:          e.ID,
		Title:       e.Title,
		Description: e.Description,
		Category:    string(e.Category),
		Tags:        tags,
		City:        e.City,
		Venue:       e.Venue,
		StartsAt:    e.StartsAt,
		EndsAt:      e.EndsAt,
		Price:       e.Price,
		AgeLimit:    e.AgeLimit,
		URL:         e.URL,
		ImageURL:    e.ImageURL,
		Status:      string(e.Status()),
		Source:      string(e.Source),
		IsSynthetic: e.IsSynthetic(),
		CreatedBy:   e.CreatedBy,
		FetchedAt:   e.FetchedAt,
	}
}

func ToEventDTOs(events []domain.Event) []EventDTO {
	dtos := make([]EventDTO, 0, len(events))
	for _, e := range events {
		dtos = append(dtos, ToEventDTO(e))
	}
	return dtos
}

type EventListDTO struct {
	Items []EventDTO `json:"items"`
	Total int        `json:"total"`
}

func ToEventListDTO(events []domain.Event, total int) EventListDTO {
	return EventListDTO{Items: ToEventDTOs(events), Total: total}
}

type EventInputDTO struct {
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Category    string     `json:"category"`
	Tags        []string   `json:"tags"`
	City        string     `json:"city"`
	Venue       *string    `json:"venue"`
	StartsAt    time.Time  `json:"starts_at"`
	EndsAt      *time.Time `json:"ends_at"`
	Price       int        `json:"price"`
	AgeLimit    int        `json:"age_limit"`
	URL         *string    `json:"url"`
	ImageURL    *string    `json:"image_url"`
}
