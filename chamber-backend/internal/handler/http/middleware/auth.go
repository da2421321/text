package middleware

import (
	"strings"

	"chamber-backend/internal/config"
	"chamber-backend/pkg/jwtutil"
	"chamber-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

// JWTAuth 负责做统一的 JWT 认证。
// 它只解决“你是谁”的问题：
// 1. 请求头里必须带 Bearer Token。
// 2. Token 必须能被正确解析并且没有过期。
// 3. 解析出的用户信息会写入 Gin 上下文，供后续中间件和 handler 使用。
func JWTAuth(cfg config.Config) gin.HandlerFunc {
		return func(c *gin.Context) {
			authHeader := c.GetHeader("Authorization")
			// 校验 Authorization 头必须存在，且格式要以 "Bearer " 开头。
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				response.Error(c, 401, "missing bearer token")
				c.Abort()
				return
		}

		// 去掉 Authorization 头中的 "Bearer " 前缀，只保留 JWT token 本体。
		token := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := jwtutil.Parse(cfg.JWTSecret, token)
		if err != nil {
			response.Error(c, 401, "invalid or expired token")
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)
		c.Next()
	}
}

// RequireRole 负责做授权控制。
// 它依赖 JWTAuth 已经把 role 写入上下文；
// 如果当前用户角色不在允许列表里，就直接返回 403，而不是继续进入业务处理。
func RequireRole(roles ...string) gin.HandlerFunc {
	// 把允许访问的角色列表转成“集合”，后续按 key 查找更快（O(1)）。
	// map 的 value 用 struct{} 是 Go 里常见的 set 写法，不占额外值内存。
	allowed := make(map[string]struct{}, len(roles))
	for _, role := range roles {
		allowed[role] = struct{}{}
	}

	return func(c *gin.Context) {
		// role 由 JWTAuth 在认证成功后写入上下文；拿不到说明认证上下文缺失。
		value, exists := c.Get("role")
		if !exists {
			response.Error(c, 401, "authentication context missing")
			c.Abort()
			return
		}

		// 做类型断言 + 空白校验，防止上下文里是脏值或非字符串。
		role, ok := value.(string)
		if !ok || strings.TrimSpace(role) == "" {
			response.Error(c, 401, "authentication context missing")
			c.Abort()
			return
		}

		// 用户“已认证”但角色不在允许列表 => 权限不足，返回 403。
		if _, ok := allowed[role]; !ok {
			response.Error(c, 403, "forbidden")
			c.Abort()
			return
		}

		// 授权通过，继续执行后续中间件/handler。
		c.Next()
	}
}
