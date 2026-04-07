package config

import "testing"

// TestLoadParsesTokenExpiresIn 验证数值型环境变量可以被正确解析。
func TestLoadParsesTokenExpiresIn(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("APP_PORT", "8080")
	t.Setenv("MYSQL_DSN", "user:pass@tcp(localhost:3306)/db")
	t.Setenv("JWT_SECRET", "12345678901234567890123456789012")
	t.Setenv("ADMIN_USERNAME", "admin")
	t.Setenv("ADMIN_PASSWORD", "super-secret-password")
	t.Setenv("TOKEN_EXPIRES_IN", "3600")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() returned error: %v", err)
	}

	if cfg.TokenExpiresIn != 3600 {
		t.Fatalf("TokenExpiresIn = %d, want 3600", cfg.TokenExpiresIn)
	}
}

// TestLoadRejectsWeakProductionDefaults 验证生产环境下不能使用弱默认值。
func TestLoadRejectsWeakProductionDefaults(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("APP_PORT", "8080")
	t.Setenv("MYSQL_DSN", "user:pass@tcp(localhost:3306)/db")
	t.Setenv("JWT_SECRET", defaultJWTSecret)
	t.Setenv("ADMIN_USERNAME", "admin")
	t.Setenv("ADMIN_PASSWORD", defaultAdminPassword)

	if _, err := Load(); err == nil {
		t.Fatal("Load() returned nil error for weak production defaults")
	}
}

// TestLoadRejectsInvalidTokenTTL 验证非法的 Token 过期时间会在启动阶段被拦截。
func TestLoadRejectsInvalidTokenTTL(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("APP_PORT", "8080")
	t.Setenv("MYSQL_DSN", "user:pass@tcp(localhost:3306)/db")
	t.Setenv("JWT_SECRET", "12345678901234567890123456789012")
	t.Setenv("ADMIN_USERNAME", "admin")
	t.Setenv("ADMIN_PASSWORD", "super-secret-password")
	t.Setenv("TOKEN_EXPIRES_IN", "invalid")

	if _, err := Load(); err == nil {
		t.Fatal("Load() returned nil error for invalid TOKEN_EXPIRES_IN")
	}
}
