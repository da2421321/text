# 04 - JWT 认证与中间件实战

> 本章目标：掌握 JWT 认证原理，实现完整的用户登录注册系统，学会编写 Gin 中间件。

## 前置知识

学习本章前，你需要掌握：
- 结构体与方法（基础篇第七章）
- 接口（基础篇第八章）
- Gin 框架基础（实战篇第一章）
- GORM 数据库操作（实战篇第二章）

## 1. 什么是 JWT？

### 传统 Session 认证的问题

想象你去游乐园：
- **Session 方式**：入园时给你一个手环（Session ID），每次玩项目都要刷手环，工作人员查系统确认你的身份
- **JWT 方式**：入园时给你一张通行证（JWT），上面写着你的信息和有效期，每次玩项目只需出示通行证，工作人员看一眼就知道你的身份

JWT（JSON Web Token）的优势：
- **无状态**：服务器不需要存储 Session，适合分布式系统
- **跨域友好**：可以在不同域名间传递
- **移动端友好**：不依赖 Cookie

### JWT 的结构

JWT 由三部分组成，用 `.` 分隔：

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3MDAwMDAwMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

- **Header（头部）**：算法和类型
- **Payload（载荷）**：用户信息和过期时间
- **Signature（签名）**：防止篡改

## 2. 安装 JWT 库

```bash
go get github.com/golang-jwt/jwt/v5
```

## 3. 生成和解析 JWT

```go
package main

import (
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"time"
)

// JWT 密钥（生产环境应该放在环境变量中）
var jwtSecret = []byte("your-secret-key-change-in-production")

// 自定义 Claims（载荷）
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// 生成 Token
func GenerateToken(userID uint, username string) (string, error) {
	// 设置过期时间（7 天）
	expirationTime := time.Now().Add(7 * 24 * time.Hour)

	// 创建 Claims
	claims := &Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "my-app",
		},
	}

	// 生成 Token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// 解析 Token
func ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("无效的 Token")
}

func main() {
	// 生成 Token
	token, _ := GenerateToken(1, "张三")
	fmt.Println("Token:", token)

	// 解析 Token
	claims, err := ParseToken(token)
	if err != nil {
		fmt.Println("解析失败:", err)
		return
	}

	fmt.Printf("用户 ID: %d, 用户名: %s\n", claims.UserID, claims.Username)
}
```

## 4. 用户模型与密码加密

```go
package main

import (
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	ID       uint   `json:"id" gorm:"primarykey"`
	Username string `json:"username" gorm:"uniqueIndex;size:50;not null"`
	Password string `json:"-" gorm:"size:100;not null"` // json:"-" 表示不返回给前端
	Email    string `json:"email" gorm:"size:100"`
	gorm.Model
}

// 密码加密（注册时使用）
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// 密码验证（登录时使用）
func CheckPassword(hashedPassword, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}
```

## 5. 注册接口

```go
package main

import (
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"net/http"
)

type User struct {
	ID       uint   `json:"id" gorm:"primarykey"`
	Username string `json:"username" gorm:"uniqueIndex;size:50;not null"`
	Password string `json:"-" gorm:"size:100;not null"`
	Email    string `json:"email" gorm:"size:100"`
}

var db *gorm.DB

func main() {
	// 初始化数据库
	db, _ = gorm.Open(sqlite.Open("users.db"), &gorm.Config{})
	db.AutoMigrate(&User{})

	r := gin.Default()

	// 注册接口
	r.POST("/register", func(c *gin.Context) {
		var input struct {
			Username string `json:"username" binding:"required,min=3,max=20"`
			Password string `json:"password" binding:"required,min=6"`
			Email    string `json:"email" binding:"required,email"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 检查用户名是否已存在
		var existingUser User
		if err := db.Where("username = ?", input.Username).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "用户名已存在"})
			return
		}

		// 密码加密
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)

		// 创建用户
		user := User{
			Username: input.Username,
			Password: string(hashedPassword),
			Email:    input.Email,
		}

		if err := db.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "注册失败"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "注册成功",
			"user":    user,
		})
	})

	r.Run(":8080")
}
```

测试：
```bash
curl -X POST http://localhost:8080/register \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangsan","password":"123456","email":"zhang@example.com"}'
```

## 6. 登录接口

```go
// 登录接口
r.POST("/login", func(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 查询用户
	var user User
	if err := db.Where("username = ?", input.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	// 生成 Token
	token, err := GenerateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成 Token 失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "登录成功",
		"token":   token,
		"user":    user,
	})
})
```

测试：
```bash
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangsan","password":"123456"}'

