package repository

import (
	"context"

	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
)

type User struct {
	*Executor
}

func NewUser(executor *Executor) *User { return &User{executor} }

func (r *User) GetOrCreateByMaxID(ctx context.Context, maxUserID int64) (domain.User, error) {
	var userDomain domain.User
	query := `
		INSERT INTO users (max_user_id) VALUES ($1)
		ON CONFLICT (max_user_id) DO UPDATE SET max_user_id = EXCLUDED.max_user_id
		RETURNING id, max_user_id, name, city, birth_date, info, created_at
	`
	err := r.GetExecutor(ctx).QueryRow(ctx, query, maxUserID).Scan(&userDomain)

	if err != nil {
		return domain.User{}, domain.NewInternalServerError(domain.CodeInternalServerError, "user.GetOrCreateByMaxID: error create or update user", err)
	}
	return userDomain, nil
}
