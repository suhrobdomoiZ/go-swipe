package domain

import (
	"time"

	"github.com/google/uuid"
)

type EventCategory string

const (
	CategoryMusic        EventCategory = "music"
	CategoryTheatre      EventCategory = "theatre"
	CategoryExhibition   EventCategory = "exhibition"
	CategoryCinema       EventCategory = "cinema"
	CategorySport        EventCategory = "sport"
	CategoryOutdoor      EventCategory = "outdoor"
	CategoryParty        EventCategory = "party"
	CategoryFood         EventCategory = "food"
	CategoryEducation    EventCategory = "education"
	CategoryVolunteering EventCategory = "volunteering"
	CategoryOther        EventCategory = "other"
)

var validEventCategories = map[EventCategory]struct{}{
	CategoryMusic:        {},
	CategoryTheatre:      {},
	CategoryExhibition:   {},
	CategoryCinema:       {},
	CategorySport:        {},
	CategoryOutdoor:      {},
	CategoryParty:        {},
	CategoryFood:         {},
	CategoryEducation:    {},
	CategoryVolunteering: {},
	CategoryOther:        {},
}

func (c EventCategory) Valid() bool {
	_, ok := validEventCategories[c]
	return ok
}

type EventSource string

const (
	SourceUser      EventSource = "user"
	SourceSynthetic EventSource = "synthetic"
	SourceAfisha    EventSource = "afisha.yandex.ru"
	SourceVK        EventSource = "vk.ru"
	SourceCulture   EventSource = "www.culture.ru"
	SourceMax       EventSource = "max"
	SourceBiletMos  EventSource = "bilet.mos.ru"
	SourceOther     EventSource = "other"
)

type EventStatus string

const (
	EventStatusActive   EventStatus = "active"
	EventStatusFinished EventStatus = "finished"
)

var validAgeLimits = map[int]struct{}{
	0:  {},
	6:  {},
	12: {},
	16: {},
	18: {},
}

func ValidAgeLimit(age int) bool {
	_, ok := validAgeLimits[age]
	return ok
}

type Event struct {
	ID          uuid.UUID
	Title       string
	Description string
	Category    EventCategory
	Tags        []string
	City        string
	Venue       *string
	StartsAt    time.Time
	EndsAt      *time.Time
	Price       int
	AgeLimit    int
	URL         *string
	ImageURL    *string
	Source      EventSource
	CreatedBy   *uuid.UUID
	FetchedAt   time.Time

	Score float64
}

func (e Event) Status() EventStatus {
	if e.StartsAt.After(time.Now()) {
		return EventStatusActive
	}
	return EventStatusFinished
}

func (e Event) IsSynthetic() bool {
	return e.Source == SourceSynthetic
}