# 返回：
# {"message":"登录成功","token":"eyJhbGci...","user":{...}}
```

## 7. JWT 认证中间件

### 什么是中间件？

中间件就像机场安检：
- **没有中间件**：乘客直接登机（请求直接到达处理函数）
- **有中间件**：乘客先过安检，检查通过才能登机（请求先经过验证，通过后才执行处理函数）

中间件的执行流程：
```
请求 → 中间件1 → 中间件2 → 处理函数 → 中间件2 → 中间件1 → 响应
       ↓                      ↑
    c.Next()              return
```

### 编写 JWT 认证中间件

```go
package main

import (
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"net/http"
	"strings"
)

var jwtSecret = []byte("your-secret-key")

type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// JWT 认证中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// ========== 第1步：获取 Token ==========
		// 从 HTTP Header 中获取 Authorization 字段
		// 前端请求时会带上：Authorization: Bearer eyJhbGci...
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "缺少 Authorization Header"})
			c.Abort() // 🔴 终止请求，不再执行后续处理函数
			return
		}

		// ========== 第2步：解析 Token 格式 ==========
		// 标准格式：Bearer <token>
		// 用空格分割成两部分：["Bearer", "eyJhbGci..."]
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization 格式错误，应为 Bearer <token>"})
			c.Abort()
			return
		}

		tokenString := parts[1] // 提取真正的 Token 字符串

		// ========== 第3步：验证 Token ==========
		// ParseWithClaims 会做三件事：
		// 1. 验证签名是否正确（防止 Token 被篡改）
		// 2. 检查是否过期
		// 3. 解析出 Claims（用户信息）
		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			// 返回密钥，用于验证签名
			return jwtSecret, nil
		})

		if err != nil {
			// Token 解析失败（可能是格式错误、签名错误、过期等）
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token 无效或已过期"})
			c.Abort()
			return
		}

		if !token.Valid {
			// Token 验证失败
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token 验证失败"})
			c.Abort()
			return
		}

		// ========== 第4步：提取用户信息 ==========
		// 将 Token 中的 Claims 转换为我们自定义的 Claims 类型
		claims, ok := token.Claims.(*Claims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "无法解析 Token"})
			c.Abort()
			return
		}

		// ========== 第5步：存入上下文 ==========
		// 将用户信息存入 Gin 的上下文中
		// 后续的处理函数可以通过 c.Get("user_id") 获取
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)

		// ========== 第6步：继续执行 ==========
		c.Next() // 🟢 继续执行后续的处理函数
	}
}

