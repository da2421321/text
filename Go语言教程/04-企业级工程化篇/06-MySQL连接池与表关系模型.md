# 06 - 真实数据库建表与复杂查询 (GORM进阶)

在之前的《02-GORM数据库操作》中我们只体验了基础的 SQLite 与单表 CRUD。在真实企业项目中，往往使用的是 MySQL/PostgreSQL，而且涉及到表关系（一对多，多对多）以及更严谨的初始化。

## 1. 初始化 MySQL 连接池

与 Node.js 类似，在 Go 中我们绝不会每次请求都去连接数据库，而是在项目启动时建立一个**全局连接池**：

在 `internal/repository/db.go` 中：

```go
package repository

import (
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"my-go-backend/internal/config"
	"time"
)

// 全局 DB 对象
var DB *gorm.DB

func InitDB() error {
	// DSN 数据源名格式：user:pass@tcp(ip:port)/dbname?charset=utf8mb4&parseTime=True&loc=Local
	dsn := config.Conf.Database.Dsn

	var err error
	// 建立连接
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info), // 打印所有执行的 SQL 方便本地调试
	})
	if err != nil {
		return fmt.Errorf("连接 MySQL 失败: %v", err)
	}

	// 配置连接池
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	sqlDB.SetMaxIdleConns(10)           // 空闲连接数
	sqlDB.SetMaxOpenConns(100)          // 最大连接数
	sqlDB.SetConnMaxLifetime(time.Hour) // 连接最大存活时间

	return nil
}
```

## 2. 实体模型 (一对多关系编排)

比如“一个用户，可以拥有多篇文章（帖子）”：

在 `internal/model/user.go` 中：
```go
package model

import "gorm.io/gorm"

// 用户表
type User struct {
	gorm.Model
	Username string `gorm:"type:varchar(50);uniqueIndex;not null;comment:'用户名'"`
	Password string `gorm:"type:varchar(255);not null;comment:'加密密码'"`
	Email    string `gorm:"type:varchar(100);comment:'邮箱'"`
	
	// 一对多关系：这里只是代码逻辑上的挂载，GORM自动推断出需要关联 Articles 表的 UserID 字段
	Articles []Article `gorm:"foreignKey:UserID"`
}
```

在 `internal/model/article.go` 中：
```go
package model

import "gorm.io/gorm"

// 帖子表
type Article struct {
	gorm.Model
	Title   string `gorm:"type:varchar(100);not null;comment:'标题'"`
	Content string `gorm:"type:text;comment:'正文'"`
	
	// 外键字段
	UserID  uint   `gorm:"index;comment:'作者ID'"`
}
```

在启动时我们通过 `AutoMigrate` 生成真实表结构：
```go
DB.AutoMigrate(&model.User{}, &model.Article{})
```

## 3. 关联查询与预加载 (Preload)

如果我们在 Service 层想要查询 ID 为 1 的用户，并且把他名下的所有文章一并查出来：

```go
func GetUserWithArticles(id uint) (*model.User, error) {
	var user model.User
	// Preload ("Articles") 会自动发起左连接或子查询去拿关联数据！
	// 等同于前端 TypeORM 的 relations: ["articles"]
	err := DB.Preload("Articles").First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}
```

此外，GORM 同样支持高阶特性的事务封装（`db.Transaction`）和复杂作用域查询等，是构建大型后台管理系统最为得力的基石。

## 4. 查询错误处理建议

对“记录不存在”的判断推荐使用：

```go
if err := DB.First(&user, id).Error; errors.Is(err, gorm.ErrRecordNotFound) {
    // 业务上返回不存在
}
```

避免直接 `err == gorm.ErrRecordNotFound`。

## 5. 连接池参数不是越大越好

- `MaxOpenConns` 建议小于 MySQL 实例 `max_connections`，并预留管理连接余量。
- `MaxIdleConns` 过大可能导致空闲连接占资源，过小会频繁建连。
- 建议在压测下根据吞吐和延迟做参数回归，不要拍脑袋。

## 6. 关联查询注意 N+1 问题
如果你在循环里对每条数据再查一次数据库，就会触发 N+1。  
优先使用 `Preload` 或一次性批量查询，减少数据库往返次数。
