package jwtutil

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims 定义 JWT 里保存的内容。
// 除了标准注册字段外，这里还额外放入 user_id、username、role，
// 方便后续接口直接从 token 中拿到当前登录用户的业务身份。
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// Generate 负责签发 Token。
// 当前统一使用 HS256 对称签名，并把过期时间、签发时间一起写入 claims，
// 这样后续校验时既能判断是否过期，也能保留基本的签发元数据。
func Generate(secret string, userID uint, username, role string, expiresInSec int64) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID:   userID,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(expiresInSec) * time.Second)),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// Parse 负责解析并校验 Token。
// 这里除了验证签名本身，还会额外强制要求算法必须是 HS256，
// 避免调用方传入签名算法被篡改或不符合预期的 token。
func Parse(secret, tokenString string) (*Claims, error) {
	// ParseWithClaims 会做两件事：
	// 1. 按我们提供的 Claims 结构解析 token payload。
	// 2. 调用下面的 keyFunc 拿到验签密钥，并据此校验签名。
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// 明确限制只接受 HS256，避免被不符合预期的签名算法绕过校验。
		if token.Method == nil || token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		// 返回用于验签的密钥（签发和解析必须使用同一个 secret）。
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, jwt.ErrTokenInvalidClaims
	}
	return claims, nil
}