func main() {
	r := gin.Default()

	// ========== 公开接口（不需要认证）==========
	r.POST("/login", loginHandler)
	r.POST("/register", registerHandler)

	// ========== 需要认证的接口 ==========
	// 创建路由组，所有 /api 开头的接口都需要认证
	auth := r.Group("/api")
	auth.Use(AuthMiddleware()) // 🔑 应用认证中间件
	{
		// 获取个人信息
		auth.GET("/profile", func(c *gin.Context) {
			// 从上下文中获取用户信息（中间件已经存入）
			userID := c.GetUint("user_id")
			username := c.GetString("username")

			c.JSON(http.StatusOK, gin.H{
				"user_id":  userID,
				"username": username,
				"message":  "这是受保护的接口",
			})
		})

		// 登出接口
		auth.POST("/logout", func(c *gin.Context) {
			// JWT 是无状态的，服务器不存储 Token
			// 登出操作通常在前端完成：删除本地存储的 Token
			// 如果需要服务端登出，可以使用 Token 黑名单（见练习3）
			c.JSON(http.StatusOK, gin.H{"message": "登出成功"})
		})

		// 修改个人信息
		auth.PUT("/profile", func(c *gin.Context) {
			userID := c.GetUint("user_id")
			// 更新用户信息的逻辑...
			c.JSON(http.StatusOK, gin.H{
				"message": "更新成功",
				"user_id": userID,
			})
		})
	}

	r.Run(":8080")
}
```

测试：
```bash
# 1. 登录获取 Token
TOKEN=$(curl -s -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangsan","password":"123456"}' \
  | jq -r '.token')

# 2. 访问受保护的接口
curl http://localhost:8080/api/profile \
  -H "Authorization: Bearer $TOKEN"

# 返回：
# {"message":"这是受保护的接口","user_id":1,"username":"zhangsan"}

# 3. 不带 Token 访问（失败）
curl http://localhost:8080/api/profile
# 返回：{"error":"缺少 Authorization Header"}
```

## 8. 完整示例：用户系统

```go
package main

import (
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"net/http"
	"strings"
	"time"
)

// 模型
type User struct {
	ID       uint   `json:"id" gorm:"primarykey"`
	Username string `json:"username" gorm:"uniqueIndex;size:50;not null"`
	Password string `json:"-" gorm:"size:100;not null"`
	Email    string `json:"email" gorm:"size:100"`
	gorm.Model
}

// JWT Claims
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

var (
	db        *gorm.DB
	jwtSecret = []byte("your-secret-key-change-in-production")
)

// 生成 Token
func GenerateToken(userID uint, username string) (string, error) {
	claims := &Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// 认证中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "缺少 Token"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token 格式错误"})
			c.Abort()
			return
		}

		token, err := jwt.ParseWithClaims(parts[1], &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的 Token"})
			c.Abort()
			return
		}

		claims := token.Claims.(*Claims)
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Next()
	}
}

func main() {
	// 初始化数据库
	db, _ = gorm.Open(sqlite.Open("auth.db"), &gorm.Config{})
	db.AutoMigrate(&User{})

	r := gin.Default()

	// 注册
	r.POST("/register", func(c *gin.Context) {
		var input struct {
			Username string `json:"username" binding:"required,min=3,max=20"`
			Password string `json:"password" binding:"required,min=6"`
			Email    string `json:"email" binding:"required,email"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 检查用户名
		var count int64
		db.Model(&User{}).Where("username = ?", input.Username).Count(&count)
		if count > 0 {
			c.JSON(http.StatusConflict, gin.H{"error": "用户名已存在"})
			return
		}

		// 加密密码
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)

		user := User{
			Username: input.Username,
			Password: string(hashedPassword),
			Email:    input.Email,
		}

		db.Create(&user)

		c.JSON(http.StatusCreated, gin.H{
			"message": "注册成功",
			"user":    user,
		})
	})

	// 登录
	r.POST("/login", func(c *gin.Context) {
		var input struct {
			Username string `json:"username" binding:"required"`
			Password string `json:"password" binding:"required"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var user User
		if err := db.Where("username = ?", input.Username).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
			return
		}

		token, _ := GenerateToken(user.ID, user.Username)

		c.JSON(http.StatusOK, gin.H{
			"message": "登录成功",
			"token":   token,
			"user":    user,
		})
	})

	// 受保护的路由
	api := r.Group("/api")
	api.Use(AuthMiddleware())
	{
		// 获取个人信息
		api.GET("/me", func(c *gin.Context) {
			userID := c.GetUint("user_id")
			var user User
			db.First(&user, userID)
			c.JSON(http.StatusOK, user)
		})

		// 修改密码
		api.PUT("/password", func(c *gin.Context) {
			userID := c.GetUint("user_id")
			var input struct {
				OldPassword string `json:"old_password" binding:"required"`
				NewPassword string `json:"new_password" binding:"required,min=6"`
			}

			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			var user User
			db.First(&user, userID)

			// 验证旧密码
			if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.OldPassword)); err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "旧密码错误"})
				return
			}

			// 更新密码
			hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
			db.Model(&user).Update("password", string(hashedPassword))

			c.JSON(http.StatusOK, gin.H{"message": "密码修改成功"})
		})
	}

	r.Run(":8080")
}
```

## 9. 刷新 Token 机制

JWT 过期后需要重新登录，体验不好。可以实现刷新 Token 机制：

```go
// 生成访问 Token（短期，15 分钟）和刷新 Token（长期，7 天）
func GenerateTokenPair(userID uint, username string) (accessToken, refreshToken string, err error) {
	// 访问 Token（15 分钟）
	accessClaims := &Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
		},
	}
	access := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessToken, err = access.SignedString(jwtSecret)
	if err != nil {
		return
	}

	// 刷新 Token（7 天）
	refreshClaims := &Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
		},
	}
	refresh := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshToken, err = refresh.SignedString(jwtSecret)
	return
}

