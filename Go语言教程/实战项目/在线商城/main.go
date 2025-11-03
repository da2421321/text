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

	"ecommerce/internal/config"
	"ecommerce/internal/handler"
	"ecommerce/internal/middleware"
	"ecommerce/internal/model"
	"ecommerce/internal/repository"
	"ecommerce/internal/service"
	"ecommerce/internal/utils"
)

// @title 在线商城API
// @version 1.0
// @description 这是一个在线商城的API文档
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8080
// @BasePath /api/v1

func main() {
	// 加载环境变量
	if err := godotenv.Load(); err != nil {
		log.Println("未找到.env文件")
	}

	// 初始化配置
	cfg := config.Load()

	// 初始化数据库
	db, err := initDB(cfg)
	if err != nil {
		log.Fatal("数据库初始化失败:", err)
	}

	// 初始化Redis
	redisClient := utils.NewRedisClient(cfg.RedisAddr, cfg.RedisPassword, cfg.RedisDB)

	// 初始化仓库
	userRepo := repository.NewUserRepository(db)
	productRepo := repository.NewProductRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	cartRepo := repository.NewCartRepository(db)
	orderRepo := repository.NewOrderRepository(db)

	// 初始化服务
	userService := service.NewUserService(userRepo)
	productService := service.NewProductService(productRepo)
	categoryService := service.NewCategoryService(categoryRepo)
	cartService := service.NewCartService(cartRepo, productRepo)
	orderService := service.NewOrderService(orderRepo, cartRepo, productRepo)

	// 初始化处理器
	userHandler := handler.NewUserHandler(userService)
	productHandler := handler.NewProductHandler(productService)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	cartHandler := handler.NewCartHandler(cartService)
	orderHandler := handler.NewOrderHandler(orderService)

	// 设置路由
	r := setupRouter(cfg.JWTSecret, userHandler, productHandler, categoryHandler, cartHandler, orderHandler)

	// 创建HTTP服务器
	srv := &http.Server{
		Addr:    ":" + cfg.ServerPort,
		Handler: r,
	}

	// 在goroutine中启动服务器
	go func() {
		fmt.Printf("服务器启动在端口 %s\n", cfg.ServerPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("服务器启动失败: %v", err)
		}
	}()

	// 等待中断信号以优雅地关闭服务器
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	fmt.Println("正在关闭服务器...")

	// 上下文用于通知服务器它有5秒的时间来完成当前请求
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("服务器强制关闭: %v", err)
	}

	// 关闭数据库连接
	sqlDB, _ := db.DB()
	sqlDB.Close()

	// 关闭Redis连接
	redisClient.Close()

	fmt.Println("服务器已退出")
}

// 初始化数据库
func initDB(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("连接数据库失败: %v", err)
	}

	// 自动迁移数据库表
	db.AutoMigrate(
		&model.User{},
		&model.Category{},
		&model.Product{},
		&model.Cart{},
		&model.Order{},
		&model.OrderItem{},
	)

	fmt.Println("数据库连接成功")
	return db, nil
}

// 设置路由
func setupRouter(
	jwtSecret string,
	userHandler *handler.UserHandler,
	productHandler *handler.ProductHandler,
	categoryHandler *handler.CategoryHandler,
	cartHandler *handler.CartHandler,
	orderHandler *handler.OrderHandler,
) *gin.Engine {
	r := gin.Default()

	// 全局中间件
	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.LoggerMiddleware())

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
			auth.POST("/register", userHandler.Register)
			auth.POST("/login", userHandler.Login)
		}

		// 用户相关路由
		users := api.Group("/users")
		users.Use(middleware.AuthMiddleware(jwtSecret))
		{
			users.GET("/profile", userHandler.GetProfile)
			users.PUT("/profile", userHandler.UpdateProfile)
		}

		// 商品分类路由
		categories := api.Group("/categories")
		{
			categories.GET("", categoryHandler.ListCategories)
			categories.GET("/:id", categoryHandler.GetCategory)
		}

		// 商品相关路由
		products := api.Group("/products")
		{
			products.GET("", productHandler.ListProducts)
			products.GET("/:id", productHandler.GetProduct)
		}

		// 管理员商品路由
		adminProducts := api.Group("/admin/products")
		adminProducts.Use(middleware.AuthMiddleware(jwtSecret))
		{
			adminProducts.POST("", productHandler.CreateProduct)
			adminProducts.PUT("/:id", productHandler.UpdateProduct)
			adminProducts.DELETE("/:id", productHandler.DeleteProduct)
		}

		// 购物车相关路由
		cart := api.Group("/cart")
		cart.Use(middleware.AuthMiddleware(jwtSecret))
		{
			cart.GET("", cartHandler.GetCart)
			cart.POST("", cartHandler.AddItem)
			cart.PUT("/:id", cartHandler.UpdateItem)
			cart.DELETE("/:id", cartHandler.RemoveItem)
		}

		// 订单相关路由
		orders := api.Group("/orders")
		orders.Use(middleware.AuthMiddleware(jwtSecret))
		{
			orders.GET("", orderHandler.ListOrders)
			orders.GET("/:id", orderHandler.GetOrder)
			orders.POST("", orderHandler.CreateOrder)
			orders.PUT("/:id/cancel", orderHandler.CancelOrder)
		}
	}

	return r
}