# 03 - Redis 实战

> 本章目标：掌握 Go 中使用 Redis 的核心操作，理解缓存策略和常见应用场景。

## 前置知识

学习本章前，你需要掌握：
- 结构体与方法（基础篇第七章）
- 接口（基础篇第八章）
- JSON 处理（进阶篇第六章）
- Gin 框架基础（实战篇第一章）

## 1. Redis 是什么？

### 生活中的缓存

想象你在图书馆借书：
- **没有缓存**：每次需要书都要去书库深处找（慢）
- **有缓存**：把常借的书放在前台（快）

Redis 就是程序的"前台书架"——把常用数据放在内存里，访问速度比数据库快 100 倍以上。

### Redis 的特点

- **极快**：数据存在内存中，读写速度达到 10 万次/秒
- **数据结构丰富**：String、Hash、List、Set、ZSet 等
- **持久化**：可以把内存数据保存到硬盘
- **分布式锁**：多个服务器之间协调工作

## 2. 安装 Redis

### Windows
```bash
# 使用 Chocolatey
choco install redis-64

# 或下载 MSI 安装包
# https://github.com/microsoftarchive/redis/releases
```

### macOS
```bash
brew install redis
brew services start redis
```

### Linux
```bash
sudo apt install redis-server  # Ubuntu/Debian
sudo systemctl start redis
```

### Docker（推荐）
```bash
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

验证安装：
```bash
redis-cli ping
# 输出：PONG
```

## 3. 安装 Go Redis 客户端

目前最流行的是 [go-redis](https://github.com/redis/go-redis)：

```bash
go get github.com/redis/go-redis/v9
```

## 4. 连接 Redis

```go
package main

import (
	"context"
	"fmt"
	"github.com/redis/go-redis/v9"
)

var (
	rdb *redis.Client
	ctx = context.Background()
)

func InitRedis() {
	rdb = redis.NewClient(&redis.Options{
		Addr:     "localhost:6379", // Redis 地址
		Password: "",               // 密码（默认为空）
		DB:       0,                // 使用默认数据库
	})

	// 测试连接
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		panic("Redis 连接失败: " + err.Error())
	}
	fmt.Println("Redis 连接成功")
}

func main() {
	InitRedis()
}
```

## 5. 基本操作：String 类型

### 设置和获取

```go
package main

import (
	"context"
	"fmt"
	"github.com/redis/go-redis/v9"
	"time"
)

var rdb *redis.Client
var ctx = context.Background()

func main() {
	rdb = redis.NewClient(&redis.Options{Addr: "localhost:6379"})

	// 设置键值（永久）
	err := rdb.Set(ctx, "name", "张三", 0).Err()
	if err != nil {
		panic(err)
	}

	// 设置键值（10 秒后过期）
	rdb.Set(ctx, "code", "123456", 10*time.Second)

	// 获取值
	val, err := rdb.Get(ctx, "name").Result()
	if err == redis.Nil {
		fmt.Println("键不存在")
	} else if err != nil {
		panic(err)
	} else {
		fmt.Println("name =", val) // 输出：name = 张三
	}

	// 删除键
	rdb.Del(ctx, "name")

	// 检查键是否存在
	exists, _ := rdb.Exists(ctx, "name").Result()
	fmt.Println("name 是否存在:", exists) // 输出：0（不存在）
}
```

### 数字操作

```go
// 设置数字
rdb.Set(ctx, "views", 100, 0)

// 自增 1
rdb.Incr(ctx, "views")

// 自增指定值
rdb.IncrBy(ctx, "views", 10)

// 自减
rdb.Decr(ctx, "views")

// 获取结果
val, _ := rdb.Get(ctx, "views").Int()
fmt.Println("浏览量:", val) // 输出：109
```

## 6. Hash 类型（存储对象）

Hash 适合存储结构化数据，比如用户信息：

```go
package main

import (
	"context"
	"fmt"
	"github.com/redis/go-redis/v9"
)

type User struct {
	ID    int
	Name  string
	Email string
	Age   int
}

var rdb *redis.Client
var ctx = context.Background()

