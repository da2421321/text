# Gin框架

## Gin简介

Gin是一个用Go语言编写的Web框架，它以性能著称，具有快速的路由和中间件支持。

### 安装Gin

```bash
go mod init your-project-name
go get -u github.com/gin-gonic/gin
```

## 基本使用

### 简单的HTTP服务器

```go
// main.go
package main

import (
    "net/http"  // HTTP状态码常量

    "github.com/gin-gonic/gin"  // Gin框架
)

func main() {
    // 创建默认路由引擎
    // gin.Default() 会自动添加 Logger（日志）和 Recovery（崩溃恢复）中间件
    // 如果不需要这些中间件，可以使用 gin.New()
    r := gin.Default()

    // 定义路由 - GET 请求
    // 第一个参数：路由路径 "/"
    // 第二个参数：处理函数（handler）
    r.GET("/", func(c *gin.Context) {
        // c.JSON() 返回JSON格式的响应
        // 参数1：HTTP状态码（200表示成功）
        // 参数2：要返回的数据，gin.H 是 map[string]interface{} 的简写
        c.JSON(http.StatusOK, gin.H{
            "message": "Hello, World!",
        })
    })

    // 定义第二个路由 - 用于健康检查
    r.GET("/ping", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "message": "pong",  // 返回 pong 表示服务正常运行
        })
    })

    // 启动HTTP服务器
    // r.Run(":8080") 表示监听本地8080端口
    // 访问地址：http://localhost:8080
    r.Run(":8080")
}
```

**💡 核心概念解析：**

- **gin.Default()**：创建带默认中间件的路由引擎（推荐新手使用）
- **gin.Context (c)**：请求上下文，包含请求和响应的所有信息
- **c.JSON()**：返回JSON格式数据，自动设置Content-Type为application/json
- **gin.H**：Gin提供的便捷类型，等同于 `map[string]interface{}`

### 路由参数

```go
package main

import (
    "net/http"
    "strconv"  // 字符串转换工具包

    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()

    // 【路径参数】- 使用冒号 : 定义动态路径
    // 示例访问：http://localhost:8080/user/张三
    r.GET("/user/:name", func(c *gin.Context) {
        // c.Param() 获取路径中的动态参数
        name := c.Param("name")  // 获取 :name 的值 -> "张三"
        // c.String() 返回纯文本响应，支持格式化输出
        c.String(http.StatusOK, "Hello %s", name)  // 输出：Hello 张三
    })

    // 【通配符参数】- 使用 * 匹配剩余所有路径
    // 示例访问：http://localhost:8080/user/张三/edit/profile
    r.GET("/user/:name/*action", func(c *gin.Context) {
        name := c.Param("name")      // 获取 :name -> "张三"
        action := c.Param("action")  // 获取 *action -> "/edit/profile"（注意包含前导斜杠）
        message := name + " is " + action
        c.String(http.StatusOK, message)  // 输出：张三 is /edit/profile
    })

    // 【查询参数】- URL中?后面的参数
    // 示例访问：http://localhost:8080/welcome?firstname=张&lastname=三
    // 示例访问：http://localhost:8080/welcome （使用默认值）
    r.GET("/welcome", func(c *gin.Context) {
        // c.DefaultQuery() 获取查询参数，如果不存在则使用默认值
        firstname := c.DefaultQuery("firstname", "Guest")  // 不存在时返回 "Guest"
        // c.Query() 获取查询参数，不存在时返回空字符串 ""
        lastname := c.Query("lastname")

        c.String(http.StatusOK, "Hello %s %s", firstname, lastname)
    })

    r.Run(":8080")
}
```

**📌 三种参数类型对比：**

| 参数类型       | 语法         | 示例URL              | 获取方法            | 特点               |
| -------------- | ------------ | -------------------- | ------------------- | ------------------ |
| **路径参数**   | `:name`      | `/user/张三`         | `c.Param("name")`   | 必填，路径的一部分 |
| **通配符参数** | `*action`    | `/user/张三/edit`    | `c.Param("action")` | 匹配剩余路径       |
| **查询参数**   | `?key=value` | `/welcome?name=张三` | `c.Query("name")`   | 可选，用&连接多个  |

### 请求体绑定

