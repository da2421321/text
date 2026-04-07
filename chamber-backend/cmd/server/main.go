package main

import (
	"log"

	httpHandler "chamber-backend/internal/handler/http"

	"chamber-backend/internal/config"
	"chamber-backend/internal/service"
)

func main() {
	// 第一步先加载配置。
	// 这里会同时完成环境变量读取、默认值填充和安全校验，
	// 所以只要配置有问题，进程会在最早阶段直接退出，而不是带着错误参数继续往下跑。
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config load failed: %v", err)
	}

	// 第二步初始化 service。
	// 这一层会建立数据库连接、配置连接池、执行表迁移，并确保默认管理员存在。
	// 也就是说，只要 New 成功返回，后面的 HTTP 层就可以假设基础依赖已经准备完毕。
	svc, err := service.New(cfg)
	if err != nil {
		log.Fatalf("service init failed: %v", err)
	}
	defer func() {
		if err := svc.Close(); err != nil {
			log.Printf("service shutdown failed: %v", err)
		}
	}()

	// 第三步初始化 HTTP 路由。
	// 当前设计里 main 只负责组装依赖，不直接处理业务逻辑，
	// 这样入口保持足够薄，后续扩展日志、监控、优雅停机时也更容易落点。
	r := httpHandler.NewRouter(cfg, svc)
	log.Printf("%s started on :%s", cfg.AppName, cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server start failed: %v", err)
	}
}
