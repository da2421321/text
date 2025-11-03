package utils

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

// JWTSecret is the secret key for JWT signing
var JWTSecret = []byte(os.Getenv("JWT_SECRET"))

// Claims represents the JWT claims
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// GenerateToken generates a JWT token for a user
func GenerateToken(userID uint, username string) (string, error) {
	// Set expiration time (24 hours)
	expirationTime := time.Now().Add(24 * time.Hour)
	
	// Create claims
	claims := &Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}
	
	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	
	// Sign token
	tokenString, err := token.SignedString(JWTSecret)
	if err != nil {
		return "", err
	}
	
	return tokenString, nil
}

// ParseToken parses and validates a JWT token
func ParseToken(tokenString string) (*Claims, error) {
	// Parse token
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return JWTSecret, nil
	})
	
	// Check for parsing errors
	if err != nil {
		return nil, err
	}
	
	// Validate token
	if !token.Valid {
		return nil, jwt.ErrSignatureInvalid
	}
	
	return claims, nil
}