// 刷新接口
r.POST("/refresh", func(c *gin.Context) {
	var input struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 解析刷新 Token
	token, err := jwt.ParseWithClaims(input.RefreshToken, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的刷新 Token"})
		return
	}

	claims := token.Claims.(*Claims)

	// 生成新的 Token 对
	accessToken, refreshToken, _ := GenerateTokenPair(claims.UserID, claims.Username)

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
})
```

## 10. 最佳实践

1. **密钥管理**：JWT 密钥应该放在环境变量中，不要硬编码
2. **HTTPS**：生产环境必须使用 HTTPS，防止 Token 被窃取
3. **Token 过期时间**：访问 Token 15-30 分钟，刷新 Token 7-30 天
4. **敏感操作二次验证**：修改密码、删除账号等操作需要再次输入密码
5. **Token 黑名单**：用 Redis 存储已登出的 Token，防止被滥用
6. **限流**：登录接口应该限制频率，防止暴力破解

## 练习题

### 练习 1：实现邮箱验证

**要求：**
- 注册时发送验证邮件
- 用户点击链接激活账号
- 未激活账号无法登录

**答案：**

```go
package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/gomail.v2"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"net/http"
	"time"
)

// 用户模型（添加激活相关字段）
type User struct {
	ID                uint      `json:"id" gorm:"primarykey"`
	Username          string    `json:"username" gorm:"uniqueIndex;size:50;not null"`
	Password          string    `json:"-" gorm:"size:100;not null"`
	Email             string    `json:"email" gorm:"uniqueIndex;size:100;not null"`
	IsActivated       bool      `json:"is_activated" gorm:"default:false"`
	ActivationToken   string    `json:"-" gorm:"size:64"`
	ActivationExpires time.Time `json:"-"`
	gorm.Model
}

var db *gorm.DB

// 生成随机 Token
func generateToken() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// 发送激活邮件
func sendActivationEmail(email, token string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", "noreply@example.com")
	m.SetHeader("To", email)
	m.SetHeader("Subject", "激活您的账号")
	
	activationLink := fmt.Sprintf("http://localhost:8080/activate?token=%s", token)
	body := fmt.Sprintf(`
		<h2>欢迎注册！</h2>
		<p>请点击下面的链接激活您的账号：</p>
		<a href="%s">激活账号</a>
		<p>链接将在 24 小时后过期。</p>
	`, activationLink)
	m.SetBody("text/html", body)

	d := gomail.NewDialer("smtp.gmail.com", 587, "your-email@gmail.com", "your-password")
	return d.DialAndSend(m)
}