func main() {
	rdb = redis.NewClient(&redis.Options{Addr: "localhost:6379"})

	// 存储用户信息
	user := User{ID: 1, Name: "张三", Email: "zhang@example.com", Age: 25}
	rdb.HSet(ctx, "user:1", map[string]interface{}{
		"name":  user.Name,
		"email": user.Email,
		"age":   user.Age,
	})

	// 获取单个字段
	name, _ := rdb.HGet(ctx, "user:1", "name").Result()
	fmt.Println("姓名:", name)

	// 获取所有字段
	data, _ := rdb.HGetAll(ctx, "user:1").Result()
	fmt.Println("用户信息:", data)
	// 输出：map[age:25 email:zhang@example.com name:张三]

	// 检查字段是否存在
	exists, _ := rdb.HExists(ctx, "user:1", "phone").Result()
	fmt.Println("phone 字段存在:", exists) // false

	// 删除字段
	rdb.HDel(ctx, "user:1", "email")
}
```

## 7. List 类型（队列/栈）

```go
// 从左边推入（头部插入）
rdb.LPush(ctx, "tasks", "任务1", "任务2", "任务3")

// 从右边推入（尾部插入）
rdb.RPush(ctx, "tasks", "任务4")

// 从左边弹出（队列：先进先出）
task, _ := rdb.LPop(ctx, "tasks").Result()
fmt.Println("处理任务:", task) // 任务3

// 从右边弹出（栈：后进先出）
task, _ = rdb.RPop(ctx, "tasks").Result()
fmt.Println("处理任务:", task) // 任务4

// 获取列表长度
length, _ := rdb.LLen(ctx, "tasks").Result()
fmt.Println("剩余任务数:", length)

// 获取范围内的元素（0 到 -1 表示全部）
tasks, _ := rdb.LRange(ctx, "tasks", 0, -1).Result()
fmt.Println("所有任务:", tasks)
```

## 8. Set 类型（去重集合）

```go
// 添加成员
rdb.SAdd(ctx, "tags", "Go", "Redis", "MySQL", "Go") // Go 重复会被忽略

// 获取所有成员
members, _ := rdb.SMembers(ctx, "tags").Result()
fmt.Println("标签:", members) // [Go Redis MySQL]

// 检查成员是否存在
exists, _ := rdb.SIsMember(ctx, "tags", "Go").Result()
fmt.Println("Go 存在:", exists) // true

// 移除成员
rdb.SRem(ctx, "tags", "MySQL")

// 集合运算
rdb.SAdd(ctx, "user:1:tags", "Go", "Redis")
rdb.SAdd(ctx, "user:2:tags", "Redis", "MySQL")

// 交集（共同标签）
common, _ := rdb.SInter(ctx, "user:1:tags", "user:2:tags").Result()
fmt.Println("共同标签:", common) // [Redis]

// 并集（所有标签）
all, _ := rdb.SUnion(ctx, "user:1:tags", "user:2:tags").Result()
fmt.Println("所有标签:", all) // [Go Redis MySQL]
```

## 9. ZSet 类型（排行榜）

ZSet（有序集合）每个成员都有一个分数，按分数排序：

```go
// 添加成员（分数, 成员名）
rdb.ZAdd(ctx, "rank", redis.Z{Score: 100, Member: "张三"})
rdb.ZAdd(ctx, "rank", redis.Z{Score: 95, Member: "李四"})
rdb.ZAdd(ctx, "rank", redis.Z{Score: 88, Member: "王五"})

// 获取排名（从高到低，0 表示第一名）
rank, _ := rdb.ZRevRank(ctx, "rank", "张三").Result()
fmt.Println("张三排名:", rank+1) // 第 1 名

// 获取分数
score, _ := rdb.ZScore(ctx, "rank", "张三").Result()
fmt.Println("张三分数:", score) // 100

// 获取前 3 名（带分数）
top3, _ := rdb.ZRevRangeWithScores(ctx, "rank", 0, 2).Result()
for i, z := range top3 {
	fmt.Printf("第 %d 名: %s (%.0f 分)\n", i+1, z.Member, z.Score)
}
// 输出：
// 第 1 名: 张三 (100 分)
// 第 2 名: 李四 (95 分)
// 第 3 名: 王五 (88 分)

