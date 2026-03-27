# 07 - Redis 缓存的极简整合

缓存是解决高并发读取的万金油。对于全栈开发者而言，Redis 当属首选。在 Go 中最受业界认可的 Redis 客户端是 [go-redis](https://github.com/redis/go-redis)。

安装客户端：
```bash
go get github.com/redis/go-redis/v9
```

## 1. 为什么我们需要 Redis？

在前端转后端的思路里，你只管查询数据库返回 JSON。但是真实的 DB （如 MySQL）QPS 上限往往在几千，如果一个热门的数据（比如：首页商品列表，文章推荐，或者短信验证码）被百万用户同一时刻访问，数据库直接就挂了。
因此我们需要引入 Redis 挡在 MySQL 前面。

## 2. 初始化 Redis 连接池

写在 `internal/repository/redis.go` 里面：

```go
package repository

import (
	"context"
	"fmt"
	"github.com/redis/go-redis/v9"
	"my-go-backend/internal/config"
)

var RDB *redis.Client

func InitRedis() error {
	// 从你刚才写的配种管理文件读取：比如 127.0.0.1:6379
	rConf := config.Conf.Redis 

	RDB = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", rConf.Host, rConf.Port),
		Password: rConf.Password, 
		DB:       rConf.DB,
		PoolSize: 100, // 连接池最大连接数
	})

	// 测试连通性 (Ping)
	ctx := context.Background()
	_, err := RDB.Ping(ctx).Result()
	if err != nil {
		return fmt.Errorf("连接 Redis 失败: %v", err)
	}
	return nil
}
```

## 3. 在 Service 层的典型应用 (缓存击穿防护)

在 Service 中获取一片高频访问的数据，标准的企业级写法（**Cache-Aside 模式**）：
1. 查 Redis，如果有，直接返回给 Controller。
2. 查不到？去 MySQL (Repo 层) 查。
3. 查出来了，别急着返回，先设置给 Redis（带上过期时间），然后再返回。

```go
package service

import (
	"context"
	"encoding/json"
	"errors"
	"my-go-backend/internal/model"
	"my-go-backend/internal/repository"
	"time"

	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

func GetHotArticle(articleID string) (*model.Article, error) {
	cacheKey := "article:detail:" + articleID

	// 1. 先查 Redis 缓存
	cachedData, err := repository.RDB.Get(ctx, cacheKey).Result()
	
	// 如果查询没出错（redis.Nil 表示键不存在）
	if err == nil {
		var article model.Article
		// 反序列化：字符串转为 Struct
		json.Unmarshal([]byte(cachedData), &article)
		return &article, nil
	} else if err != redis.Nil {
		// 缓存真的出了其他错误，稳妥起见我们还是打印日志，但继续去查真正的 DB
	}

	// 2. 缓存没查到，去 MySQL 层拿数据
	article, err := repository.GetArticleFromMySQL(articleID)
	if err != nil {
		return nil, err
	}
	if article == nil {
		return nil, errors.New("文章不存在")
	}

	// 3. 把 MySQL 拿到的数据写回到 Redis，设置 1 个小时过期
	jsonBytes, _ := json.Marshal(article)
	repository.RDB.Set(ctx, cacheKey, string(jsonBytes), 1*time.Hour)

	// 4. 返回查到的结果
	return article, nil
}
```

这就是你在 Node.js 或者 Go 中开发高并发后端的必修课。这套打法足以支撑绝大多数真实的 C 端接口抗压需求。

## 4. 生产补充：三类常见缓存问题

1. 缓存穿透：请求不存在的数据，每次都打到 DB。  
   处理：对不存在结果缓存短 TTL（如 1-5 分钟）。

2. 缓存击穿：热点 key 过期瞬间大量并发打到 DB。  
   处理：互斥锁（setnx）/ singleflight 合并请求。

3. 缓存雪崩：大量 key 同时过期。  
   处理：过期时间加随机抖动（jitter），错峰失效。

## 5. 代码层建议

- 所有 Redis 调用使用超时 context，避免外部依赖抖动拖垮接口。
- `Set/Get` 的错误不要忽略，至少记录日志。
- key 统一前缀规范：`业务:模块:主键`，如 `article:detail:1001`。

示例（带超时）：

```go
ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
defer cancel()

val, err := repository.RDB.Get(ctx, cacheKey).Result()
if err != nil && err != redis.Nil {
    // 记录日志，必要时打点告警
}
_ = val
```
