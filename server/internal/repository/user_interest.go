package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
)

type UserInterest struct {
	*Executor
}

func NewUserInterest(executor *Executor) *UserInterest { return &UserInterest{executor} }

func (r *UserInterest) IncrementWeights(ctx context.Context, userID uuid.UUID, deltas map[string]float64) error {
	query := `
		INSERT INTO user_interests (user_id, tag, weight) VALUES ($1, $2, $3)
		ON CONFLICT (user_id, tag) DO UPDATE SET weight = user_interests.weight + EXCLUDED.weight
	`
	for tag, delta := range deltas {
		if delta == 0 {
			continue
		}
		if _, err := r.GetExecutor(ctx).Exec(ctx, query, userID, tag, delta); err != nil {
			return domain.NewInternalServerError(domain.CodeInternalServerError, "user_interest.IncrementWeights: upsert weight", err)
		}
	}
	return nil
}

func (r *UserInterest) ReplaceAll(ctx context.Context, userID uuid.UUID, interests []domain.Interest) error {
	if _, err := r.GetExecutor(ctx).Exec(ctx, `DELETE FROM user_interests WHERE user_id = $1`, userID); err != nil {
		return domain.NewInternalServerError(domain.CodeInternalServerError, "user_interest.ReplaceAll: delete old weights", err)
	}
	for _, interest := range interests {
		_, err := r.GetExecutor(ctx).Exec(ctx,
			`INSERT INTO user_interests (user_id, tag, weight) VALUES ($1, $2, $3)`,
			userID, interest.Tag, interest.Weight,
		)
		if err != nil {
			return domain.NewInternalServerError(domain.CodeInternalServerError, "user_interest.ReplaceAll: insert weight", err)
		}
	}
	return nil
}

func (r *UserInterest) List(ctx context.Context, userID uuid.UUID) ([]domain.Interest, error) {
	rows, err := r.GetExecutor(ctx).Query(ctx, `SELECT tag, weight FROM user_interests WHERE user_id = $1 ORDER BY weight DESC`, userID)
	if err != nil {
		return nil, domain.NewInternalServerError(domain.CodeInternalServerError, "user_interest.List: query weights", err)
	}
	defer rows.Close()

	interests := make([]domain.Interest, 0)
	for rows.Next() {
		var interest domain.Interest
		if err := rows.Scan(&interest.Tag, &interest.Weight); err != nil {
			return nil, domain.NewInternalServerError(domain.CodeInternalServerError, "user_interest.List: scan weight", err)
		}
		interests = append(interests, interest)
	}
	if err := rows.Err(); err != nil {
		return nil, domain.NewInternalServerError(domain.CodeInternalServerError, "user_interest.List: rows error", err)
	}
	return interests, nil
}
