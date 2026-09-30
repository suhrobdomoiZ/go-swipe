package services

import (
	"context"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/repository"
)

const (
	feedDefaultLimit = 20
	feedMaxLimit     = 50

	maxTitleLength       = 128
	maxDescriptionLength = 2048
	maxCityLength        = 64
	maxVenueLength       = 256
	maxURLLength         = 512
	maxTagLength         = 128
	maxTagCount          = 10

	categoryTagScoreWeight = 0.5
	dayPenalty             = 0.05
)

type EventFeedParams struct {
	Query    *string
	Category *string
	IsFree   *bool
	PriceMax *int
	AgeLimit *int
	DateFrom *time.Time
	DateTo   *time.Time
	Limit    int
	Offset   int
}

type Events struct {
	events    repository.IEvent
	users     repository.IUser
	interests repository.IUserInterest
}

func NewEvents(events repository.IEvent, users repository.IUser, interests repository.IUserInterest) *Events {
	return &Events{events, users, interests}
}

func (s *Events) Feed(ctx context.Context, userID uuid.UUID, params EventFeedParams) ([]domain.Event, int, error) {
	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return nil, 0, err
	}
	if user.City == nil || *user.City == "" {
		return nil, 0, domain.NewBadRequest(domain.CodeBadRequest, "events.Feed: complete onboarding first")
	}

	filter := repository.EventFeedFilter{
		UserID: userID,
		City:   *user.City,
		Query:  params.Query,
	}

	if params.Category != nil {
		category := domain.EventCategory(strings.ToLower(strings.TrimSpace(*params.Category)))
		if !category.Valid() {
			return nil, 0, domain.NewBadRequest(domain.CodeBadRequest, "events.Feed: invalid category")
		}
		filter.Category = &category
	}
	filter.IsFree = params.IsFree
	filter.PriceMax = params.PriceMax
	filter.AgeLimit = effectiveAgeLimit(params.AgeLimit, user.BirthDate)
	filter.DateFrom = params.DateFrom
	filter.DateTo = params.DateTo

	events, err := s.events.ListFeed(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	weights, err := s.interests.List(ctx, userID)
	if err != nil {
		return nil, 0, err
	}
	weightByTag := make(map[string]float64, len(weights))
	for _, w := range weights {
		weightByTag[w.Tag] = w.Weight
	}

	now := time.Now()
	for i := range events {
		events[i].Score = scoreEvent(events[i], weightByTag, now)
	}
	sort.SliceStable(events, func(i, j int) bool { return events[i].Score > events[j].Score })

	total := len(events)
	limit := params.Limit
	if limit <= 0 {
		limit = feedDefaultLimit
	}
	if limit > feedMaxLimit {
		limit = feedMaxLimit
	}
	offset := params.Offset
	if offset < 0 {
		offset = 0
	}
	if offset >= total {
		return []domain.Event{}, total, nil
	}
	end := offset + limit
	if end > total {
		end = total
	}
	return events[offset:end], total, nil
}

func scoreEvent(event domain.Event, weightByTag map[string]float64, now time.Time) float64 {
	score := weightByTag[string(event.Category)]
	for _, tag := range event.Tags {
		score += categoryTagScoreWeight * weightByTag[tag]
	}
	daysUntil := event.StartsAt.Sub(now).Hours() / 24
	score -= dayPenalty * daysUntil
	return score
}

func effectiveAgeLimit(requested *int, birthDate *time.Time) *int {
	var age *int
	if birthDate != nil {
		a := calculateAge(*birthDate, time.Now())
		age = &a
	}
	switch {
	case requested != nil && age != nil:
		v := *requested
		if *age < v {
			v = *age
		}
		return &v
	case requested != nil:
		return requested
	default:
		return age
	}
}

type EventInput struct {
	Title       string
	Description string
	Category    string
	Tags        []string
	City        string
	Venue       *string
	StartsAt    time.Time
	EndsAt      *time.Time
	Price       int
	AgeLimit    int
	URL         *string
	ImageURL    *string
}

func (s *Events) Create(ctx context.Context, userID uuid.UUID, input EventInput) (domain.Event, error) {
	event, err := buildEvent(input)
	if err != nil {
		return domain.Event{}, err
	}
	event.Source = domain.SourceUser
	event.CreatedBy = &userID
	return s.events.Create(ctx, event)
}

