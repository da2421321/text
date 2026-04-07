package jwtutil

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// TestGenerateAndParse 验证签发后的 Token 可以被正常解析。
func TestGenerateAndParse(t *testing.T) {
	secret := "12345678901234567890123456789012"

	token, err := Generate(secret, 7, "admin", "admin", int64(time.Minute.Seconds()))
	if err != nil {
		t.Fatalf("Generate() returned error: %v", err)
	}

	claims, err := Parse(secret, token)
	if err != nil {
		t.Fatalf("Parse() returned error: %v", err)
	}

	if claims.UserID != 7 {
		t.Fatalf("UserID = %d, want 7", claims.UserID)
	}
	if claims.Username != "admin" {
		t.Fatalf("Username = %q, want admin", claims.Username)
	}
	if claims.Role != "admin" {
		t.Fatalf("Role = %q, want admin", claims.Role)
	}
}

// TestParseRejectsUnexpectedSigningMethod 验证不允许使用非 HS256 的签名算法。
func TestParseRejectsUnexpectedSigningMethod(t *testing.T) {
	token := jwt.NewWithClaims(jwt.SigningMethodNone, Claims{
		UserID:   1,
		Username: "admin",
		Role:     "admin",
	})

	tokenString, err := token.SignedString(jwt.UnsafeAllowNoneSignatureType)
	if err != nil {
		t.Fatalf("SignedString() returned error: %v", err)
	}

	if _, err := Parse("12345678901234567890123456789012", tokenString); err == nil {
		t.Fatal("Parse() returned nil error for unexpected signing method")
	}
}
