package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
)

type User struct {
	*Executor
}

func NewUser(executor *Executor) *User { return &User{executor} }

func scanUser(row pgx.Row) (domain.User, error) {
	var u domain.User
	err := row.Scan(&u.ID, &u.MaxUserID, &u.Name, &u.City, &u.BirthDate, &u.Info, &u.CreatedAt)
	if err != nil {
		return domain.User{}, err
	}
	return u, nil
}

// name — имя из MAX; если его нет (nil), уже сохранённое имя не затирается.
func (r *User) GetOrCreateByMaxID(ctx context.Context, maxUserID int64, name *string) (domain.User, error) {
	query := `
		INSERT INTO users (max_user_id, name) VALUES ($1, $2)
		ON CONFLICT (max_user_id) DO UPDATE SET name = COALESCE(EXCLUDED.name, users.name)
		RETURNING id, max_user_id, name, city, birth_date, info, created_at
	`
	userDomain, err := scanUser(r.GetExecutor(ctx).QueryRow(ctx, query, maxUserID, name))
	if err != nil {
		return domain.User{}, domain.NewInternalServerError(domain.CodeInternalServerError, "user.GetOrCreateByMaxID: error create or update user", err)
	}
	return userDomain, nil
}

func (r *User) GetByID(ctx context.Context, id uuid.UUID) (domain.User, error) {
	query := `SELECT id, max_user_id, name, city, birth_date, info, created_at FROM users WHERE id = $1`
	userDomain, err := scanUser(r.GetExecutor(ctx).QueryRow(ctx, query, id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.User{}, domain.NewNotFound(domain.CodeNotFound, "user.GetByID: user not found", err)
		}
		return domain.User{}, domain.NewInternalServerError(domain.CodeInternalServerError, "user.GetByID: query user", err)
	}
	return userDomain, nil
}

func (r *User) UpdateOnboarding(ctx context.Context, id uuid.UUID, city string, birthDate *time.Time, info *string) (domain.User, error) {
	query := `
		UPDATE users
		SET city = $2, birth_date = COALESCE($3, birth_date), info = COALESCE($4, info)
		WHERE id = $1
		RETURNING id, max_user_id, name, city, birth_date, info, created_at
	`
	userDomain, err := scanUser(r.GetExecutor(ctx).QueryRow(ctx, query, id, city, birthDate, info))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.User{}, domain.NewNotFound(domain.CodeNotFound, "user.UpdateOnboarding: user not found", err)
		}
		return domain.User{}, domain.NewInternalServerError(domain.CodeInternalServerError, "user.UpdateOnboarding: update user", err)
	}
	return userDomain, nil
}

func (r *User) UpdateProfile(ctx context.Context, id uuid.UUID, city *string, birthDate *time.Time) (domain.User, error) {
	query := `
		UPDATE users
		SET city = COALESCE($2, city), birth_date = COALESCE($3, birth_date)
		WHERE id = $1
		RETURNING id, max_user_id, name, city, birth_date, info, created_at
	`
	userDomain, err := scanUser(r.GetExecutor(ctx).QueryRow(ctx, query, id, city, birthDate))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.User{}, domain.NewNotFound(domain.CodeNotFound, "user.UpdateProfile: user not found", err)
		}
		return domain.User{}, domain.NewInternalServerError(domain.CodeInternalServerError, "user.UpdateProfile: update user", err)
	}
	return userDomain, nil
}