```go
package main

import (
    "net/http"

    "github.com/gin-gonic/gin"
)

// 【定义结构体用于数据绑定】
// 结构体标签（Tag）说明：
// - json:"字段名"：指定JSON中的字段名
// - binding:"规则"：数据验证规则
type Login struct {
    User     string `json:"user" binding:"required"`      // required：必填字段
    Password string `json:"password" binding:"required"`  // 密码也是必填
}

type User struct {
    Name  string `json:"name" binding:"required"`          // 姓名必填
    Email string `json:"email" binding:"required,email"`   // 必填且必须是邮箱格式
    Age   int    `json:"age" binding:"gte=0,lte=130"`      // 年龄：大于等于0，小于等于130
}

// 常用验证规则：
// - required：必填
// - email：邮箱格式
// - min=n：最小长度/值
// - max=n：最大长度/值
// - gte=n：大于等于（greater than or equal）
// - lte=n：小于等于（less than or equal）
// - len=n：长度必须等于n

func main() {
    r := gin.Default()

    // 【绑定JSON数据】- POST请求
    // 前端发送：{"user": "manu", "password": "123"}
    r.POST("/login", func(c *gin.Context) {
        var json Login
        // c.ShouldBindJSON() 将请求体的JSON数据绑定到结构体
        // 同时会自动进行数据验证（根据binding标签）
        if err := c.ShouldBindJSON(&json); err != nil {
            // 验证失败，返回400错误和错误信息
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return  // 提前返回，不再执行后续代码
        }

        // 验证用户名和密码（实际项目应查询数据库）
        if json.User != "manu" || json.Password != "123" {
            // 认证失败，返回401未授权
            c.JSON(http.StatusUnauthorized, gin.H{"status": "unauthorized"})
            return
        }

        // 登录成功，返回200状态码
        c.JSON(http.StatusOK, gin.H{"status": "you are logged in"})
    })

    // 绑定表单数据
    r.POST("/user", func(c *gin.Context) {
        var user User
        if err := c.ShouldBind(&user); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        c.JSON(http.StatusOK, gin.H{
            "message": "User created successfully",
            "user":    user,
        })
    })

    r.Run(":8080")
}
```

## 中间件

### 自定义中间件

```go
package main

import (
    "log"
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
)

// 【自定义日志中间件】
// 中间件就是一个返回 gin.HandlerFunc 的函数
func Logger() gin.HandlerFunc {
    return func(c *gin.Context) {
        // ====== 请求处理前的逻辑 ======
        t := time.Now()  // 记录开始时间

        // c.Next() 是关键：执行后续的中间件和处理函数
        // Next()之前的代码在请求处理前执行
        // Next()之后的代码在请求处理后执行
        c.Next()

        // ====== 请求处理后的逻辑 ======
        latency := time.Since(t)  // 计算处理耗时
        // 记录日志：[状态码] 方法 路径 耗时
        // 示例输出：[200] GET /api/users 15.2ms
        log.Printf("[%d] %s %s %v", c.Writer.Status(), c.Request.Method, c.Request.URL.Path, latency)
    }
}

// 【认证中间件】- 验证用户身份
func AuthRequired() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 从请求头获取 Authorization 字段
        // 示例：Authorization: Bearer secret-token
        token := c.GetHeader("Authorization")

        // 验证token是否正确（实际项目应该解析JWT）
        if token != "Bearer secret-token" {
            // 认证失败，返回401错误
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization required"})
            // c.Abort() 非常重要！它会阻止后续中间件和处理函数的执行
            c.Abort()
            return
        }

        // 认证成功，将用户信息存入上下文
        // c.Set() 设置的值可以在后续的处理函数中通过 c.Get() 获取
        c.Set("user", "admin")

        // 继续执行后续的中间件和处理函数
        c.Next()
    }
}

// 🔑 中间件执行流程：
// 1. 中间件A - 前置逻辑
// 2. 中间件B - 前置逻辑
// 3. 业务处理函数
// 4. 中间件B - 后置逻辑
// 5. 中间件A - 后置逻辑

func main() {
    r := gin.New()

    // 使用中间件
    r.Use(Logger())

    r.GET("/", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "message": "Hello, World!",
        })
    })

    // 【路由组】- 将相关路由组织在一起
    // 创建 /admin 路由组，所有路由都以 /admin 开头
    authorized := r.Group("/admin")
    // 为路由组添加认证中间件
    // 该组内的所有路由都会先执行 AuthRequired() 中间件
    authorized.Use(AuthRequired())
    {
        // 这个路由的完整路径是：GET /admin/users
        authorized.GET("/users", func(c *gin.Context) {
            // c.Get() 获取中间件中通过 c.Set() 设置的值
            user, _ := c.Get("user")  // 获取认证中间件设置的用户信息
            c.JSON(http.StatusOK, gin.H{
                "message": "Admin users",
                "user":    user,  // 返回值：admin
            })
        })

        // 完整路径：POST /admin/users
        authorized.POST("/users", func(c *gin.Context) {
            user, _ := c.Get("user")  // 同样可以获取用户信息
            c.JSON(http.StatusOK, gin.H{
                "message": "Admin create user",
                "user":    user,
            })
        })
    }

// 💡 路由组的优势：
// 1. 统一路径前缀（/admin）
// 2. 共享中间件（AuthRequired）
// 3. 代码组织更清晰

    r.Run(":8080")
}
```

