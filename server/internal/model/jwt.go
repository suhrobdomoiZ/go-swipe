package model

import (
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type JWTAuthData struct {
	UserID uuid.UUID `json:"user_id"`
	jwt.RegisteredClaims
}

type LoginRequest struct {
	InitData string `json:"init_data"`
}

type LoginResponse struct {
	Token          string  `json:"token"`
	NeedOnboarding bool    `json:"need_onboarding"`
	User           UserDTO `json:"user"`
}
