package services

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/repository"
)

const remindBefore = 3 * time.Hour

type Favorites struct {
	swipes repository.ISwipe
	events repository.IEvent
}

func NewFavorites(swipes repository.ISwipe, events repository.IEvent) *Favorites {
	return &Favorites{swipes, events}
}

func (s *Favorites) List(ctx context.Context, userID uuid.UUID, confirmed *bool) ([]domain.Favorite, error) {
	return s.swipes.ListFavorites(ctx, userID, confirmed)
}

func (s *Favorites) Confirm(ctx context.Context, userID, eventID uuid.UUID, confirmed bool) (domain.Favorite, error) {
	var remindAt *time.Time
	if confirmed {
		event, err := s.events.GetByID(ctx, eventID)
		if err != nil {
			return domain.Favorite{}, err
		}
		t := event.StartsAt.Add(-remindBefore)
		if now := time.Now(); t.Before(now) {
			t = now
		}
		remindAt = &t
	}
	return s.swipes.UpdateFavoriteConfirmed(ctx, userID, eventID, confirmed, remindAt)
}

func (s *Favorites) Remove(ctx context.Context, userID, eventID uuid.UUID) error {
	return s.swipes.Unlike(ctx, userID, eventID)
}