### 内置中间件

```go
package main

import (
    "github.com/gin-gonic/gin"
)

func main() {
    // 使用默认中间件（Logger和Recovery）
    r := gin.Default()

    // 或者创建不带中间件的路由引擎
    // r := gin.New()

    // 手动添加中间件
    // r.Use(gin.Logger())
    // r.Use(gin.Recovery())

    // 静态文件服务
    r.Static("/static", "./static")
    r.StaticFile("/favicon.ico", "./resources/favicon.ico")

    // 恢复中间件可以捕获panic并恢复
    r.GET("/panic", func(c *gin.Context) {
        panic("这是一个测试panic")
    })

    r.Run(":8080")
}
```

## 数据验证

```go
package main

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
)

type User struct {
    Name     string `json:"name" binding:"required,min=2,max=20"`
    Email    string `json:"email" binding:"required,email"`
    Age      int    `json:"age" binding:"required,gte=0,lte=130"`
    Password string `json:"password" binding:"required,min=6"`
}

func main() {
    r := gin.Default()

    r.POST("/user", func(c *gin.Context) {
        var user User
        if err := c.ShouldBindJSON(&user); err != nil {
            // 处理验证错误
            if validationErrors, ok := err.(validator.ValidationErrors); ok {
                var errors []string
                for _, fieldError := range validationErrors {
                    errors = append(errors, fieldError.Field()+" "+fieldError.Tag())
                }
                c.JSON(http.StatusBadRequest, gin.H{
                    "error": "验证失败",
                    "fields": errors,
                })
                return
            }

            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        c.JSON(http.StatusOK, gin.H{
            "message": "用户创建成功",
            "user":    user,
        })
    })

    r.Run(":8080")
}
```

## 文件上传

```go
package main

import (
    "fmt"
    "net/http"

    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()

    // 设置最大内存限制 (默认是 32 MiB)
    r.MaxMultipartMemory = 8 << 20 // 8 MiB

    // 【单文件上传】
    r.POST("/upload", func(c *gin.Context) {
        // c.FormFile() 获取上传的文件
        // 参数 "file" 对应HTML表单中的字段名：<input type="file" name="file">
        file, err := c.FormFile("file")
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        // 文件信息：
        // - file.Filename：原始文件名
        // - file.Size：文件大小（字节）
        // - file.Header：文件头信息

        // c.SaveUploadedFile() 保存文件到服务器
        // 参数1：文件对象
        // 参数2：保存路径（这里直接用原文件名，实际应该处理重名问题）
        if err := c.SaveUploadedFile(file, file.Filename); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        c.JSON(http.StatusOK, gin.H{
            "message": fmt.Sprintf("'%s' uploaded!", file.Filename),
        })
    })

    // 💡 实际项目中的文件上传最佳实践：
    // 1. 验证文件类型（图片、PDF等）
    // 2. 限制文件大小
    // 3. 重命名文件（使用UUID避免重名）
    // 4. 存储到专门的目录或云存储（OSS、S3）

    r.POST("/upload-multi", func(c *gin.Context) {
        // 多文件
        form, _ := c.MultipartForm()
        files := form.File["upload[]"]

        for _, file := range files {
            if err := c.SaveUploadedFile(file, file.Filename); err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
                return
            }
        }

        c.JSON(http.StatusOK, gin.H{
            "message": fmt.Sprintf("%d files uploaded!", len(files)),
        })
    })

    r.Run(":8080")
}
```

