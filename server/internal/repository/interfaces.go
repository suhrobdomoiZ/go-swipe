package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
)

type repositoryCtxtKey string

const KeyTx repositoryCtxtKey = "pgx_tx"

type IExecutor interface {
	Exec(
		ctx context.Context,
		sql string,
		arguments ...any,
	) (commandTag pgconn.CommandTag, err error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

type TransactionManager interface {
	WithTransaction(ctx context.Context, function func(ctx context.Context) error) error
}

type IUser interface {
	GetOrCreateByMaxID(ctx context.Context, maxUserID int64, name *string) (domain.User, error)
	GetByID(ctx context.Context, id uuid.UUID) (domain.User, error)

	UpdateOnboarding(ctx context.Context, id uuid.UUID, city string, birthDate *time.Time, info *string) (domain.User, error)
	UpdateProfile(ctx context.Context, id uuid.UUID, city *string, birthDate *time.Time) (domain.User, error)
}

type EventFeedFilter struct {
	UserID   uuid.UUID
	City     string
	Query    *string
	Category *domain.EventCategory
	IsFree   *bool
	PriceMax *int
	AgeLimit *int
	DateFrom *time.Time
	DateTo   *time.Time
}

type IEvent interface {
	Create(ctx context.Context, event domain.Event) (domain.Event, error)
	Update(ctx context.Context, event domain.Event) (domain.Event, error)
	GetByID(ctx context.Context, id uuid.UUID) (domain.Event, error)

	ListFeed(ctx context.Context, filter EventFeedFilter) ([]domain.Event, error)
	ListMine(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Event, int, error)
}

type ISwipe interface {
	Create(ctx context.Context, swipe domain.Swipe) (domain.Swipe, error)
	ListFavorites(ctx context.Context, userID uuid.UUID, confirmed *bool) ([]domain.Favorite, error)
	UpdateFavoriteConfirmed(ctx context.Context, userID, eventID uuid.UUID, confirmed bool, remindAt *time.Time) (domain.Favorite, error)

	Unlike(ctx context.Context, userID, eventID uuid.UUID) error
	ListDueReminders(ctx context.Context, now time.Time) ([]domain.ReminderJob, error)
	MarkReminded(ctx context.Context, swipeID uuid.UUID) error
}

type IUserInterest interface {
	IncrementWeights(ctx context.Context, userID uuid.UUID, deltas map[string]float64) error
	UpsertMany(ctx context.Context, userID uuid.UUID, interests []domain.Interest) error
	RemoveTags(ctx context.Context, userID uuid.UUID, tags []string) error
	List(ctx context.Context, userID uuid.UUID) ([]domain.Interest, error)
}
