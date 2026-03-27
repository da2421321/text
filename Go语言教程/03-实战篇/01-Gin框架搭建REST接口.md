# 01 - Gin 框架构建 RESTful API

作为一个全栈，后端首先得是一个可以发 JSON 的 HTTP 服务器。
这等价于你在 JS 世界里的 Express 或是 Koa。这里我们使用国产的极简高效框架 [Gin](https://gin-gonic.com/)

**安装 Gin：**
```bash
# 在你初始化的 Go 工程根目录下执行：
go get -u github.com/gin-gonic/gin
```

## 初探 Gin 路由和接口
```go
package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

// 定义接收请求参数的结构体（类似于 TS 的 DTO）
type LoginDTO struct {
	Username string `json:"username" binding:"required"` // binding 代表校验规则
	Password string `json:"password" binding:"required"`
}

func main() {
	// 初始化路由类似于 const app = express()
	r := gin.Default()

	// 1. GET 路由
	r.GET("/ping", func(c *gin.Context) {
		// 返回 JSON 响应 200 HTTP 状态
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	// 2. POST 路由接受 JSON Body
	r.POST("/login", func(c *gin.Context) {
		var req LoginDTO
		// c.ShouldBindJSON 类似于 req.body 并根据 struct 的 Tag 进行字段校验
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 假设验证通过
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"user":   req.Username,
			"token":  "fake-jwt-token",
		})
	})

	// 监听并在 0.0.0.0:8080 上启动服务
	r.Run(":8080")
}
```

运行后，一个 8080 端口的高性能服务器就启动了。这对于前端开发者而言可以说是非常亲切了！

## 路由参数与查询字符串

类比 Express 的 `req.params` 和 `req.query`，Gin 也有对应的取法：

```go
// 动态路由参数：/users/:id  →  类似 Express 的 app.get('/users/:id')
r.GET("/users/:id", func(c *gin.Context) {
	id := c.Param("id") // 取 :id 的值
	c.JSON(http.StatusOK, gin.H{"id": id})
})

// 查询字符串：/search?keyword=gin&page=1  →  类似 req.query.keyword
r.GET("/search", func(c *gin.Context) {
	keyword := c.Query("keyword")           // 必须有值
	page := c.DefaultQuery("page", "1")     // 有默认值，类似 req.query.page ?? '1'
	c.JSON(http.StatusOK, gin.H{
		"keyword": keyword,
		"page":    page,
	})
})
```

## 路由分组 (Router Group)

类比 Express 的 `express.Router()`，Gin 用 `Group` 来组织模块化路由，避免路径前缀重复书写：

```go
func main() {
	r := gin.Default()

	// /api/v1 前缀的路由组
	v1 := r.Group("/api/v1")
	{
		v1.GET("/users", listUsers)       // GET  /api/v1/users
		v1.POST("/users", createUser)     // POST /api/v1/users
		v1.GET("/users/:id", getUser)     // GET  /api/v1/users/:id
		v1.PUT("/users/:id", updateUser)  // PUT  /api/v1/users/:id
		v1.DELETE("/users/:id", deleteUser) // DELETE /api/v1/users/:id
	}

	r.Run(":8080")
}

// 将处理函数单独抽出来，保持路由注册的整洁
func listUsers(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"users": []string{"Alice", "Bob"}})
}

func createUser(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{"message": "user created"})
}

func getUser(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{"id": id})
}

func updateUser(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{"message": "updated", "id": id})
}

func deleteUser(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{"message": "deleted", "id": id})
}
```

## 中间件 (Middleware)

类比 Express 的 `app.use()`，Gin 的中间件通过 `Use()` 注册，用 `c.Next()` 传递控制权：

```go
// 自定义日志中间件（类似 morgan）
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 请求前执行
		fmt.Printf("[请求] %s %s\n", c.Request.Method, c.Request.URL.Path)

		c.Next() // 调用下一个处理函数（类似 Express 的 next()）

		// 请求后执行（响应已写入）
		fmt.Printf("[响应] 状态码: %d\n", c.Writer.Status())
	}
}

// 简单的 Token 鉴权中间件
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token != "Bearer valid-token" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort() // 终止后续处理，类似 Express 里不调用 next() 直接 return
			return
		}
		c.Next()
	}
}

func main() {
	r := gin.Default() // gin.Default() 已内置了 Logger 和 Recovery 中间件

	// 全局中间件
	r.Use(Logger())

	// 只对特定路由组生效的中间件（如：需要登录才能访问的接口）
	auth := r.Group("/api")
	auth.Use(AuthRequired())
	{
		auth.GET("/profile", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"profile": "user data"})
		})
	}

	r.Run(":8080")
}
```

## 在中间件中传递数据

中间件和处理函数之间可以通过 `c.Set` / `c.Get` 共享数据，类比 Express 的 `req.user = ...`：

```go
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 解析 token 后，把用户信息挂到 context 上
		c.Set("currentUser", "Alice") // 类似 req.user = { name: 'Alice' }
		c.Next()
	}
}

func getProfile(c *gin.Context) {
	// 在后续处理函数中取出
	user, _ := c.Get("currentUser") // 类似 req.user
	c.JSON(http.StatusOK, gin.H{"user": user})
}
```

## 文件上传

```go
r.POST("/upload", func(c *gin.Context) {
	// 获取上传的文件，字段名为 "file"
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件获取失败"})
		return
	}

	// 保存到服务器本地
	dst := "./uploads/" + file.Filename
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "文件保存失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "上传成功",
		"filename": file.Filename,
		"size":     file.Size,
	})
})
```

## 统一响应结构

在实际项目中，前端通常期望一个固定格式的 JSON 响应（类似 `{ code, message, data }`）。我们可以封装一个响应工具函数：

```go
// 统一响应结构体
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

// 成功响应
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    0,
		Message: "success",
		Data:    data,
	})
}

// 失败响应
func Fail(c *gin.Context, httpStatus int, message string) {
	c.JSON(httpStatus, Response{
		Code:    -1,
		Message: message,
		Data:    nil,
	})
}

// 使用示例
r.GET("/users/:id", func(c *gin.Context) {
	id := c.Param("id")
	if id == "0" {
		Fail(c, http.StatusNotFound, "用户不存在")
		return
	}
	Success(c, gin.H{"id": id, "name": "Alice"})
})
```

---

将路由、中间件、参数绑定这几块组合起来，你已经具备了搭建一个完整 RESTful API 服务的能力。下一讲我们接入 GORM，把数据真正持久化到数据库里。

## 生产补充 1：ShouldBind vs Bind 的差异

- `ShouldBindJSON`：返回错误，由你决定如何响应（推荐）。
- `BindJSON`：遇错会直接写入 `400` 响应并中止，灵活性较差。

企业项目一般统一使用 `ShouldBind...`，然后走你自己的统一响应封装。

## 生产补充 2：优雅停机（Graceful Shutdown）
直接 `r.Run()` 在收到终止信号时会硬退出，可能中断请求。建议使用 `http.Server` + 信号监听：

```go
package main

import (
	"context"
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	r := gin.Default()
	r.GET("/ping", func(c *gin.Context) { c.JSON(200, gin.H{"message": "pong"}) })

	srv := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	go func() {
		_ = srv.ListenAndServe()
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
}
```

## 生产补充 3：建议加入请求超时中间件
如果某些 handler 卡死，请求会一直占着连接。建议配置服务层超时（`context.WithTimeout`）并在网关层设置超时策略。