// Update полностью заменяет редактируемые поля мероприятия. Править можно только
// собственные события с source='user', которые ещё не начались.
func (s *Events) Update(ctx context.Context, userID, eventID uuid.UUID, input EventInput) (domain.Event, error) {
	existing, err := s.events.GetByID(ctx, eventID)
	if err != nil {
		return domain.Event{}, err
	}
	if existing.Source != domain.SourceUser || existing.CreatedBy == nil || *existing.CreatedBy != userID {
		return domain.Event{}, domain.NewForbidden(domain.CodeForbidden, "events.Update: only the author can edit an event")
	}
	if existing.Status() == domain.EventStatusFinished {
		return domain.Event{}, domain.NewBadRequest(domain.CodeBadRequest, "events.Update: finished event can not be edited")
	}

	event, err := buildEvent(input)
	if err != nil {
		return domain.Event{}, err
	}
	event.ID = eventID
	return s.events.Update(ctx, event)
}

func buildEvent(input EventInput) (domain.Event, error) {
	title := strings.TrimSpace(input.Title)
	if title == "" || len([]rune(title)) > maxTitleLength {
		return domain.Event{}, domain.NewBadRequest(domain.CodeBadRequest, "events: invalid title")
	}
	description := strings.TrimSpace(input.Description)
	if description == "" || len([]rune(description)) > maxDescriptionLength {
		return domain.Event{}, domain.NewBadRequest(domain.CodeBadRequest, "events: invalid description")
	}
	city := strings.TrimSpace(input.City)
	if city == "" || len([]rune(city)) > maxCityLength {
		return domain.Event{}, domain.NewBadRequest(domain.CodeBadRequest, "events: invalid city")
	}
	category := domain.EventCategory(strings.ToLower(strings.TrimSpace(input.Category)))
	if !category.Valid() {
		return domain.Event{}, domain.NewBadRequest(domain.CodeBadRequest, "events: invalid category")
	}
	if !input.StartsAt.After(time.Now()) {
		return domain.Event{}, domain.NewBadRequest(domain.CodeBadRequest, "events: starts_at must be in the future")
	}
	if input.EndsAt != nil && !input.EndsAt.After(input.StartsAt) {
		return domain.Event{}, domain.NewBadRequest(domain.CodeBadRequest, "events: ends_at must be after starts_at")
	}
	if input.Price < 0 {
		return domain.Event{}, domain.NewBadRequest(domain.CodeBadRequest, "events: price must not be negative")
	}
	if !domain.ValidAgeLimit(input.AgeLimit) {
		return domain.Event{}, domain.NewBadRequest(domain.CodeBadRequest, "events: invalid age_limit")
	}

	venue, err := trimmedPointer(input.Venue, maxVenueLength, "venue")
	if err != nil {
		return domain.Event{}, err
	}
	url, err := trimmedPointer(input.URL, maxURLLength, "url")
	if err != nil {
		return domain.Event{}, err
	}
	imageURL, err := trimmedPointer(input.ImageURL, maxURLLength, "image_url")
	if err != nil {
		return domain.Event{}, err
	}

	return domain.Event{
		Title:       title,
		Description: description,
		Category:    category,
		Tags:        normalizeEventTags(input.Tags),
		City:        city,
		Venue:       venue,
		StartsAt:    input.StartsAt,
		EndsAt:      input.EndsAt,
		Price:       input.Price,
		AgeLimit:    input.AgeLimit,
		URL:         url,
		ImageURL:    imageURL,
	}, nil
}

func normalizeEventTags(tags []string) []string {
	seen := make(map[string]struct{}, len(tags))
	result := make([]string, 0, len(tags))
	for _, raw := range tags {
		tag := normalizeTag(raw)
		if tag == "" {
			continue
		}
		if _, ok := seen[tag]; ok {
			continue
		}
		seen[tag] = struct{}{}
		result = append(result, tag)
		if len(result) == maxTagCount {
			break
		}
	}
	return result
}

func trimmedPointer(value *string, maxLen int, field string) (*string, error) {
	if value == nil {
		return nil, nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil, nil
	}
	if len([]rune(trimmed)) > maxLen {
		return nil, domain.NewBadRequest(domain.CodeBadRequest, "events: "+field+" is too long")
	}
	return &trimmed, nil
}

func (s *Events) GetByID(ctx context.Context, id uuid.UUID) (domain.Event, error) {
	return s.events.GetByID(ctx, id)
}

func (s *Events) Mine(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Event, int, error) {
	if limit <= 0 {
		limit = feedDefaultLimit
	}
	if limit > feedMaxLimit {
		limit = feedMaxLimit
	}
	if offset < 0 {
		offset = 0
	}
	return s.events.ListMine(ctx, userID, limit, offset)
}
