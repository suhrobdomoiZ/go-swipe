package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
)

type Event struct {
	*Executor
}

func NewEvent(executor *Executor) *Event { return &Event{executor} }

const eventColumns = `
	id, title, description, category, tags, city, venue, starts_at, ends_at,
	price, age_limit, url, image_url, source, created_by, fetched_at
`

func scanEvent(row pgx.Row) (domain.Event, error) {
	var e domain.Event
	var tags []byte
	err := row.Scan(
		&e.ID, &e.Title, &e.Description, &e.Category, &tags, &e.City, &e.Venue,
		&e.StartsAt, &e.EndsAt, &e.Price, &e.AgeLimit, &e.URL, &e.ImageURL,
		&e.Source, &e.CreatedBy, &e.FetchedAt,
	)
	if err != nil {
		return domain.Event{}, err
	}
	if len(tags) > 0 {
		if err := unmarshalTags(tags, &e.Tags); err != nil {
			return domain.Event{}, err
		}
	}
	return e, nil
}

func unmarshalTags(data []byte, tags *[]string) error {
	return json.Unmarshal(data, tags)
}

func (r *Event) Create(ctx context.Context, e domain.Event) (domain.Event, error) {
	tags, err := json.Marshal(e.Tags)
	if err != nil {
		return domain.Event{}, domain.NewInternalServerError(domain.CodeInternalServerError, "event.Create: marshal tags", err)
	}

	query := `
		INSERT INTO events (title, description, category, tags, city, venue, starts_at, ends_at, price, age_limit, url, image_url, source, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING ` + eventColumns

	row := r.GetExecutor(ctx).QueryRow(ctx, query,
		e.Title, e.Description, e.Category, tags, e.City, e.Venue, e.StartsAt, e.EndsAt,
		e.Price, e.AgeLimit, e.URL, e.ImageURL, e.Source, e.CreatedBy,
	)
	created, err := scanEvent(row)
	if err != nil {
		return domain.Event{}, domain.NewInternalServerError(domain.CodeInternalServerError, "event.Create: insert event", err)
	}
	return created, nil
}

func (r *Event) Update(ctx context.Context, e domain.Event) (domain.Event, error) {
	tags, err := json.Marshal(e.Tags)
	if err != nil {
		return domain.Event{}, domain.NewInternalServerError(domain.CodeInternalServerError, "event.Update: marshal tags", err)
	}

	query := `
		UPDATE events
		SET title = $2, description = $3, category = $4, tags = $5, city = $6, venue = $7,
		    starts_at = $8, ends_at = $9, price = $10, age_limit = $11, url = $12, image_url = $13
		WHERE id = $1
		RETURNING ` + eventColumns

	row := r.GetExecutor(ctx).QueryRow(ctx, query,
		e.ID, e.Title, e.Description, e.Category, tags, e.City, e.Venue,
		e.StartsAt, e.EndsAt, e.Price, e.AgeLimit, e.URL, e.ImageURL,
	)
	updated, err := scanEvent(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Event{}, domain.NewNotFound(domain.CodeNotFound, "event.Update: event not found", err)
		}
		return domain.Event{}, domain.NewInternalServerError(domain.CodeInternalServerError, "event.Update: update event", err)
	}
	return updated, nil
}

func (r *Event) GetByID(ctx context.Context, id uuid.UUID) (domain.Event, error) {
	query := `SELECT ` + eventColumns + ` FROM events WHERE id = $1`
	event, err := scanEvent(r.GetExecutor(ctx).QueryRow(ctx, query, id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Event{}, domain.NewNotFound(domain.CodeNotFound, "event.GetByID: event not found", err)
		}
		return domain.Event{}, domain.NewInternalServerError(domain.CodeInternalServerError, "event.GetByID: query event", err)
	}
	return event, nil
}

func (r *Event) ListFeed(ctx context.Context, filter EventFeedFilter) ([]domain.Event, error) {
	query := `SELECT ` + eventColumns + ` FROM events e
		WHERE e.city = $1
		  AND e.starts_at > now()
		  AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.user_id = $2 AND s.event_id = e.id)`
	args := []any{filter.City, filter.UserID}

	if filter.Query != nil && *filter.Query != "" {
		args = append(args, "%"+*filter.Query+"%")
		query += fmt.Sprintf(" AND e.title ILIKE $%d", len(args))
	}
	if filter.Category != nil {
		args = append(args, *filter.Category)
		query += fmt.Sprintf(" AND e.category = $%d", len(args))
	}
	if filter.IsFree != nil && *filter.IsFree {
		query += " AND e.price = 0"
	}
	if filter.PriceMax != nil {
		args = append(args, *filter.PriceMax)
		query += fmt.Sprintf(" AND e.price <= $%d", len(args))
	}
	if filter.AgeLimit != nil {
		args = append(args, *filter.AgeLimit)
		query += fmt.Sprintf(" AND e.age_limit <= $%d", len(args))
	}
	if filter.DateFrom != nil {
		args = append(args, *filter.DateFrom)
		query += fmt.Sprintf(" AND e.starts_at >= $%d", len(args))
	}
	if filter.DateTo != nil {
		args = append(args, *filter.DateTo)
		query += fmt.Sprintf(" AND e.starts_at <= $%d", len(args))
	}

	rows, err := r.GetExecutor(ctx).Query(ctx, query, args...)
	if err != nil {
		return nil, domain.NewInternalServerError(domain.CodeInternalServerError, "event.ListFeed: query events", err)
	}
	defer rows.Close()

	events := make([]domain.Event, 0)
	for rows.Next() {
		event, err := scanEvent(rows)
		if err != nil {
			return nil, domain.NewInternalServerError(domain.CodeInternalServerError, "event.ListFeed: scan event", err)
		}
		events = append(events, event)
	}
	if err := rows.Err(); err != nil {
		return nil, domain.NewInternalServerError(domain.CodeInternalServerError, "event.ListFeed: rows error", err)
	}
	return events, nil
}

func (r *Event) ListMine(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Event, int, error) {
	var total int
	countQuery := `SELECT count(*) FROM events WHERE created_by = $1`
	if err := r.GetExecutor(ctx).QueryRow(ctx, countQuery, userID).Scan(&total); err != nil {
		return nil, 0, domain.NewInternalServerError(domain.CodeInternalServerError, "event.ListMine: count events", err)
	}

	query := `SELECT ` + eventColumns + ` FROM events
		WHERE created_by = $1
		ORDER BY starts_at DESC
		LIMIT $2 OFFSET $3`
	rows, err := r.GetExecutor(ctx).Query(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, 0, domain.NewInternalServerError(domain.CodeInternalServerError, "event.ListMine: query events", err)
	}
	defer rows.Close()

	events := make([]domain.Event, 0)
	for rows.Next() {
		event, err := scanEvent(rows)
		if err != nil {
			return nil, 0, domain.NewInternalServerError(domain.CodeInternalServerError, "event.ListMine: scan event", err)
		}
		events = append(events, event)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, domain.NewInternalServerError(domain.CodeInternalServerError, "event.ListMine: rows error", err)
	}
	return events, total, nil
}