## 代码示例

```go
// complete_example.go
package main

import (
    "fmt"
    "net/http"
    "strconv"
    "sync"
    "time"
    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
)

// 数据模型
type Product struct {
    ID    int     `json:"id"`
    Name  string  `json:"name" binding:"required"`
    Price float64 `json:"price" binding:"required,gt=0"`
    Desc  string  `json:"description"`
}

type Order struct {
    ID       int       `json:"id"`
    Product  Product   `json:"product" binding:"required"`
    Quantity int       `json:"quantity" binding:"required,gt=0"`
    Total    float64   `json:"total"`
    Created  time.Time `json:"created"`
}

// 【模拟数据库】- 实际项目应使用MySQL、PostgreSQL等
type Database struct {
    products map[int]Product  // 存储产品数据，key是产品ID
    orders   map[int]Order    // 存储订单数据，key是订单ID
    nextID   int              // 自增ID生成器
    mu       sync.RWMutex     // 读写锁，保证并发安全
}

// 🔒 并发安全说明：
// - sync.RWMutex 是读写互斥锁
// - 读操作用 RLock()/RUnlock()，多个读操作可以同时进行
// - 写操作用 Lock()/Unlock()，写操作会阻塞所有读写操作
// - 防止并发访问时的数据竞争问题

func NewDatabase() *Database {
    return &Database{
        products: make(map[int]Product),
        orders:   make(map[int]Order),
        nextID:   1,
    }
}

// 【创建产品】- 写操作
func (db *Database) CreateProduct(product Product) Product {
    db.mu.Lock()          // 🔒 加写锁，阻塞其他所有操作
    defer db.mu.Unlock()  // 🔓 函数结束时自动解锁（defer关键字）

    product.ID = db.nextID           // 分配ID
    db.products[product.ID] = product // 存入map
    db.nextID++                       // ID自增

    return product
}

// 【获取单个产品】- 读操作
func (db *Database) GetProduct(id int) (Product, bool) {
    db.mu.RLock()         // 🔒 加读锁，允许其他读操作同时进行
    defer db.mu.RUnlock() // 🔓 自动解锁

    // map取值的两个返回值：
    // - product: 产品对象
    // - exists: 是否存在该key（true/false）
    product, exists := db.products[id]
    return product, exists
}

func (db *Database) ListProducts() []Product {
    db.mu.RLock()
    defer db.mu.RUnlock()

    var products []Product
    for _, product := range db.products {
        products = append(products, product)
    }

    return products
}

func (db *Database) CreateOrder(order Order) Order {
    db.mu.Lock()
    defer db.mu.Unlock()

    order.ID = db.nextID
    order.Total = order.Product.Price * float64(order.Quantity)
    order.Created = time.Now()

    db.orders[order.ID] = order
    db.nextID++

    return order
}

func (db *Database) GetOrder(id int) (Order, bool) {
    db.mu.RLock()
    defer db.mu.RUnlock()

    order, exists := db.orders[id]
    return order, exists
}

// 全局数据库实例
var db = NewDatabase()

// 中间件
func CORSMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Header("Access-Control-Allow-Origin", "*")
        c.Header("Access-Control-Allow-Credentials", "true")
        c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
        c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }

        c.Next()
    }
}

func main() {
    // 初始化一些测试数据
    db.CreateProduct(Product{Name: "笔记本电脑", Price: 5999.99, Desc: "高性能笔记本"})
    db.CreateProduct(Product{Name: "无线鼠标", Price: 99.99, Desc: "人体工学设计"})
    db.CreateProduct(Product{Name: "机械键盘", Price: 299.99, Desc: "青轴机械键盘"})

    r := gin.Default()

    // 使用中间件
    r.Use(CORSMiddleware())

    // 产品相关路由
    products := r.Group("/api/products")
    {
        products.GET("", listProducts)
        products.GET("/:id", getProduct)
        products.POST("", createProduct)
    }

    // 订单相关路由
    orders := r.Group("/api/orders")
    {
        orders.GET("", listOrders)
        orders.GET("/:id", getOrder)
        orders.POST("", createOrder)
    }

    r.Run(":8080")
}

func listProducts(c *gin.Context) {
    products := db.ListProducts()
    c.JSON(http.StatusOK, products)
}

func getProduct(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "无效的产品ID"})
        return
    }

    product, exists := db.GetProduct(id)
    if !exists {
        c.JSON(http.StatusNotFound, gin.H{"error": "产品不存在"})
        return
    }

    c.JSON(http.StatusOK, product)
}

func createProduct(c *gin.Context) {
    var product Product
    if err := c.ShouldBindJSON(&product); err != nil {
        handleValidationError(c, err)
        return
    }

    createdProduct := db.CreateProduct(product)
    c.JSON(http.StatusCreated, createdProduct)
}

func listOrders(c *gin.Context) {
    // 简化实现，实际应该从数据库获取
    c.JSON(http.StatusOK, []Order{})
}

func getOrder(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "无效的订单ID"})
        return
    }

    order, exists := db.GetOrder(id)
    if !exists {
        c.JSON(http.StatusNotFound, gin.H{"error": "订单不存在"})
        return
    }

    c.JSON(http.StatusOK, order)
}

func createOrder(c *gin.Context) {
    var order Order
    if err := c.ShouldBindJSON(&order); err != nil {
        handleValidationError(c, err)
        return
    }

    // 检查产品是否存在
    if order.Product.ID == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "请选择产品"})
        return
    }

    _, exists := db.GetProduct(order.Product.ID)
    if !exists {
        c.JSON(http.StatusBadRequest, gin.H{"error": "产品不存在"})
        return
    }

    createdOrder := db.CreateOrder(order)
    c.JSON(http.StatusCreated, createdOrder)
}

func handleValidationError(c *gin.Context, err error) {
    if validationErrors, ok := err.(validator.ValidationErrors); ok {
        var errors []string
        for _, fieldError := range validationErrors {
            errors = append(errors, fmt.Sprintf("%s %s",
                fieldError.Field(), fieldError.Tag()))
        }
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "验证失败",
            "fields": errors,
        })
        return
    }

    c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
}
```

