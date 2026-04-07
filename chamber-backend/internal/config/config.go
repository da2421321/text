package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

const (
	defaultMySQLDSN      = "root:123@tcp(127.0.0.1:3306)/chamber?charset=utf8mb4&parseTime=True&loc=Local"
	defaultJWTSecret     = "replace_me_with_a_strong_secret"
	defaultAdminPassword = "admin123456"
)

type Config struct {
	AppEnv         string
	AppName        string
	Port           string
	MySQLDSN       string
	JWTSecret      string
	AdminUsername  string
	AdminPassword  string
	TokenExpiresIn int64
}

// Load 负责组装运行时配置。
//
// 处理顺序：
// 1. 先尝试加载本地 .env，方便开发环境直接启动。
// 2. 读取环境变量，并补齐开发环境默认值。
// 3. 解析数值类型配置。
// 4. 在启动前完成校验，避免服务带着错误配置运行。
func Load() (Config, error) {
	_ = godotenv.Load()

	tokenExpiresIn, err := getenvInt64("TOKEN_EXPIRES_IN", 7200)
	if err != nil {
		return Config{}, err
	}

	cfg := Config{
		AppEnv:         getenv("APP_ENV", "development"),
		AppName:        getenv("APP_NAME", "chamber-backend"),
		Port:           getenv("APP_PORT", "8080"),
		MySQLDSN:       getenv("MYSQL_DSN", defaultMySQLDSN),
		JWTSecret:      getenv("JWT_SECRET", defaultJWTSecret),
		AdminUsername:  getenv("ADMIN_USERNAME", "admin"),
		AdminPassword:  getenv("ADMIN_PASSWORD", defaultAdminPassword),
		TokenExpiresIn: tokenExpiresIn,
	}

	if err := cfg.Validate(); err != nil {
		return Config{}, err
	}

	cfg.logWarnings()
	return cfg, nil
}

// Validate 用于判断当前配置是否可以安全启动服务。
//
// 这里分成两类校验：
// 1. 必填项和数值是否合法。
// 2. 生产环境下是否仍在使用开发默认值。
func (c Config) Validate() error {
	if err := c.validateRequired(); err != nil {
		return err
	}
	if err := c.validateProductionOverrides(); err != nil {
		return err
	}
	return nil
}

func (c Config) validateRequired() error {
	if strings.TrimSpace(c.Port) == "" {
		return fmt.Errorf("APP_PORT must not be empty")
	}
	if strings.TrimSpace(c.MySQLDSN) == "" {
		return fmt.Errorf("MYSQL_DSN must not be empty")
	}
	if strings.TrimSpace(c.JWTSecret) == "" {
		return fmt.Errorf("JWT_SECRET must not be empty")
	}
	if strings.TrimSpace(c.AdminUsername) == "" {
		return fmt.Errorf("ADMIN_USERNAME must not be empty")
	}
	if strings.TrimSpace(c.AdminPassword) == "" {
		return fmt.Errorf("ADMIN_PASSWORD must not be empty")
	}
	if c.TokenExpiresIn <= 0 {
		return fmt.Errorf("TOKEN_EXPIRES_IN must be greater than 0")
	}
	return nil
}

func (c Config) validateProductionOverrides() error {
	if !strings.EqualFold(c.AppEnv, "production") {
		return nil
	}
	if c.MySQLDSN == defaultMySQLDSN {
		return fmt.Errorf("MYSQL_DSN must be overridden in production")
	}
	if c.JWTSecret == defaultJWTSecret {
		return fmt.Errorf("JWT_SECRET must be overridden in production")
	}
	if c.AdminPassword == defaultAdminPassword {
		return fmt.Errorf("ADMIN_PASSWORD must be overridden in production")
	}
	return nil
}

// logWarnings 用于提示当前仍在使用开发默认值。
//
// 默认值可以降低本地启动门槛，但部署前必须替换，
// 否则会带来明显的安全风险。
func (c Config) logWarnings() {
	if c.MySQLDSN == defaultMySQLDSN {
		log.Println("warning: using default MySQL DSN; override MYSQL_DSN before deployment")
	}
	if c.JWTSecret == defaultJWTSecret {
		log.Println("warning: using default JWT secret; override JWT_SECRET before deployment")
	}
	if c.AdminPassword == defaultAdminPassword {
		log.Println("warning: using default admin password; override ADMIN_PASSWORD before deployment")
	}
	if len(c.JWTSecret) < 32 {
		log.Println("warning: JWT secret is shorter than 32 characters")
	}
}

// getenv 读取字符串环境变量，并去掉首尾空格。
func getenv(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

// getenvInt64 读取整数环境变量。
//
// 未设置时返回默认值；如果设置了但格式不合法，则直接报错。
func getenvInt64(key string, fallback int64) (int64, error) {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback, nil
	}

	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("%s must be a valid integer: %w", key, err)
	}
	return parsed, nil
}
