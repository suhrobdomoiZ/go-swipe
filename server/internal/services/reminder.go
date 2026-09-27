package services

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/suhrobdomoiZ/go-swipe/server/internal/repository"
)

type MaxSender interface {
	SendText(ctx context.Context, userID int64, text string) error
}

type Reminder struct {
	swipes repository.ISwipe
	users  repository.IUser
	events repository.IEvent
	sender MaxSender
}

func NewReminder(swipes repository.ISwipe, users repository.IUser, events repository.IEvent, sender MaxSender) *Reminder {
	return &Reminder{swipes, users, events, sender}
}

func (r *Reminder) Run(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			r.tick(ctx)
		}
	}
}

func (r *Reminder) tick(ctx context.Context) {
	jobs, err := r.swipes.ListDueReminders(ctx, time.Now())
	if err != nil {
		slog.Error("reminder: list due reminders failed", "error", err)
		return
	}

	for _, job := range jobs {
		user, err := r.users.GetByID(ctx, job.UserID)
		if err != nil {
			slog.Error("reminder: load user failed", "user_id", job.UserID, "error", err)
			continue
		}
		event, err := r.events.GetByID(ctx, job.EventID)
		if err != nil {
			slog.Error("reminder: load event failed", "event_id", job.EventID, "error", err)
			continue
		}

		text := fmt.Sprintf("Напоминание: скоро начнётся «%s» (%s). Не пропустите!",
			event.Title, event.StartsAt.Format("02.01.2006 15:04"))
		if err := r.sender.SendText(ctx, user.MaxUserID, text); err != nil {
			slog.Error("reminder: send message failed", "user_id", job.UserID, "error", err)
			continue
		}

		if err := r.swipes.MarkReminded(ctx, job.SwipeID); err != nil {
			slog.Error("reminder: mark reminded failed", "swipe_id", job.SwipeID, "error", err)
		}
	}
}