// 增加分数
rdb.ZIncrBy(ctx, "rank", 10, "王五") // 王五加 10 分
```

## 10. 缓存策略

### 策略一：Cache-Aside（旁路缓存）

最常用的模式：

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"time"
)

type Product struct {
	ID    uint   `gorm:"primarykey"`
	Name  string
	Price float64
}

var (
	db  *gorm.DB
	rdb *redis.Client
	ctx = context.Background()
)

func GetProduct(id uint) (*Product, error) {
	cacheKey := fmt.Sprintf("product:%d", id)

	// 1. 先查缓存
	cached, err := rdb.Get(ctx, cacheKey).Result()
	if err == nil {
		// 缓存命中
		var product Product
		json.Unmarshal([]byte(cached), &product)
		fmt.Println("从缓存获取")
		return &product, nil
	}

	// 2. 缓存未命中，查数据库
	var product Product
	if err := db.First(&product, id).Error; err != nil {
		return nil, err
	}
	fmt.Println("从数据库获取")

	// 3. 写入缓存（10 分钟过期）
	data, _ := json.Marshal(product)
	rdb.Set(ctx, cacheKey, data, 10*time.Minute)

	return &product, nil
}

func UpdateProduct(id uint, name string, price float64) error {
	// 1. 更新数据库
	if err := db.Model(&Product{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":  name,
		"price": price,
	}).Error; err != nil {
		return err
	}

	// 2. 删除缓存（下次查询时会重新加载）
	cacheKey := fmt.Sprintf("product:%d", id)
	rdb.Del(ctx, cacheKey)

	return nil
}

func main() {
	// 初始化数据库和 Redis
	db, _ = gorm.Open(sqlite.Open("test.db"), &gorm.Config{})
	db.AutoMigrate(&Product{})
	rdb = redis.NewClient(&redis.Options{Addr: "localhost:6379"})

	// 插入测试数据
	db.Create(&Product{Name: "iPhone 15", Price: 5999})

	// 第一次查询（从数据库）
	GetProduct(1)

	// 第二次查询（从缓存）
	GetProduct(1)

	// 更新商品
	UpdateProduct(1, "iPhone 15 Pro", 7999)

	// 再次查询（缓存已删除，从数据库）
	GetProduct(1)
}
```

### 策略二：缓存穿透防护

当查询不存在的数据时，缓存和数据库都没有，每次请求都会打到数据库。解决方案：**缓存空值**。

```go
func GetProductSafe(id uint) (*Product, error) {
	cacheKey := fmt.Sprintf("product:%d", id)

	// 查缓存
	cached, err := rdb.Get(ctx, cacheKey).Result()
	if err == nil {
		if cached == "null" {
			// 缓存了空值，说明数据不存在
			return nil, fmt.Errorf("商品不存在")
		}
		var product Product
		json.Unmarshal([]byte(cached), &product)
		return &product, nil
	}

	// 查数据库
	var product Product
	if err := db.First(&product, id).Error; err != nil {
		// 数据不存在，缓存空值（1 分钟）
		rdb.Set(ctx, cacheKey, "null", 1*time.Minute)
		return nil, fmt.Errorf("商品不存在")
	}

	// 缓存正常数据
	data, _ := json.Marshal(product)
	rdb.Set(ctx, cacheKey, data, 10*time.Minute)
	return &product, nil
}
```

## 11. 分布式锁

多个服务器同时操作同一资源时，需要加锁：

```go
package main

import (
	"context"
	"fmt"
	"github.com/redis/go-redis/v9"
	"time"
)

var rdb *redis.Client
var ctx = context.Background()

// 获取锁
func AcquireLock(lockKey string, timeout time.Duration) bool {
	// SET key value NX EX seconds
	// NX: 只在键不存在时设置
	// EX: 设置过期时间
	result, err := rdb.SetNX(ctx, lockKey, "locked", timeout).Result()
	return err == nil && result
}

// 释放锁
func ReleaseLock(lockKey string) {
	rdb.Del(ctx, lockKey)
}

func ProcessOrder(orderID int) {
	lockKey := fmt.Sprintf("lock:order:%d", orderID)

	// 尝试获取锁（10 秒超时）
	if !AcquireLock(lockKey, 10*time.Second) {
		fmt.Println("订单正在处理中，请稍后")
		return
	}
	defer ReleaseLock(lockKey) // 确保释放锁

	// 处理订单逻辑
	fmt.Println("开始处理订单", orderID)
	time.Sleep(2 * time.Second) // 模拟耗时操作
	fmt.Println("订单处理完成", orderID)
}

func main() {
	rdb = redis.NewClient(&redis.Options{Addr: "localhost:6379"})

	// 模拟两个服务器同时处理同一订单
	go ProcessOrder(1001)
	go ProcessOrder(1001)

	time.Sleep(5 * time.Second)
}
```

输出：
```
开始处理订单 1001
订单正在处理中，请稍后
订单处理完成 1001
```

## 12. 实战：Gin + Redis 缓存接口

```go
package main

import (
	"context"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"net/http"
	"strconv"
	"time"
)

type Article struct {
	ID      uint   `json:"id" gorm:"primarykey"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

var (
	db  *gorm.DB
	rdb *redis.Client
	ctx = context.Background()
)