## 练习题

1. 创建一个博客API，支持文章的增删改查操作
2. 实现用户认证和授权功能，使用JWT令牌
3. 创建一个文件管理系统，支持文件上传、下载和列表功能

```go
// 练习题参考答案

// blog_api.go
package main

import (
    "net/http"
    "strconv"
    "sync"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v4"
)

// 文章模型
type Article struct {
    ID        int       `json:"id"`
    Title     string    `json:"title" binding:"required"`
    Content   string    `json:"content" binding:"required"`
    Author    string    `json:"author" binding:"required"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

// 用户模型
type User struct {
    ID       int    `json:"id"`
    Username string `json:"username" binding:"required"`
    Password string `json:"password" binding:"required"`
    Email    string `json:"email" binding:"required,email"`
}

// 模拟数据库
type BlogDB struct {
    articles map[int]Article
    users    map[string]User
    nextID   int
    mu       sync.RWMutex
}

func NewBlogDB() *BlogDB {
    db := &BlogDB{
        articles: make(map[int]Article),
        users:    make(map[string]User),
        nextID:   1,
    }

    // 添加默认用户
    db.users["admin"] = User{
        ID:       1,
        Username: "admin",
        Password: "admin123",
        Email:    "admin@example.com",
    }

    return db
}

var db = NewBlogDB()

// 【JWT配置】
// JWT密钥 - 用于签名和验证token（生产环境应使用环境变量存储）
var jwtKey = []byte("my_secret_key")

// 【JWT声明结构】- 定义token中包含的信息
type Claims struct {
    Username string `json:"username"`  // 自定义字段：用户名
    jwt.RegisteredClaims               // 嵌入标准声明（过期时间、签发者等）
}

// 📌 JWT（JSON Web Token）工作原理：
// 1. 用户登录成功后，生成包含用户信息的token
// 2. 前端在后续请求中携带token（通常放在Authorization请求头）
// 3. 服务端验证token的有效性，提取用户信息
// 4. 无需查询数据库即可验证用户身份

