package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/repository"
)

type Swipes struct {
	swipes    repository.ISwipe
	events    repository.IEvent
	interests repository.IUserInterest
	tx        repository.TransactionManager
}

func NewSwipes(swipes repository.ISwipe, events repository.IEvent, interests repository.IUserInterest, tx repository.TransactionManager) *Swipes {
	return &Swipes{swipes, events, interests, tx}
}

func (s *Swipes) Create(ctx context.Context, userID, eventID uuid.UUID, action string) (domain.Swipe, error) {
	swipeAction := domain.SwipeAction(action)
	if !swipeAction.Valid() {
		return domain.Swipe{}, domain.NewBadRequest(domain.CodeBadRequest, "swipes.Create: action must be like or skip")
	}

	event, err := s.events.GetByID(ctx, eventID)
	if err != nil {
		return domain.Swipe{}, err
	}
	if event.Status() == domain.EventStatusFinished {
		return domain.Swipe{}, domain.NewBadRequest(domain.CodeBadRequest, "swipes.Create: event has already finished")
	}

	categoryDelta := 1.0
	if swipeAction == domain.SwipeSkip {
		categoryDelta = -0.5
	}
	tagDelta := categoryDelta * categoryTagScoreWeight

	var swipe domain.Swipe
	err = s.tx.WithTransaction(ctx, func(ctx context.Context) error {
		created, err := s.swipes.Create(ctx, domain.Swipe{UserID: userID, EventID: eventID, Action: swipeAction})
		if err != nil {
			return err
		}
		swipe = created

		weights := map[string]float64{string(event.Category): categoryDelta}
		for _, tag := range event.Tags {
			weights[tag] += tagDelta
		}
		return s.interests.IncrementWeights(ctx, userID, weights)
	})
	if err != nil {
		return domain.Swipe{}, err
	}
	return swipe, nil
}
