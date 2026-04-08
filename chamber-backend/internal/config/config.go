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

// Load 负责把运行时配置组装成 Config。
// 处理顺序是：
// 1. 先尝试加载本地 .env，方便本地开发直接启动。
// 2. 读取环境变量并补齐默认值。
// 3. 对数值配置做类型转换。
// 4. 在启动阶段提前校验配置，避免服务带着错误参数跑起来。
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

// Validate 负责做启动前校验。
// 这里校验的不是业务逻辑，而是“服务能否以当前配置安全启动”：
// 1. 关键配置不能为空。
// 2. 数值配置必须合法。
// 3. 生产环境不允许继续使用弱默认值。
func (c Config) Validate() error {
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
	if strings.EqualFold(c.AppEnv, "production") {
		if c.MySQLDSN == defaultMySQLDSN {
			return fmt.Errorf("MYSQL_DSN must be overridden in production")
		}
		if c.JWTSecret == defaultJWTSecret {
			return fmt.Errorf("JWT_SECRET must be overridden in production")
		}
		if c.AdminPassword == defaultAdminPassword {
			return fmt.Errorf("ADMIN_PASSWORD must be overridden in production")
		}
	}
	return nil
}

// logWarnings 用于在开发环境打印风险提醒。
// 开发时允许存在默认值，是为了降低启动门槛；
// 但这些默认值一旦进入测试或生产环境，会明显增加安全风险，所以必须显式提示。
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

// getenv 读取字符串环境变量，并自动去掉首尾空格。
// 这样可以避免因为 .env 里多打了空格，导致配置表面看起来正确、实际运行却异常。
func getenv(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

// getenvInt64 用于读取数值型环境变量。
// 如果变量不存在就回退到默认值；
// 如果变量存在但格式不合法，则直接返回错误，让服务在启动阶段失败。
func getenvInt64(key string, fallback int64) (int64, error) {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback, nil
	}

	// strconv.ParseInt(value, 10, 64) 会把字符串按十进制解析成 int64。
	// 例如 "7200" 会变成 int64(7200)。
	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("%s must be a valid integer: %w", key, err)
	}
	return parsed, nil
}
