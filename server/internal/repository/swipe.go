package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
)

type Swipe struct {
	*Executor
}

func NewSwipe(executor *Executor) *Swipe { return &Swipe{executor} }

func scanSwipe(row pgx.Row) (domain.Swipe, error) {
	var s domain.Swipe
	err := row.Scan(&s.ID, &s.UserID, &s.EventID, &s.Action, &s.Confirmed, &s.RemindAt, &s.Reminded, &s.CreatedAt)
	if err != nil {
		return domain.Swipe{}, err
	}
	return s, nil
}

func (r *Swipe) Create(ctx context.Context, swipe domain.Swipe) (domain.Swipe, error) {
	query := `
		INSERT INTO swipes (user_id, event_id, action)
		VALUES ($1, $2, $3)
		RETURNING id, user_id, event_id, action, confirmed, remind_at, reminded, created_at
	`
	created, err := scanSwipe(r.GetExecutor(ctx).QueryRow(ctx, query, swipe.UserID, swipe.EventID, swipe.Action))
	if err != nil {
		if isUniqueViolation(err) {
			return domain.Swipe{}, domain.NewConflict(domain.CodeConflict, "swipe.Create: event already swiped", err)
		}
		return domain.Swipe{}, domain.NewInternalServerError(domain.CodeInternalServerError, "swipe.Create: insert swipe", err)
	}
	return created, nil
}

func scanFavorite(row pgx.Row) (domain.Favorite, error) {
	var f domain.Favorite
	var tags []byte
	err := row.Scan(
		&f.Event.ID, &f.Event.Title, &f.Event.Description, &f.Event.Category, &tags, &f.Event.City, &f.Event.Venue,
		&f.Event.StartsAt, &f.Event.EndsAt, &f.Event.Price, &f.Event.AgeLimit, &f.Event.URL, &f.Event.ImageURL,
		&f.Event.Source, &f.Event.CreatedBy, &f.Event.FetchedAt,
		&f.Confirmed, &f.RemindAt, &f.CreatedAt,
	)
	if err != nil {
		return domain.Favorite{}, err
	}
	if len(tags) > 0 {
		if err := unmarshalTags(tags, &f.Event.Tags); err != nil {
			return domain.Favorite{}, err
		}
	}
	return f, nil
}

const favoriteColumns = `
	e.id, e.title, e.description, e.category, e.tags, e.city, e.venue, e.starts_at, e.ends_at,
	e.price, e.age_limit, e.url, e.image_url, e.source, e.created_by, e.fetched_at,
	s.confirmed, s.remind_at, s.created_at
`

func (r *Swipe) ListFavorites(ctx context.Context, userID uuid.UUID, confirmed *bool) ([]domain.Favorite, error) {
	query := `SELECT ` + favoriteColumns + `
		FROM swipes s
		JOIN events e ON e.id = s.event_id
		WHERE s.user_id = $1 AND s.action = 'like'`
	args := []any{userID}
	if confirmed != nil {
		args = append(args, *confirmed)
		query += ` AND s.confirmed = $2`
	}
	query += ` ORDER BY s.confirmed, s.created_at DESC`

	rows, err := r.GetExecutor(ctx).Query(ctx, query, args...)
	if err != nil {
		return nil, domain.NewInternalServerError(domain.CodeInternalServerError, "swipe.ListFavorites: query favorites", err)
	}
	defer rows.Close()

	favorites := make([]domain.Favorite, 0)
	for rows.Next() {
		favorite, err := scanFavorite(rows)
		if err != nil {
			return nil, domain.NewInternalServerError(domain.CodeInternalServerError, "swipe.ListFavorites: scan favorite", err)
		}
		favorites = append(favorites, favorite)
	}
	if err := rows.Err(); err != nil {
		return nil, domain.NewInternalServerError(domain.CodeInternalServerError, "swipe.ListFavorites: rows error", err)
	}
	return favorites, nil
}

func (r *Swipe) UpdateFavoriteConfirmed(ctx context.Context, userID, eventID uuid.UUID, confirmed bool, remindAt *time.Time) (domain.Favorite, error) {
	query := `
		UPDATE swipes s
		SET confirmed = $3, remind_at = $4, reminded = false
		FROM events e
		WHERE s.event_id = e.id AND s.user_id = $1 AND s.event_id = $2 AND s.action = 'like'
		RETURNING ` + favoriteColumns

	favorite, err := scanFavorite(r.GetExecutor(ctx).QueryRow(ctx, query, userID, eventID, confirmed, remindAt))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Favorite{}, domain.NewNotFound(domain.CodeNotFound, "swipe.UpdateFavoriteConfirmed: favorite not found", err)
		}
		return domain.Favorite{}, domain.NewInternalServerError(domain.CodeInternalServerError, "swipe.UpdateFavoriteConfirmed: update favorite", err)
	}
	return favorite, nil
}

func (r *Swipe) Unlike(ctx context.Context, userID, eventID uuid.UUID) error {
	query := `
		UPDATE swipes
		SET action = 'skip', confirmed = false, remind_at = NULL, reminded = false
		WHERE user_id = $1 AND event_id = $2 AND action = 'like'
	`
	tag, err := r.GetExecutor(ctx).Exec(ctx, query, userID, eventID)
	if err != nil {
		return domain.NewInternalServerError(domain.CodeInternalServerError, "swipe.Unlike: update swipe", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.NewNotFound(domain.CodeNotFound, "swipe.Unlike: favorite not found")
	}
	return nil
}

func (r *Swipe) ListDueReminders(ctx context.Context, now time.Time) ([]domain.ReminderJob, error) {
	query := `
		SELECT s.id, s.user_id, s.event_id, e.starts_at
		FROM swipes s
		JOIN events e ON e.id = s.event_id
		WHERE s.confirmed = true AND s.reminded = false AND s.remind_at IS NOT NULL AND s.remind_at <= $1
	`
	rows, err := r.GetExecutor(ctx).Query(ctx, query, now)
	if err != nil {
		return nil, domain.NewInternalServerError(domain.CodeInternalServerError, "swipe.ListDueReminders: query reminders", err)
	}
	defer rows.Close()

	jobs := make([]domain.ReminderJob, 0)
	for rows.Next() {
		var job domain.ReminderJob
		if err := rows.Scan(&job.SwipeID, &job.UserID, &job.EventID, &job.StartsAt); err != nil {
			return nil, domain.NewInternalServerError(domain.CodeInternalServerError, "swipe.ListDueReminders: scan reminder", err)
		}
		jobs = append(jobs, job)
	}
	if err := rows.Err(); err != nil {
		return nil, domain.NewInternalServerError(domain.CodeInternalServerError, "swipe.ListDueReminders: rows error", err)
	}
	return jobs, nil
}

func (r *Swipe) MarkReminded(ctx context.Context, swipeID uuid.UUID) error {
	_, err := r.GetExecutor(ctx).Exec(ctx, `UPDATE swipes SET reminded = true WHERE id = $1`, swipeID)
	if err != nil {
		return domain.NewInternalServerError(domain.CodeInternalServerError, "swipe.MarkReminded: update swipe", err)
	}
	return nil
}
