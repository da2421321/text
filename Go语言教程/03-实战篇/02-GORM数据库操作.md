# 02 - GORM 数据库操作进阶

在全栈开发中，数据库 ORM (如 Prisma, TypeORM) 是必备选项。Go 环境下目前最流行的是 [GORM](https://gorm.io/zh_CN/docs/index.html)。

**安装 GORM 与驱动：**
```bash
# 安装 GORM 核心
go get -u gorm.io/gorm

# 按需选择数据库驱动（二选一）
go get -u gorm.io/driver/mysql   # MySQL / MariaDB
go get -u gorm.io/driver/sqlite  # SQLite（本地开发调试用）
```

## 模型定义与映射

在 Go 里面没有类，所以表结构是通过 Struct 标签 `tag` 映射出来的：

```go
import "gorm.io/gorm"

// 等价于 TypeORM 定义 entity
type Product struct {
	gorm.Model                        // 嵌入主键 ID，CreatedAt，UpdatedAt，DeletedAt (软删除) 字段
	Code  string  `gorm:"uniqueIndex"` // 唯一索引
	Name  string  `gorm:"size:100;not null"`
	Price uint    `gorm:"default:1000"`
	Stock int     `gorm:"default:0"`
}
```

`gorm.Model` 展开后等价于：
```go
type Model struct {
	ID        uint           `gorm:"primarykey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"` // 软删除字段，不为 null 时视为已删除
}
```

常用的 `gorm` tag 速查：

| Tag | 说明 | 类比 TypeORM |
| --- | --- | --- |
| `primaryKey` | 主键 | `@PrimaryGeneratedColumn()` |
| `uniqueIndex` | 唯一索引 | `@Column({ unique: true })` |
| `not null` | 非空约束 | `@Column({ nullable: false })` |
| `default:val` | 默认值 | `@Column({ default: val })` |
| `size:100` | 字段长度 | `@Column({ length: 100 })` |
| `index` | 普通索引 | `@Index()` |
| `column:my_name` | 自定义列名 | `@Column({ name: 'my_name' })` |
| `-` | 忽略该字段，不映射到数据库 | — |

## 连接数据库

```go
package main

import (
	"gorm.io/driver/mysql"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"log"
	"os"
	"time"
)

var DB *gorm.DB

func InitDB() {
	// --- 方式一：SQLite（本地开发，零配置）---
	db, err := gorm.Open(sqlite.Open("test.db"), &gorm.Config{})

	// --- 方式二：MySQL（生产环境）---
	// dsn 格式：user:password@tcp(host:port)/dbname?charset=utf8mb4&parseTime=True&loc=Local
	// dsn := "root:password@tcp(127.0.0.1:3306)/mydb?charset=utf8mb4&parseTime=True&loc=Local"
	// db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
	// 	Logger: logger.New(
	// 		log.New(os.Stdout, "\r\n", log.LstdFlags),
	// 		logger.Config{
	// 			SlowThreshold: 200 * time.Millisecond, // 慢查询阈值
	// 			LogLevel:      logger.Info,            // 打印所有 SQL（开发时用）
	// 		},
	// 	),
	// })

	if err != nil {
		panic("数据库连接失败: " + err.Error())
	}

	// 配置连接池（生产必备，类比 Prisma 的 connection_limit）
	sqlDB, _ := db.DB()
	sqlDB.SetMaxIdleConns(10)           // 最大空闲连接数
	sqlDB.SetMaxOpenConns(100)          // 最大打开连接数
	sqlDB.SetConnMaxLifetime(time.Hour) // 连接最大存活时间

	// 自动迁移 schema，会自动创建/更新表结构（只增不删列）
	db.AutoMigrate(&Product{}, &User{}, &Order{})

	DB = db
}
```

## GORM 增删改查全套

```go
func main() {
	InitDB()

	// ── 增 (Create) ──────────────────────────────────────────────
	// 等价 SQL: INSERT INTO `products` (`created_at`,`updated_at`,`deleted_at`,`code`,`name`,`price`,`stock`) VALUES (...)
	product := Product{Code: "D42", Name: "键盘", Price: 299, Stock: 100}
	result := DB.Create(&product)
	// result.Error    → 错误信息
	// result.RowsAffected → 影响行数
	// product.ID      → 插入后自动回填的主键 ID（类似 Prisma 返回的 id）
	fmt.Println("新商品 ID:", product.ID)

	// 批量插入
	products := []Product{
		{Code: "A01", Name: "鼠标", Price: 99},
		{Code: "A02", Name: "显示器", Price: 1999},
	}
	// 等价 SQL: INSERT INTO `products` (`created_at`,`updated_at`,`deleted_at`,`code`,`name`,`price`,`stock`) VALUES (...), (...)
	DB.Create(&products)

	// ── 查 (Read) ──────────────────────────────────────────────
	var p Product
	// First：按主键升序取第一条，找不到会返回 ErrRecordNotFound
	// 等价 SQL: SELECT * FROM `products` WHERE `products`.`id` = 1 AND `products`.`deleted_at` IS NULL ORDER BY `products`.`id` LIMIT 1
	DB.First(&p, 1)                       
	// 等价 SQL: SELECT * FROM `products` WHERE code = 'D42' AND `products`.`deleted_at` IS NULL ORDER BY `products`.`id` LIMIT 1
	DB.First(&p, "code = ?", "D42")       

	// Find：查多条，找不到不报错（返回空切片）
	var all []Product
	// 等价 SQL: SELECT * FROM `products` WHERE `products`.`deleted_at` IS NULL
	DB.Find(&all)                          

	// 判断记录是否存在
	// 等价 SQL: SELECT * FROM `products` WHERE `products`.`id` = 99 AND `products`.`deleted_at` IS NULL ORDER BY `products`.`id` LIMIT 1
	if errors.Is(DB.First(&p, 99).Error, gorm.ErrRecordNotFound) {
		fmt.Println("商品不存在")
	}

	// ── 改 (Update) ──────────────────────────────────────────────
	// 更新单列
	// 等价 SQL: UPDATE `products` SET `price`=399,`updated_at`='...' WHERE `products`.`deleted_at` IS NULL AND `id` = 1
	DB.Model(&p).Update("Price", 399)

	// 更新多列（用 map 可以更新零值字段，用 struct 只更新非零值）
	// 等价 SQL: UPDATE `products` SET `price`=399,`stock`=50,`updated_at`='...' WHERE `products`.`deleted_at` IS NULL AND `id` = 1
	DB.Model(&p).Updates(map[string]interface{}{"price": 399, "stock": 50})

	// ── 删 (Delete) ──────────────────────────────────────────────
	// 软删除（因为嵌入了 gorm.Model，只是设置 deleted_at，不真正删除行）
	// 等价 SQL: UPDATE `products` SET `deleted_at`='...' WHERE `products`.`id` = 1 AND `products`.`deleted_at` IS NULL
	DB.Delete(&p, 1)

	// 硬删除（真正从数据库删除行）
	// 等价 SQL: DELETE FROM `products` WHERE `products`.`id` = 1
	DB.Unscoped().Delete(&p, 1)
}
```

## 高级查询 (Advanced Query)

在实际业务中，我们通常需要分页、排序以及更复杂的过滤条件：

```go
var products []Product

// 1. 条件查询 (Where)
// 等价 SQL: SELECT * FROM `products` WHERE price > 100 AND `products`.`deleted_at` IS NULL
DB.Where("price > ?", 100).Find(&products)

// 链式多条件
// 等价 SQL: SELECT * FROM `products` WHERE price > 100 AND stock > 0 AND `products`.`deleted_at` IS NULL
DB.Where("price > ? AND stock > ?", 100, 0).Find(&products)

// 2. 分页 (Limit & Offset)
page, pageSize := 1, 10
// 等价 SQL: SELECT * FROM `products` WHERE price > 100 AND `products`.`deleted_at` IS NULL LIMIT 10 OFFSET 0
DB.Where("price > ?", 100).
	Limit(pageSize).
	Offset((page - 1) * pageSize).
	Find(&products)

// 3. 排序 (Order)
// 等价 SQL: SELECT * FROM `products` WHERE `products`.`deleted_at` IS NULL ORDER BY price desc, created_at asc
DB.Order("price desc, created_at asc").Find(&products)

// 4. 选定字段 (Select)，避免 SELECT * 拉取不必要的大字段
// 等价 SQL: SELECT `id`,`code`,`price` FROM `products` WHERE `products`.`deleted_at` IS NULL
DB.Select("id", "code", "price").Find(&products)

// 5. 统计总数（分页时常用）
var total int64
// 等价 SQL: SELECT count(*) FROM `products` WHERE price > 100 AND `products`.`deleted_at` IS NULL
DB.Model(&Product{}).Where("price > ?", 100).Count(&total)
fmt.Println("符合条件的总数:", total)

// 6. 原生 SQL（复杂查询时的逃生舱）
// 等价 SQL: SELECT code, price FROM products WHERE price > 100 LIMIT 10
DB.Raw("SELECT code, price FROM products WHERE price > ? LIMIT ?", 100, 10).Scan(&products)
```

## 关联模型 (Associations)

复杂的业务离不开表之间的关联（一对一、一对多、多对多）。在 GORM 中，通过结构体嵌套来实现，并使用 `Preload` 预加载关联数据：

```go
type User struct {
	gorm.Model
	Username string
	Orders   []Order  // 一个用户有多个订单（一对多）
	Profile  Profile  // 一个用户有一个档案（一对一）
}

type Profile struct {
	gorm.Model
	UserID uint   // 外键，GORM 按约定自动识别
	Bio    string
}

type Order struct {
	gorm.Model
	UserID   uint    // 外键
	Amount   float64
	Tags     []Tag   `gorm:"many2many:order_tags;"` // 多对多，自动创建中间表 order_tags
}

type Tag struct {
	gorm.Model
	Name string
}
```

```go
// Preload：预加载关联数据（类比 Prisma 的 include）
var user User
// 实际执行两条 SQL（避免 N+1 问题）:
// 1: SELECT * FROM `users` WHERE `users`.`id` = 1 AND `users`.`deleted_at` IS NULL ORDER BY `users`.`id` LIMIT 1
// 2: SELECT * FROM `orders` WHERE `orders`.`user_id` = 1 AND `orders`.`deleted_at` IS NULL
DB.Preload("Orders").First(&user, 1)

// 嵌套预加载：同时加载订单及其标签
// 等价 SQL: 
// 1. SELECT * FROM `users` WHERE `users`.`id` = 1 AND `users`.`deleted_at` IS NULL ORDER BY `users`.`id` LIMIT 1
// 2. SELECT * FROM `orders` WHERE `orders`.`user_id` = 1 AND `orders`.`deleted_at` IS NULL
// 3. SELECT * FROM `order_tags` WHERE `order_tags`.`order_id` IN (订单ID列表)
// 4. SELECT * FROM `tags` WHERE `tags`.`id` IN (标签ID列表) AND `tags`.`deleted_at` IS NULL
DB.Preload("Orders.Tags").First(&user, 1)

// 加载全部关联
// 查询 user 及其所有关联的数据
DB.Preload(clause.Associations).First(&user, 1)

// 带条件的预加载：只加载金额大于 100 的订单
// 等价 SQL: 
// 1. SELECT * FROM `users` WHERE `users`.`id` = 1 AND `users`.`deleted_at` IS NULL ORDER BY `users`.`id` LIMIT 1
// 2. SELECT * FROM `orders` WHERE `orders`.`user_id` = 1 AND amount > 100 AND `orders`.`deleted_at` IS NULL
DB.Preload("Orders", "amount > ?", 100).First(&user, 1)
```

## 事务 (Transactions)

在涉及多张表的数据更新（比如：扣减商品库存 + 生成用户订单）等高敏感操作时，必须使用事务保证一致性和原子性。`gorm` 推荐使用闭包的方式执行事务：

```go
// db.Transaction 会开启自动事务
// 闭包内返回 error 会回滚(Rollback)，返回 nil 就会提交(Commit)
err := DB.Transaction(func(tx *gorm.DB) error {
	// ⚠️ 注意：在事务内部，必须使用回调里的 tx 变量而不是外部的 DB

	// 1. 扣减库存（使用 gorm.Expr 做原子更新，防止并发超卖）
	// 等价 SQL: UPDATE products SET stock = stock - 1 WHERE id = 1 AND stock > 0
	result := tx.Model(&Product{}).
		Where("id = ? AND stock > 0", 1).
		Update("stock", gorm.Expr("stock - ?", 1))
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("库存不足") // 触发回滚
	}

	// 2. 创建订单
	// 等价 SQL: INSERT INTO `orders` (`created_at`,`updated_at`,`deleted_at`,`user_id`,`amount`) VALUES (...)
	if err := tx.Create(&Order{UserID: 1, Amount: 100}).Error; err != nil {
		return err // 触发回滚
	}

	// 执行成功，提交事务
	return nil
})

if err != nil {
	fmt.Println("下单失败:", err)
}
```

## 与 Gin 集成：完整的商品列表接口示例

把 GORM 和 Gin 结合起来，写一个带分页的商品列表接口：

```go
package main

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"strconv"
)

type PageResult struct {
	Total int64       `json:"total"`
	List  interface{} `json:"list"`
}

func main() {
	InitDB()

	r := gin.Default()

	// GET /api/products?page=1&pageSize=10&minPrice=100
	r.GET("/api/products", func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
		minPrice, _ := strconv.Atoi(c.DefaultQuery("minPrice", "0"))

		var products []Product
		var total int64

		query := DB.Model(&Product{})
		if minPrice > 0 {
			query = query.Where("price >= ?", minPrice)
		}

		// 先 Count 再分页查询
		// 等价 SQL: SELECT count(*) FROM `products` WHERE price >= ? AND `products`.`deleted_at` IS NULL
		query.Count(&total)
		// 等价 SQL: SELECT `id`,`code`,`name`,`price`,`stock` FROM `products` WHERE price >= ? AND `products`.`deleted_at` IS NULL ORDER BY created_at desc LIMIT ? OFFSET ?
		query.Select("id", "code", "name", "price", "stock").
			Order("created_at desc").
			Limit(pageSize).
			Offset((page - 1) * pageSize).
			Find(&products)

		c.JSON(http.StatusOK, gin.H{
			"code": 0,
			"data": PageResult{Total: total, List: products},
		})
	})

	// POST /api/products
	r.POST("/api/products", func(c *gin.Context) {
		var product Product
		if err := c.ShouldBindJSON(&product); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"code": -1, "message": err.Error()})
			return
		}
		// 等价 SQL: INSERT INTO `products` (`created_at`,`updated_at`,`deleted_at`,`code`,`name`,`price`,`stock`) VALUES (...)
		if err := DB.Create(&product).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": -1, "message": "创建失败"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"code": 0, "data": product})
	})

	r.Run(":8080")
}
```

---

将这个 GORM 的操作机制跟上一讲的 `Gin` 路由和 Context 嵌到一起，你其实就能完整写出基于 MySQL 的后端微服务接口了。下一步可以尝试把数据库初始化、模型定义、路由处理函数拆分到不同文件，这就是企业级三层架构的雏形了。

## 生产补充 1：错误判断请使用 `errors.Is`
对 `gorm.ErrRecordNotFound` 的判断建议统一写法：

```go
if err := DB.First(&p, 99).Error; errors.Is(err, gorm.ErrRecordNotFound) {
    fmt.Println("商品不存在")
}
```

避免直接 `err == gorm.ErrRecordNotFound`，在错误包裹链下会失效。

## 生产补充 2：所有 DB 操作都建议携带 Context
HTTP 请求取消后，数据库查询也应及时取消：

```go
func ListProducts(ctx context.Context) ([]Product, error) {
    var products []Product
    err := DB.WithContext(ctx).Order("id desc").Find(&products).Error
    return products, err
}
```

## 生产补充 3：AutoMigrate 的边界
- 适合开发环境快速迭代。
- 生产环境涉及删列、重命名列、复杂索引变更时，建议使用专门迁移工具（如 `golang-migrate`）做可回滚脚本。
