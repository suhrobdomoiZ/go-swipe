package model

import "github.com/suhrobdomoiZ/go-swipe/server/internal/domain"

type InterestDTO struct {
	Tag    string  `json:"tag"`
	Weight float64 `json:"weight"`
}

func ToInterestDTO(i domain.Interest) InterestDTO {
	return InterestDTO{Tag: i.Tag, Weight: i.Weight}
}

func ToInterestDTOs(interests []domain.Interest) []InterestDTO {
	dtos := make([]InterestDTO, 0, len(interests))
	for _, i := range interests {
		dtos = append(dtos, ToInterestDTO(i))
	}
	return dtos
}

func FromInterestDTOs(dtos []InterestDTO) []domain.Interest {
	interests := make([]domain.Interest, 0, len(dtos))
	for _, dto := range dtos {
		interests = append(interests, domain.Interest{Tag: dto.Tag, Weight: dto.Weight})
	}
	return interests
}

type ProfileDTO struct {
	User      UserDTO       `json:"user"`
	Interests []InterestDTO `json:"interests"`
}

func ToProfileDTO(user domain.User, interests []domain.Interest) ProfileDTO {
	return ProfileDTO{User: ToUserDTO(user), Interests: ToInterestDTOs(interests)}
}

type ProfilePatchRequestDTO struct {
	City            *string        `json:"city"`
	Interests       *[]InterestDTO `json:"interests"`
	RemoveInterests []string       `json:"remove_interests"`
	BirthDate       *string        `json:"birth_date"`
}