// 【JWT认证中间件】- 验证token有效性
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 1️⃣ 从请求头获取token
        // 前端应发送：Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
        tokenString := c.GetHeader("Authorization")
        if tokenString == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "缺少认证令牌"})
            c.Abort()  // 终止请求
            return
        }

        // 2️⃣ 解析token
        claims := &Claims{}
        // jwt.ParseWithClaims() 解析并验证token
        // 参数1：token字符串
        // 参数2：用于存储解析结果的Claims对象
        // 参数3：返回验证密钥的函数
        token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
            return jwtKey, nil  // 返回签名密钥
        })

        // 3️⃣ 验证token
        if err != nil || !token.Valid {
            // token过期、签名错误、格式错误等都会导致验证失败
            c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的认证令牌"})
            c.Abort()
            return
        }

        // 4️⃣ 验证成功，将用户名存入上下文
        // 后续的处理函数可以通过 c.Get("username") 获取
        c.Set("username", claims.Username)
        c.Next()  // 继续执行后续处理
    }
}

func main() {
    r := gin.Default()

    // 公开路由
    r.POST("/login", login)
    r.POST("/register", register)

    // 受保护的路由
    authorized := r.Group("/")
    authorized.Use(AuthMiddleware())
    {
        authorized.GET("/articles", listArticles)
        authorized.GET("/articles/:id", getArticle)
        authorized.POST("/articles", createArticle)
        authorized.PUT("/articles/:id", updateArticle)
        authorized.DELETE("/articles/:id", deleteArticle)
    }

    r.Run(":8080")
}

// 【登录接口】- 验证用户并生成JWT
func login(c *gin.Context) {
    // 1️⃣ 接收登录请求
    var user User
    if err := c.ShouldBindJSON(&user); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // 2️⃣ 验证用户名和密码
    dbUser, exists := db.users[user.Username]
    if !exists || dbUser.Password != user.Password {
        // 实际项目应：
        // - 密码应该用bcrypt等算法加密存储
        // - 不要明确告诉攻击者是用户名错误还是密码错误
        c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
        return
    }

    // 3️⃣ 生成JWT令牌
    // 设置过期时间为24小时后
    expirationTime := time.Now().Add(24 * time.Hour)

    // 创建Claims（声明）
    claims := &Claims{
        Username: user.Username,  // 自定义字段
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(expirationTime),  // 过期时间
            // 还可以添加：
            // IssuedAt: 签发时间
            // Issuer: 签发者
        },
    }

    // 4️⃣ 创建token对象
    // jwt.SigningMethodHS256 表示使用HMAC-SHA256算法签名
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

    // 5️⃣ 用密钥签名token，生成最终的token字符串
    tokenString, err := token.SignedString(jwtKey)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "无法生成令牌"})
        return
    }

    // 6️⃣ 返回token给前端
    // 前端应保存token（通常存在localStorage或sessionStorage）
    // 后续请求在Authorization头中携带此token
    c.JSON(http.StatusOK, gin.H{
        "message": "登录成功",
        "token":   tokenString,  // 示例：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    })
}

func register(c *gin.Context) {
    var user User
    if err := c.ShouldBindJSON(&user); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    db.mu.Lock()
    defer db.mu.Unlock()

    if _, exists := db.users[user.Username]; exists {
        c.JSON(http.StatusBadRequest, gin.H{"error": "用户名已存在"})
        return
    }

    user.ID = len(db.users) + 1
    db.users[user.Username] = user

    c.JSON(http.StatusCreated, gin.H{
        "message": "注册成功",
        "user":    user,
    })
}

func listArticles(c *gin.Context) {
    db.mu.RLock()
    defer db.mu.RUnlock()

    var articles []Article
    for _, article := range db.articles {
        articles = append(articles, article)
    }

    c.JSON(http.StatusOK, articles)
}

func getArticle(c *gin.Context) {
    // 📌 解析 URL 路径参数中的 id
    // 例如：GET /articles/123
    // c.Param("id") 获取 "123" 字符串
    // strconv.Atoi() 将字符串 "123" 转换为整数 123
    // 返回两个值：
    //   - id: 转换后的整数（如果成功）
    //   - err: 错误信息（如果转换失败，比如传入 "abc"）
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        // 转换失败，说明 id 不是有效的数字
        c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文章ID"})
        return
    }

    db.mu.RLock()
    defer db.mu.RUnlock()

    article, exists := db.articles[id]
    if !exists {
        c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
        return
    }

    c.JSON(http.StatusOK, article)
}

