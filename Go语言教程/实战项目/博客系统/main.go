package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	// 导入API处理器
	"blog/api"
	"blog/middleware"
	"blog/models"
	"blog/utils"
)

// 全局变量
var (
	db *gorm.DB
)

// 配置结构体
type Config struct {
	ServerPort string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	JWTSecret  string
}

// 加载配置
func loadConfig() Config {
	// 加载.env文件
	godotenv.Load()

	return Config{
		ServerPort: getEnv("SERVER_PORT", "8080"),
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "3306"),
		DBUser:     getEnv("DB_USER", "root"),
		DBPassword: getEnv("DB_PASSWORD", "password"),
		DBName:     getEnv("DB_NAME", "blog"),
		JWTSecret:  getEnv("JWT_SECRET", "your-secret-key"),
	}
}

// 获取环境变量，如果不存在则使用默认值
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// 初始化数据库
func initDB(config Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		config.DBUser, config.DBPassword, config.DBHost, config.DBPort, config.DBName)

	var err error
	db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect database: %v", err)
	}

	// 自动迁移数据库表
	db.AutoMigrate(&models.User{}, &models.Article{}, &models.Comment{}, &models.Tag{})

	fmt.Println("Database connected successfully")
	return db, nil
}

// 设置路由
func setupRouter() *gin.Engine {
	r := gin.Default()

	// 健康检查端点
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"time":   time.Now().Format(time.RFC3339),
		})
	})

	// API路由组
	api := r.Group("/api/v1")
	{
		// 认证相关路由
		auth := api.Group("/auth")
		{
			auth.POST("/register", api.RegisterHandler(db))
			auth.POST("/login", api.LoginHandler(db, utils.JWTSecret))
		}

		// 用户相关路由
		users := api.Group("/users")
		{
			users.GET("/:id", api.GetUserHandler(db))
			users.PUT("/:id", middleware.AuthMiddleware(utils.JWTSecret), api.UpdateUserHandler(db))
		}

		// 文章相关路由
		articles := api.Group("/articles")
		{
			articles.GET("", api.GetArticlesHandler(db))
			articles.GET("/:id", api.GetArticleHandler(db))
			articles.POST("", middleware.AuthMiddleware(utils.JWTSecret), api.CreateArticleHandler(db))
			articles.PUT("/:id", middleware.AuthMiddleware(utils.JWTSecret), api.UpdateArticleHandler(db))
			articles.DELETE("/:id", middleware.AuthMiddleware(utils.JWTSecret), api.DeleteArticleHandler(db))

			// 评论相关路由
			comments := articles.Group("/:id/comments")
			{
				comments.GET("", api.GetCommentsHandler(db))
				comments.POST("", middleware.AuthMiddleware(utils.JWTSecret), api.CreateCommentHandler(db))
			}
		}

		// 评论相关路由（独立）
		comments := api.Group("/comments")
		{
			comments.DELETE("/:id", middleware.AuthMiddleware(utils.JWTSecret), api.DeleteCommentHandler(db))
		}

		// 标签相关路由
		tags := api.Group("/tags")
		{
			tags.POST("", middleware.AuthMiddleware(utils.JWTSecret), api.CreateTagHandler(db))
			tags.GET("", api.GetTagsHandler(db))
			tags.GET("/:id", api.GetTagHandler(db))
			tags.GET("/:id/articles", api.GetTagArticlesHandler(db))
			tags.PUT("/:id", middleware.AuthMiddleware(utils.JWTSecret), api.UpdateTagHandler(db))
			tags.DELETE("/:id", middleware.AuthMiddleware(utils.JWTSecret), api.DeleteTagHandler(db))
		}
	}

	return r
}

func main() {
	// 加载配置
	config := loadConfig()

	// 初始化数据库
	var err error
	db, err = initDB(config)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// 设置路由
	r := setupRouter()

	// 创建HTTP服务器
	srv := &http.Server{
		Addr:    ":" + config.ServerPort,
		Handler: r,
	}

	// 在goroutine中启动服务器
	go func() {
		fmt.Printf("Server starting on port %s\n", config.ServerPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// 等待中断信号以优雅地关闭服务器
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	fmt.Println("Shutting down server...")

	// 上下文用于通知服务器它有5秒的时间来完成当前请求
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	fmt.Println("Server exited")
}