func main() {
	db, _ = gorm.Open(sqlite.Open("email_verify.db"), &gorm.Config{})
	db.AutoMigrate(&User{})

	r := gin.Default()

	// 注册接口
	r.POST("/register", func(c *gin.Context) {
		var input struct {
			Username string `json:"username" binding:"required,min=3,max=20"`
			Password string `json:"password" binding:"required,min=6"`
			Email    string `json:"email" binding:"required,email"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		activationToken := generateToken()

		user := User{
			Username:          input.Username,
			Password:          string(hashedPassword),
			Email:             input.Email,
			IsActivated:       false,
			ActivationToken:   activationToken,
			ActivationExpires: time.Now().Add(24 * time.Hour),
		}

		db.Create(&user)

		// 异步发送邮件
		go sendActivationEmail(user.Email, activationToken)

		c.JSON(http.StatusCreated, gin.H{"message": "注册成功，请查收激活邮件"})
	})

	// 激活账号接口
	r.GET("/activate", func(c *gin.Context) {
		token := c.Query("token")
		var user User
		
		if err := db.Where("activation_token = ?", token).First(&user).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "无效的激活链接"})
			return
		}

		if user.IsActivated {
			c.JSON(http.StatusOK, gin.H{"message": "账号已激活"})
			return
		}

		if time.Now().After(user.ActivationExpires) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "激活链接已过期"})
			return
		}

		db.Model(&user).Updates(map[string]interface{}{
			"is_activated":    true,
			"activation_token": "",
		})

		c.JSON(http.StatusOK, gin.H{"message": "账号激活成功"})
	})

	// 登录接口（检查激活状态）
	r.POST("/login", func(c *gin.Context) {
		var input struct {
			Username string `json:"username" binding:"required"`
			Password string `json:"password" binding:"required"`
		}

		c.ShouldBindJSON(&input)

		var user User
		if err := db.Where("username = ?", input.Username).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
			return
		}

		if !user.IsActivated {
			c.JSON(http.StatusForbidden, gin.H{"error": "账号未激活，请先激活账号"})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "登录成功"})
	})

	r.Run(":8080")
}
```

---

### 练习 2：实现角色权限系统

**要求：**
- 用户有角色（admin、user）
- 不同角色有不同权限
- 编写权限检查中间件

**答案：**

```go
package main

import (
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"net/http"
	"strings"
	"time"
)

// 用户模型
type User struct {
	ID       uint     `json:"id" gorm:"primarykey"`
	Username string   `json:"username" gorm:"uniqueIndex;size:50;not null"`
	Password string   `json:"-" gorm:"size:100;not null"`
	Roles    []Role   `json:"roles" gorm:"many2many:user_roles;"`
	gorm.Model
}

// 角色模型
type Role struct {
	ID          uint         `json:"id" gorm:"primarykey"`
	Name        string       `json:"name" gorm:"uniqueIndex;size:50;not null"`
	Description string       `json:"description" gorm:"size:200"`
	Permissions []Permission `json:"permissions" gorm:"many2many:role_permissions;"`
	gorm.Model
}

// 权限模型
type Permission struct {
	ID          uint   `json:"id" gorm:"primarykey"`
	Name        string `json:"name" gorm:"uniqueIndex;size:50;not null"`
	Description string `json:"description" gorm:"size:200"`
	gorm.Model
}

var (
	db        *gorm.DB
	jwtSecret = []byte("your-secret-key")
)

type Claims struct {
	UserID   uint     `json:"user_id"`
	Username string   `json:"username"`
	Roles    []string `json:"roles"`
	jwt.RegisteredClaims
}

// 生成 Token（包含角色信息）
func GenerateToken(user User) (string, error) {
	roleNames := make([]string, len(user.Roles))
	for i, role := range user.Roles {
		roleNames[i] = role.Name
	}

	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Roles:    roleNames,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// 认证中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "缺少 Token"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token 格式错误"})
			c.Abort()
			return
		}

		token, err := jwt.ParseWithClaims(parts[1], &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的 Token"})
			c.Abort()
			return
		}

		claims := token.Claims.(*Claims)
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("roles", claims.Roles)
		c.Next()
	}
}

// 角色检查中间件
func RequireRole(requiredRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		rolesInterface, exists := c.Get("roles")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "无权限访问"})
			c.Abort()
			return
		}

		userRoles := rolesInterface.([]string)

		hasRole := false
		for _, userRole := range userRoles {
			for _, requiredRole := range requiredRoles {
				if userRole == requiredRole {
					hasRole = true
					break
				}
			}
			if hasRole {
				break
			}
		}

		if !hasRole {
			c.JSON(http.StatusForbidden, gin.H{
				"error":          "权限不足",
				"required_roles": requiredRoles,
				"your_roles":     userRoles,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

func main() {
	db, _ = gorm.Open(sqlite.Open("rbac.db"), &gorm.Config{})
	db.AutoMigrate(&User{}, &Role{}, &Permission{})

	// 初始化角色
	adminRole := Role{Name: "admin", Description: "管理员"}
	userRole := Role{Name: "user", Description: "普通用户"}
	db.FirstOrCreate(&adminRole, Role{Name: "admin"})
	db.FirstOrCreate(&userRole, Role{Name: "user"})

	r := gin.Default()

	// 注册（默认分配 user 角色）
	r.POST("/register", func(c *gin.Context) {
		var input struct {
			Username string `json:"username" binding:"required"`
			Password string `json:"password" binding:"required"`
		}

		c.ShouldBindJSON(&input)
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)

		var userRole Role
		db.Where("name = ?", "user").First(&userRole)

		user := User{
			Username: input.Username,
			Password: string(hashedPassword),
			Roles:    []Role{userRole},
		}

		db.Create(&user)
		c.JSON(http.StatusCreated, gin.H{"message": "注册成功"})
	})

	// 登录
	r.POST("/login", func(c *gin.Context) {
		var input struct {
			Username string `json:"username" binding:"required"`
			Password string `json:"password" binding:"required"`
		}

		c.ShouldBindJSON(&input)

		var user User
		db.Preload("Roles").Where("username = ?", input.Username).First(&user)

		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
			return
		}

		token, _ := GenerateToken(user)
		c.JSON(http.StatusOK, gin.H{"token": token})
	})

	// 受保护的路由
	api := r.Group("/api")
	api.Use(AuthMiddleware())
	{
		// 所有用户可访问
		api.GET("/profile", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "个人信息"})
		})

		// 只有 admin 可访问
		api.GET("/admin/users", RequireRole("admin"), func(c *gin.Context) {
			var users []User
			db.Preload("Roles").Find(&users)
			c.JSON(http.StatusOK, users)
		})
	}

	r.Run(":8080")
}
```

---

### 练习 3：实现 Token 黑名单

**要求：**
- 用户登出时将 Token 加入黑名单（Redis）
- 中间件检查 Token 是否在黑名单中
- 黑名单 Token 自动过期

**答案：**

```go
package main

import (
	"context"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"net/http"
	"strings"
	"time"
)

var (
	rdb       *redis.Client
	ctx       = context.Background()
	jwtSecret = []byte("your-secret-key")
)

type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// 将 Token 加入黑名单
func AddToBlacklist(token string, expiration time.Duration) error {
	key := fmt.Sprintf("blacklist:%s", token)
	return rdb.Set(ctx, key, "1", expiration).Err()
}

// 检查 Token 是否在黑名单中
func IsBlacklisted(token string) bool {
	key := fmt.Sprintf("blacklist:%s", token)
	val, err := rdb.Get(ctx, key).Result()
	return err == nil && val == "1"
}

// 认证中间件（带黑名单检查）
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "缺少 Token"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token 格式错误"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// 检查黑名单
		if IsBlacklisted(tokenString) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token 已失效，请重新登录"})
			c.Abort()
			return
		}

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的 Token"})
			c.Abort()
			return
		}

		claims := token.Claims.(*Claims)
		c.Set("user_id", claims.UserID)
		c.Set("token", tokenString)
		c.Next()
	}
}

func main() {
	// 初始化 Redis
	rdb = redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
		DB:   0,
	})

	r := gin.Default()

	// 登录接口（省略具体实现）
	r.POST("/login", func(c *gin.Context) {
		// 生成 Token
		claims := &Claims{
			UserID:   1,
			Username: "test",
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			},
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenString, _ := token.SignedString(jwtSecret)
		
		c.JSON(http.StatusOK, gin.H{"token": tokenString})
	})

	api := r.Group("/api")
	api.Use(AuthMiddleware())
	{
		// 登出接口
		api.POST("/logout", func(c *gin.Context) {
			tokenString := c.GetString("token")

			// 解析 Token 获取过期时间
			token, _ := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
				return jwtSecret, nil
			})

			claims := token.Claims.(*Claims)
			expiresAt := claims.ExpiresAt.Time
			remainingTime := time.Until(expiresAt)

			// 加入黑名单
			AddToBlacklist(tokenString, remainingTime)

			c.JSON(http.StatusOK, gin.H{"message": "登出成功"})
		})

		api.GET("/profile", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "个人信息"})
		})
	}

	r.Run(":8080")
}
```

---

### 练习 4：实现第三方登录

**要求：**
- 支持 GitHub OAuth 登录
- 登录后创建或绑定本地账号
- 返回 JWT Token

**答案：**

```go
package main

import (
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"io"
	"net/http"
	"net/url"
)

var (
	db                 *gorm.DB
	githubClientID     = "your-github-client-id"
	githubClientSecret = "your-github-client-secret"
	githubRedirectURL  = "http://localhost:8080/auth/github/callback"
)

type User struct {
	ID          uint   `json:"id" gorm:"primarykey"`
	Username    string `json:"username" gorm:"uniqueIndex;size:50"`
	GitHubID    string `json:"github_id" gorm:"uniqueIndex;size:50"`
	GitHubLogin string `json:"github_login" gorm:"size:50"`
	Avatar      string `json:"avatar" gorm:"size:200"`
	gorm.Model
}

type GitHubUser struct {
	ID        int    `json:"id"`
	Login     string `json:"login"`
	AvatarURL string `json:"avatar_url"`
}

// 获取 GitHub Access Token
func getGitHubAccessToken(code string) (string, error) {
	params := url.Values{}
	params.Add("client_id", githubClientID)
	params.Add("client_secret", githubClientSecret)
	params.Add("code", code)

	resp, err := http.PostForm("https://github.com/login/oauth/access_token", params)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	values, _ := url.ParseQuery(string(body))
	return values.Get("access_token"), nil
}

// 获取 GitHub 用户信息
func getGitHubUser(accessToken string) (*GitHubUser, error) {
	req, _ := http.NewRequest("GET", "https://api.github.com/user", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var githubUser GitHubUser
	json.NewDecoder(resp.Body).Decode(&githubUser)
	return &githubUser, nil
}

func main() {
	db, _ = gorm.Open(sqlite.Open("oauth.db"), &gorm.Config{})
	db.AutoMigrate(&User{})

	r := gin.Default()

	// 跳转到 GitHub 授权页面
	r.GET("/auth/github", func(c *gin.Context) {
		authURL := fmt.Sprintf(
			"https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s",
			githubClientID,
			url.QueryEscape(githubRedirectURL),
		)
		c.Redirect(http.StatusTemporaryRedirect, authURL)
	})

	// GitHub 回调接口
	r.GET("/auth/github/callback", func(c *gin.Context) {
		code := c.Query("code")

		// 获取 Access Token
		accessToken, err := getGitHubAccessToken(code)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取 Token 失败"})
			return
		}

		// 获取用户信息
		githubUser, err := getGitHubUser(accessToken)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户信息失败"})
			return
		}

		// 查找或创建本地用户
		var user User
		githubID := fmt.Sprintf("%d", githubUser.ID)
		
		result := db.Where("git_hub_id = ?", githubID).First(&user)
		
		if result.Error == gorm.ErrRecordNotFound {
			// 创建新用户
			user = User{
				Username:    githubUser.Login,
				GitHubID:    githubID,
				GitHubLogin: githubUser.Login,
				Avatar:      githubUser.AvatarURL,
			}
			db.Create(&user)
		}

		// 生成 JWT Token（使用前面章节的代码）
		token := "jwt-token-here"

		c.JSON(http.StatusOK, gin.H{
			"message": "登录成功",
			"token":   token,
			"user":    user,
		})
	})

	r.Run(":8080")
}
```

**配置步骤：**
1. 访问 https://github.com/settings/developers
2. 点击 "New OAuth App"
3. 填写 Homepage URL: `http://localhost:8080`
4. 填写 Authorization callback URL: `http://localhost:8080/auth/github/callback`
5. 获取 Client ID 和 Client Secret

## 下一步

学完本章后，你已经掌握了完整的用户认证系统。接下来可以学习：
- WebSocket 实时通信（实战篇第五章）
- 微服务架构中的认证（网关统一认证）
- OAuth 2.0 和 OpenID Connect