func createArticle(c *gin.Context) {
    username, _ := c.Get("username")

    var article Article
    if err := c.ShouldBindJSON(&article); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    db.mu.Lock()
    defer db.mu.Unlock()

    article.ID = db.nextID
    article.Author = username.(string)
    article.CreatedAt = time.Now()
    article.UpdatedAt = time.Now()

    db.articles[article.ID] = article
    db.nextID++

    c.JSON(http.StatusCreated, article)
}

func updateArticle(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文章ID"})
        return
    }

    username, _ := c.Get("username")

    var article Article
    if err := c.ShouldBindJSON(&article); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    db.mu.Lock()
    defer db.mu.Unlock()

    existingArticle, exists := db.articles[id]
    if !exists {
        c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
        return
    }

    // 检查权限
    if existingArticle.Author != username.(string) {
        c.JSON(http.StatusForbidden, gin.H{"error": "无权限修改他人文章"})
        return
    }

    article.ID = id
    article.Author = existingArticle.Author
    article.CreatedAt = existingArticle.CreatedAt
    article.UpdatedAt = time.Now()

    db.articles[id] = article

    c.JSON(http.StatusOK, article)
}

func deleteArticle(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文章ID"})
        return
    }

    username, _ := c.Get("username")

    db.mu.Lock()
    defer db.mu.Unlock()

    article, exists := db.articles[id]
    if !exists {
        c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
        return
    }

    // 检查权限
    if article.Author != username.(string) {
        c.JSON(http.StatusForbidden, gin.H{"error": "无权限删除他人文章"})
        return
    }

    delete(db.articles, id)

    c.JSON(http.StatusOK, gin.H{"message": "文章删除成功"})
}
```

## 总结

本章详细介绍了Go语言的Gin Web框架，包括路由定义、中间件使用、数据验证、文件上传等核心功能。通过完整的示例和练习题，帮助读者掌握使用Gin构建RESTful API的方法。Gin框架以其高性能和简洁的API设计成为Go语言Web开发的首选框架之一。

### 🎯 核心知识点回顾

| 知识点         | 核心API                                      | 应用场景             |
| -------------- | -------------------------------------------- | -------------------- |
| **路由定义**   | `r.GET/POST/PUT/DELETE(path, handler)`       | 定义HTTP端点         |
| **参数获取**   | `c.Param()`、`c.Query()`、`c.DefaultQuery()` | 获取路径/查询参数    |
| **数据绑定**   | `c.ShouldBindJSON()`、`c.ShouldBind()`       | 解析请求体并验证     |
| **中间件**     | `r.Use()`、`c.Next()`、`c.Abort()`           | 认证、日志、CORS     |
| **上下文传值** | `c.Set(key, value)`、`c.Get(key)`            | 中间件间传递数据     |
| **响应输出**   | `c.JSON()`、`c.String()`、`c.HTML()`         | 返回不同格式数据     |
| **路由组**     | `r.Group(path)`、`group.Use(middleware)`     | 组织路由、共享中间件 |
| **文件操作**   | `c.FormFile()`、`c.SaveUploadedFile()`       | 文件上传             |

### 🚀 最佳实践建议

1. **使用结构体标签进行数据验证** - 减少手动验证代码，提高代码可读性
2. **通过中间件实现横切关注点** - 认证、日志、CORS等功能与业务逻辑分离
3. **使用路由组组织API** - 统一路径前缀，共享中间件，代码结构清晰
4. **使用互斥锁保证并发安全** - 多个goroutine同时访问共享数据时必须加锁
5. **统一错误处理** - 提供一致的API响应格式，便于前端处理
6. **JWT认证** - 无状态认证，适合分布式系统和微服务架构
7. **参数验证** - 在数据进入业务逻辑前验证，防止无效数据

### 📚 学习路线

- ✅ 已完成：Gin框架基础
- ⏭️ 下一步：Go语言的数据库操作（GORM、SQL）
- 🎯 进阶方向：微服务架构、gRPC、消息队列