func main() {
	// 初始化
	db, _ = gorm.Open(sqlite.Open("blog.db"), &gorm.Config{})
	db.AutoMigrate(&Article{})
	rdb = redis.NewClient(&redis.Options{Addr: "localhost:6379"})

	// 插入测试数据
	db.Create(&Article{Title: "Go 语言入门", Content: "这是一篇教程..."})

	r := gin.Default()

	// 获取文章（带缓存）
	r.GET("/articles/:id", func(c *gin.Context) {
		id, _ := strconv.Atoi(c.Param("id"))
		cacheKey := "article:" + c.Param("id")

		// 查缓存
		cached, err := rdb.Get(ctx, cacheKey).Result()
		if err == nil {
			var article Article
			json.Unmarshal([]byte(cached), &article)
			c.JSON(http.StatusOK, gin.H{
				"data":   article,
				"source": "cache",
			})
			return
		}

		// 查数据库
		var article Article
		if err := db.First(&article, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
			return
		}

		// 写入缓存
		data, _ := json.Marshal(article)
		rdb.Set(ctx, cacheKey, data, 5*time.Minute)

		c.JSON(http.StatusOK, gin.H{
			"data":   article,
			"source": "database",
		})
	})

	// 更新文章（删除缓存）
	r.PUT("/articles/:id", func(c *gin.Context) {
		id, _ := strconv.Atoi(c.Param("id"))
		var input Article
		c.BindJSON(&input)

		db.Model(&Article{}).Where("id = ?", id).Updates(input)

		// 删除缓存
		rdb.Del(ctx, "article:"+c.Param("id"))

		c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
	})

	r.Run(":8080")
}
```

测试：
```bash
# 第一次请求（从数据库）
curl http://localhost:8080/articles/1
# {"data":{...},"source":"database"}

# 第二次请求（从缓存）
curl http://localhost:8080/articles/1
# {"data":{...},"source":"cache"}
```

## 13. 常见问题

### 缓存雪崩

**问题**：大量缓存同时过期，请求全部打到数据库。

**解决方案**：给过期时间加随机值。

```go
// 不好：所有缓存都是 10 分钟过期
rdb.Set(ctx, key, data, 10*time.Minute)

// 好：过期时间在 10-15 分钟之间随机
import "math/rand"
randomExpire := 10*time.Minute + time.Duration(rand.Intn(300))*time.Second
rdb.Set(ctx, key, data, randomExpire)
```

### 缓存击穿

**问题**：热点数据过期瞬间，大量请求同时查数据库。

**解决方案**：使用分布式锁，只让一个请求查数据库。

```go
func GetHotData(key string) (string, error) {
	// 查缓存
	val, err := rdb.Get(ctx, key).Result()
	if err == nil {
		return val, nil
	}

	// 缓存未命中，尝试获取锁
	lockKey := "lock:" + key
	if AcquireLock(lockKey, 5*time.Second) {
		defer ReleaseLock(lockKey)

		// 再次检查缓存（可能其他协程已经加载了）
		val, err := rdb.Get(ctx, key).Result()
		if err == nil {
			return val, nil
		}

		// 查数据库并缓存
		data := queryDatabase(key)
		rdb.Set(ctx, key, data, 10*time.Minute)
		return data, nil
	}

	// 没获取到锁，等待一会再查缓存
	time.Sleep(100 * time.Millisecond)
	return rdb.Get(ctx, key).Result()
}
```

## 14. 最佳实践

1. **设置合理的过期时间**：避免内存占满
2. **键名规范**：使用冒号分隔，如 `user:1001:profile`
3. **序列化选择**：JSON 可读性好，MessagePack 更快更小
4. **监控缓存命中率**：命中率低于 80% 需要优化
5. **避免大 key**：单个 key 不要超过 1MB
6. **使用连接池**：go-redis 默认已启用

## 练习题

### 练习 1：实现访问计数器

要求：
- 记录每个用户的访问次数
- 每天零点重置计数
- 提供查询接口

### 练习 2：实现简单的限流器

要求：
- 每个 IP 每分钟最多访问 10 次
- 超过限制返回 429 状态码
- 使用 Gin 中间件实现

### 练习 3：实现热门文章排行榜

要求：
- 每次浏览文章时增加浏览量
- 实时显示浏览量前 10 的文章
- 使用 ZSet 实现

### 练习 4：实现分布式 Session

要求：
- 用户登录后生成 token
- token 存储在 Redis（30 分钟过期）
- 提供验证 token 的中间件

## 下一步

学完本章后，你已经掌握了 Redis 的核心用法。接下来可以学习：
- JWT 认证与中间件（实战篇第四章）
- 微服务架构中的 Redis 应用
- Redis 集群与高可用方案
