package domain

import (
	"time"

	"github.com/google/uuid"
)

type SwipeAction string

const (
	SwipeLike SwipeAction = "like"
	SwipeSkip SwipeAction = "skip"
)

func (a SwipeAction) Valid() bool {
	return a == SwipeLike || a == SwipeSkip
}

type Swipe struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	EventID   uuid.UUID
	Action    SwipeAction
	Confirmed bool
	RemindAt  *time.Time
	Reminded  bool
	CreatedAt time.Time
}

type Favorite struct {
	Event     Event
	Confirmed bool
	RemindAt  *time.Time
	CreatedAt time.Time
}

type ReminderJob struct {
	SwipeID  uuid.UUID
	UserID   uuid.UUID
	EventID  uuid.UUID
	StartsAt time.Time
}
