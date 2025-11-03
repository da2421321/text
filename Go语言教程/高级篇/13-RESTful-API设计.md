# RESTful API设计

## RESTful API基础概念

REST（Representational State Transfer）是一种软件架构风格，用于设计网络应用程序的API。

### REST原则

1. **无状态性**：每个请求都包含处理该请求所需的所有信息
2. **统一接口**：使用标准的HTTP方法（GET、POST、PUT、DELETE等）
3. **资源导向**：将一切视为资源，通过URI进行标识
4. **可缓存性**：响应可以被缓存以提高性能
5. **分层系统**：客户端无需知道是否直接连接到终端服务器

### HTTP方法对应操作

| 方法 | 操作 | 幂等性 | 安全性 |
|------|------|--------|--------|
| GET | 获取资源 | 是 | 是 |
| POST | 创建资源 | 否 | 否 |
| PUT | 更新资源（全量） | 是 | 否 |
| PATCH | 更新资源（部分） | 否 | 否 |
| DELETE | 删除资源 | 是 | 否 |

## API设计最佳实践

### URI设计

```go
// 好的URI设计
GET /api/v1/users
GET /api/v1/users/123
GET /api/v1/users/123/orders
POST /api/v1/users
PUT /api/v1/users/123
DELETE /api/v1/users/123

// 不好的URI设计
GET /api/getUsers
GET /api/user?id=123
POST /api/createUser
```

### 状态码使用

```go
// 常用HTTP状态码
200 OK                    // 请求成功
201 Created              // 资源创建成功
204 No Content           // 请求成功但无返回内容
400 Bad Request          // 客户端请求错误
401 Unauthorized         // 未认证
403 Forbidden            // 禁止访问
404 Not Found            // 资源不存在
409 Conflict             // 资源冲突
500 Internal Server Error // 服务器内部错误
```

## 完整的RESTful API示例

```go
// restful_api_example.go
package main

import (
    "net/http"
    "strconv"
    "sync"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
)

// 数据模型
type User struct {
    ID        int       `json:"id" example:"1"`
    Name      string    `json:"name" binding:"required" example:"张三"`
    Email     string    `json:"email" binding:"required,email" example:"zhangsan@example.com"`
    Age       int       `json:"age" binding:"gte=0,lte=150" example:"25"`
    CreatedAt time.Time `json:"created_at" example:"2023-01-01T00:00:00Z"`
    UpdatedAt time.Time `json:"updated_at" example:"2023-01-01T00:00:00Z"`
}

type CreateUserRequest struct {
    Name  string `json:"name" binding:"required" example:"张三"`
    Email string `json:"email" binding:"required,email" example:"zhangsan@example.com"`
    Age   int    `json:"age" binding:"gte=0,lte=150" example:"25"`
}

type UpdateUserRequest struct {
    Name  *string `json:"name,omitempty" example:"李四"`
    Email *string `json:"email,omitempty" binding:"omitempty,email" example:"lisi@example.com"`
    Age   *int    `json:"age,omitempty" binding:"omitempty,gte=0,lte=150" example:"30"`
}

type APIResponse struct {
    Success bool        `json:"success"`
    Message string      `json:"message,omitempty"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
}

// 模拟数据库
type UserDB struct {
    users  map[int]User
    nextID int
    mu     sync.RWMutex
}

func NewUserDB() *UserDB {
    return &UserDB{
        users:  make(map[int]User),
        nextID: 1,
    }
}

var db = NewUserDB()

// 初始化测试数据
func init() {
    // ⚠️ 注意：创建用户时不需要手动设置以下字段：
    //   - ID: CreateUser 方法会自动分配
    //   - CreatedAt/UpdatedAt: CreateUser 方法会自动设置当前时间
    db.CreateUser(User{
        Name:  "张三",
        Email: "zhangsan@example.com",
        Age:   25,
    })
    
    db.CreateUser(User{
        Name:  "李四",
        Email: "lisi@example.com",
        Age:   30,
    })
}

func (db *UserDB) CreateUser(user User) User {
    db.mu.Lock()
    defer db.mu.Unlock()
    
    // 自动分配 ID
    user.ID = db.nextID
    db.nextID++
    
    // 自动设置时间戳
    now := time.Now()
    user.CreatedAt = now
    user.UpdatedAt = now
    
    db.users[user.ID] = user
    
    return user
}

func (db *UserDB) GetUser(id int) (User, bool) {
    db.mu.RLock()
    defer db.mu.RUnlock()
    
    user, exists := db.users[id]
    return user, exists
}

func (db *UserDB) ListUsers() []User {
    db.mu.RLock()
    defer db.mu.RUnlock()
    
    users := make([]User, 0, len(db.users))
    for _, user := range db.users {
        users = append(users, user)
    }
    
    return users
}

func (db *UserDB) UpdateUser(id int, updates UpdateUserRequest) (User, bool) {
    db.mu.Lock()
    defer db.mu.Unlock()
    
    user, exists := db.users[id]
    if !exists {
        return User{}, false
    }
    
    if updates.Name != nil {
        user.Name = *updates.Name
    }
    if updates.Email != nil {
        user.Email = *updates.Email
    }
    if updates.Age != nil {
        user.Age = *updates.Age
    }
    
    user.UpdatedAt = time.Now()
    db.users[id] = user
    
    return user, true
}

func (db *UserDB) DeleteUser(id int) bool {
    db.mu.Lock()
    defer db.mu.Unlock()
    
    if _, exists := db.users[id]; !exists {
        return false
    }
    
    delete(db.users, id)
    return true
}

// API处理函数
func getUsers(c *gin.Context) {
    users := db.ListUsers()
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    users,
    })
}

func getUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "无效的用户ID",
        })
        return
    }
    
    user, exists := db.GetUser(id)
    if !exists {
        c.JSON(http.StatusNotFound, APIResponse{
            Success: false,
            Error:   "用户不存在",
        })
        return
    }
    
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    user,
    })
}

func createUser(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        handleValidationError(c, err)
        return
    }
    
    user := User{
        Name:      req.Name,
        Email:     req.Email,
        Age:       req.Age,
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }
    
    createdUser := db.CreateUser(user)
    
    c.JSON(http.StatusCreated, APIResponse{
        Success: true,
        Message: "用户创建成功",
        Data:    createdUser,
    })
}

func updateUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "无效的用户ID",
        })
        return
    }
    
    var req UpdateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        handleValidationError(c, err)
        return
    }
    
    updatedUser, exists := db.UpdateUser(id, req)
    if !exists {
        c.JSON(http.StatusNotFound, APIResponse{
            Success: false,
            Error:   "用户不存在",
        })
        return
    }
    
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Message: "用户更新成功",
        Data:    updatedUser,
    })
}

func deleteUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "无效的用户ID",
        })
        return
    }
    
    if !db.DeleteUser(id) {
        c.JSON(http.StatusNotFound, APIResponse{
            Success: false,
            Error:   "用户不存在",
        })
        return
    }
    
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Message: "用户删除成功",
    })
}

func handleValidationError(c *gin.Context, err error) {
    if validationErrors, ok := err.(validator.ValidationErrors); ok {
        var errors []string
        for _, fieldError := range validationErrors {
            errors = append(errors, fieldError.Field()+" "+fieldError.Tag())
        }
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "验证失败",
            Data:    errors,
        })
        return
    }
    
    c.JSON(http.StatusBadRequest, APIResponse{
        Success: false,
        Error:   err.Error(),
    })
}

func main() {
    r := gin.Default()
    
    // API路由组
    v1 := r.Group("/api/v1")
    {
        users := v1.Group("/users")
        {
            users.GET("", getUsers)
            users.POST("", createUser)
            users.GET("/:id", getUser)
            users.PUT("/:id", updateUser)
            users.DELETE("/:id", deleteUser)
        }
    }
    
    r.Run(":8080")
}
```

## API文档生成

使用Swagger生成API文档：

```bash
go get -u github.com/swaggo/swag/cmd/swag
go get -u github.com/swaggo/gin-swagger
go get -u github.com/swaggo/files
```

```go
// docs.go
package main

//	@title			User Management API
//	@version		1.0
//	@description	这是一个用户管理API的示例
//	@termsOfService	http://swagger.io/terms/

//	@contact.name	API Support
//	@contact.url	http://www.swagger.io/support
//	@contact.email	support@swagger.io

//	@license.name	Apache 2.0
//	@license.url	http://www.apache.org/licenses/LICENSE-2.0.html

//	@host		localhost:8080
//	@BasePath	/api/v1

func main() {
    r := gin.Default()
    
    // Swagger文档路由
    r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
    
    // API路由组
    v1 := r.Group("/api/v1")
    {
        users := v1.Group("/users")
        {
            //	@Summary		获取用户列表
            //	@Description	获取所有用户
            //	@Tags			用户
            //	@Accept			json
            //	@Produce		json
            //	@Success		200	{object}	APIResponse
            //	@Router			/users [get]
            users.GET("", getUsers)
            
            //	@Summary		创建用户
            //	@Description	创建一个新的用户
            //	@Tags			用户
            //	@Accept			json
            //	@Produce		json
            //	@Param			user	body		CreateUserRequest	true	"用户信息"
            //	@Success		201	{object}	APIResponse
            //	@Failure		400	{object}	APIResponse
            //	@Router			/users [post]
            users.POST("", createUser)
            
            //	@Summary		获取用户详情
            //	@Description	根据ID获取用户详情
            //	@Tags			用户
            //	@Accept			json
            //	@Produce		json
            //	@Param			id	path		int	true	"用户ID"
            //	@Success		200	{object}	APIResponse
            //	@Failure		400	{object}	APIResponse
            //	@Failure		404	{object}	APIResponse
            //	@Router			/users/{id} [get]
            users.GET("/:id", getUser)
            
            //	@Summary		更新用户
            //	@Description	根据ID更新用户信息
            //	@Tags			用户
            //	@Accept			json
            //	@Produce		json
            //	@Param			id		path	int					true	"用户ID"
            //	@Param			user	body	UpdateUserRequest	true	"更新的用户信息"
            //	@Success		200	{object}	APIResponse
            //	@Failure		400	{object}	APIResponse
            //	@Failure		404	{object}	APIResponse
            //	@Router			/users/{id} [put]
            users.PUT("/:id", updateUser)
            
            //	@Summary		删除用户
            //	@Description	根据ID删除用户
            //	@Tags			用户
            //	@Accept			json
            //	@Produce		json
            //	@Param			id	path		int	true	"用户ID"
            //	@Success		200	{object}	APIResponse
            //	@Failure		400	{object}	APIResponse
            //	@Failure		404	{object}	APIResponse
            //	@Router			/users/{id} [delete]
            users.DELETE("/:id", deleteUser)
        }
    }
    
    r.Run(":8080")
}
```

## 错误处理和日志

```go
// error_handling.go
package main

import (
    "fmt"
    "net/http"
    "runtime"
    "github.com/gin-gonic/gin"
    "github.com/pkg/errors"
)

// 自定义错误类型
type APIError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
    Details string `json:"details,omitempty"`
}
//提示错误
func (e APIError) Error() string {
    return fmt.Sprintf("API Error %d: %s", e.Code, e.Message)
}

// 错误代码定义
var (
    ErrInvalidInput = APIError{
        Code:    400,
        Message: "无效的输入",
    }
    
    ErrUnauthorized = APIError{
        Code:    401,
        Message: "未授权",
    }
    
    ErrForbidden = APIError{
        Code:    403,
        Message: "禁止访问",
    }
    
    ErrNotFound = APIError{
        Code:    404,
        Message: "资源不存在",
    }
    
    ErrInternal = APIError{
        Code:    500,
        Message: "内部服务器错误",
    }
)

// 错误处理中间件
func ErrorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()
        
        // 检查是否有错误
        if len(c.Errors) > 0 {
            err := c.Errors.Last()
            
            // 如果是自定义API错误
            if apiErr, ok := errors.Cause(err.Err).(APIError); ok {
                c.JSON(apiErr.Code, APIResponse{
                    Success: false,
                    Error:   apiErr.Message,
                    Data:    apiErr.Details,
                })
                return
            }
            
            // 未知错误
            c.JSON(http.StatusInternalServerError, APIResponse{
                Success: false,
                Error:   "内部服务器错误",
            })
        }
    }
}

// 日志中间件
func LoggingMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 请求前
        fmt.Printf("[%s] %s %s\n", c.Request.Method, c.Request.URL.Path, c.ClientIP())
        
        c.Next()
        
        // 请求后
        fmt.Printf("[%s] %s %s - %d\n", c.Request.Method, c.Request.URL.Path, c.ClientIP(), c.Writer.Status())
    }
}

// 恐慌恢复中间件
func RecoveryMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        defer func() {
            if err := recover(); err != nil {
                // 获取调用栈
                stack := make([]byte, 1024*8)
                stack = stack[:runtime.Stack(stack, false)]
                
                fmt.Printf("PANIC: %v\n%s\n", err, stack)
                
                c.JSON(http.StatusInternalServerError, APIResponse{
                    Success: false,
                    Error:   "内部服务器错误",
                })
                
                c.Abort()
            }
        }()
        
        c.Next()
    }
}

func main() {
    r := gin.New()
    
    // 使用中间件
    r.Use(LoggingMiddleware())
    r.Use(RecoveryMiddleware())
    r.Use(ErrorHandler())
    
    // API路由
    r.GET("/api/v1/users/:id", getUserWithErrors)
    r.POST("/api/v1/users", createUserWithErrors)
    
    r.Run(":8080")
}

func getUserWithErrors(c *gin.Context) {
    id := c.Param("id")
    if id == "0" {
        panic("测试恐慌恢复")
    }
    
    if id == "-1" {
        c.Error(errors.WithStack(ErrNotFound))
        return
    }
    
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    map[string]string{"id": id, "name": "测试用户"},
    })
}

func createUserWithErrors(c *gin.Context) {
    var req map[string]interface{}
    if err := c.ShouldBindJSON(&req); err != nil {
        c.Error(errors.WithStack(ErrInvalidInput))
        return
    }
    
    c.JSON(http.StatusCreated, APIResponse{
        Success: true,
        Data:    map[string]string{"id": "123", "name": req["name"].(string)},
    })
}
```

## 分页和过滤

```go
// pagination_filtering.go
package main

import (
    "math"
    "net/http"
    "strconv"
    "strings"
    
    "github.com/gin-gonic/gin"
)

// 分页参数
type Pagination struct {
    Page     int `json:"page" form:"page"`
    PageSize int `json:"page_size" form:"page_size"`
}

// 分页结果
type PaginationResult struct {
    Page       int `json:"page"`
    PageSize   int `json:"page_size"`
    Total      int `json:"total"`
    TotalPages int `json:"total_pages"`
}

// 过滤参数
type Filter struct {
    Name  string `json:"name" form:"name"`
    Email string `json:"email" form:"email"`
    Age   *int   `json:"age" form:"age"`
}

// 分页响应
type PaginatedResponse struct {
    Data       interface{}      `json:"data"`
    Pagination PaginationResult `json:"pagination"`
}

func getUsersWithPagination(c *gin.Context) {
    // 解析分页参数
    var pagination Pagination
    if err := c.ShouldBindQuery(&pagination); err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "无效的分页参数",
        })
        return
    }
    
    // 设置默认值
    if pagination.Page <= 0 {
        pagination.Page = 1
    }
    if pagination.PageSize <= 0 {
        pagination.PageSize = 10
    }
    if pagination.PageSize > 100 {
        pagination.PageSize = 100 // 限制最大页面大小
    }
    
    // 解析过滤参数
    var filter Filter
    c.ShouldBindQuery(&filter)
    
    // 获取所有用户（实际应该从数据库查询）
    allUsers := db.ListUsers()
    
    // 应用过滤
    filteredUsers := applyFilter(allUsers, filter)
    
    // 计算分页
    total := len(filteredUsers)
    totalPages := int(math.Ceil(float64(total) / float64(pagination.PageSize)))
    
    // 计算偏移量
    offset := (pagination.Page - 1) * pagination.PageSize
    if offset > total {
        offset = total
    }
    
    // 计算结束位置
    end := offset + pagination.PageSize
    if end > total {
        end = total
    }
    
    // 获取当前页数据
    var pageUsers []User
    if offset < total {
        pageUsers = filteredUsers[offset:end]
    }
    
    // 构造响应
    response := PaginatedResponse{
        Data: pageUsers,
        Pagination: PaginationResult{
            Page:       pagination.Page,
            PageSize:   pagination.PageSize,
            Total:      total,
            TotalPages: totalPages,
        },
    }
    
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    response,
    })
}

func applyFilter(users []User, filter Filter) []User {
    var filtered []User
    
    for _, user := range users {
        match := true
        
        // 名称过滤
        if filter.Name != "" && !strings.Contains(strings.ToLower(user.Name), strings.ToLower(filter.Name)) {
            match = false
        }
        
        // 邮箱过滤
        if filter.Email != "" && !strings.Contains(strings.ToLower(user.Email), strings.ToLower(filter.Email)) {
            match = false
        }
        
        // 年龄过滤
        if filter.Age != nil && user.Age != *filter.Age {
            match = false
        }
        
        if match {
            filtered = append(filtered, user)
        }
    }
    
    return filtered
}

func main() {
    r := gin.Default()
    
    // 添加测试数据
    for i := 1; i <= 50; i++ {
        db.CreateUser(User{
            Name:      fmt.Sprintf("用户%d", i),
            Email:     fmt.Sprintf("user%d@example.com", i),
            Age:       20 + (i % 50),
            CreatedAt: time.Now(),
            UpdatedAt: time.Now(),
        })
    }
    
    r.GET("/api/v1/users", getUsersWithPagination)
    
    r.Run(":8080")
}
```

## 代码示例

```go
// complete_restful_api.go
package main

import (
    "fmt"
    "net/http"
    "strconv"
    "strings"
    "sync"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
    "github.com/pkg/errors"
)

// 数据模型
type BaseModel struct {
    ID        int       `json:"id"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type User struct {
    BaseModel
    Name     string `json:"name" binding:"required,min=2,max=50"`
    Email    string `json:"email" binding:"required,email"`
    Age      int    `json:"age" binding:"gte=0,lte=150"`
    IsActive bool   `json:"is_active" gorm:"default:true"`
}

type Product struct {
    BaseModel
    Name        string  `json:"name" binding:"required,min=1,max=100"`
    Price       float64 `json:"price" binding:"required,gt=0"`
    Description string  `json:"description" binding:"max=500"`
    Category    string  `json:"category" binding:"required"`
    Stock       int     `json:"stock" binding:"gte=0"`
}

type Order struct {
    BaseModel
    UserID    int     `json:"user_id" binding:"required"`
    ProductID int     `json:"product_id" binding:"required"`
    Quantity  int     `json:"quantity" binding:"required,gt=0"`
    Total     float64 `json:"total" binding:"required,gt=0"`
    Status    string  `json:"status" binding:"required,oneof=pending confirmed shipped delivered cancelled"`
}

// 请求和响应结构体
type CreateUserRequest struct {
    Name  string `json:"name" binding:"required,min=2,max=50"`
    Email string `json:"email" binding:"required,email"`
    Age   int    `json:"age" binding:"gte=0,lte=150"`
}

type UpdateUserRequest struct {
    Name     *string `json:"name,omitempty" binding:"omitempty,min=2,max=50"`
    Email    *string `json:"email,omitempty" binding:"omitempty,email"`
    Age      *int    `json:"age,omitempty" binding:"omitempty,gte=0,lte=150"`
    IsActive *bool   `json:"is_active,omitempty"`
}

type CreateProductRequest struct {
    Name        string  `json:"name" binding:"required,min=1,max=100"`
    Price       float64 `json:"price" binding:"required,gt=0"`
    Description string  `json:"description" binding:"max=500"`
    Category    string  `json:"category" binding:"required"`
    Stock       int     `json:"stock" binding:"gte=0"`
}

type CreateOrderRequest struct {
    UserID    int `json:"user_id" binding:"required"`
    ProductID int `json:"product_id" binding:"required"`
    Quantity  int `json:"quantity" binding:"required,gt=0"`
}

type APIResponse struct {
    Success bool        `json:"success"`
    Message string      `json:"message,omitempty"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
}

// 模拟数据库
type Database struct {
    users    map[int]User
    products map[int]Product
    orders   map[int]Order
    nextID   int
    mu       sync.RWMutex
}

func NewDatabase() *Database {
    return &Database{
        users:    make(map[int]User),
        products: make(map[int]Product),
        orders:   make(map[int]Order),
        nextID:   1,
    }
}

var db = NewDatabase()

// 初始化测试数据
func init() {
    // 创建测试用户
    db.CreateUser(User{
        BaseModel: BaseModel{ID: 1, CreatedAt: time.Now(), UpdatedAt: time.Now()},
        Name:      "张三",
        Email:     "zhangsan@example.com",
        Age:       25,
        IsActive:  true,
    })
    
    db.CreateUser(User{
        BaseModel: BaseModel{ID: 2, CreatedAt: time.Now(), UpdatedAt: time.Now()},
        Name:      "李四",
        Email:     "lisi@example.com",
        Age:       30,
        IsActive:  true,
    })
    
    // 创建测试产品
    db.CreateProduct(Product{
        BaseModel:   BaseModel{ID: 1, CreatedAt: time.Now(), UpdatedAt: time.Now()},
        Name:        "笔记本电脑",
        Price:       5999.99,
        Description: "高性能笔记本电脑",
        Category:    "电子产品",
        Stock:       10,
    })
    
    db.CreateProduct(Product{
        BaseModel:   BaseModel{ID: 2, CreatedAt: time.Now(), UpdatedAt: time.Now()},
        Name:        "无线鼠标",
        Price:       99.99,
        Description: "人体工学无线鼠标",
        Category:    "电脑配件",
        Stock:       50,
    })
}

// 数据库操作方法
func (db *Database) CreateUser(user User) User {
    db.mu.Lock()
    defer db.mu.Unlock()
    
    user.ID = db.nextID
    db.nextID++
    db.users[user.ID] = user
    
    return user
}

func (db *Database) GetUser(id int) (User, bool) {
    db.mu.RLock()
    defer db.mu.RUnlock()
    
    user, exists := db.users[id]
    return user, exists
}

func (db *Database) ListUsers() []User {
    db.mu.RLock()
    defer db.mu.RUnlock()
    
    users := make([]User, 0, len(db.users))
    for _, user := range db.users {
        users = append(users, user)
    }
    
    return users
}

func (db *Database) UpdateUser(id int, updates UpdateUserRequest) (User, bool) {
    db.mu.Lock()
    defer db.mu.Unlock()
    
    user, exists := db.users[id]
    if !exists {
        return User{}, false
    }
    
    if updates.Name != nil {
        user.Name = *updates.Name
    }
    if updates.Email != nil {
        user.Email = *updates.Email
    }
    if updates.Age != nil {
        user.Age = *updates.Age
    }
    if updates.IsActive != nil {
        user.IsActive = *updates.IsActive
    }
    
    user.UpdatedAt = time.Now()
    db.users[id] = user
    
    return user, true
}

func (db *Database) DeleteUser(id int) bool {
    db.mu.Lock()
    defer db.mu.Unlock()
    
    if _, exists := db.users[id]; !exists {
        return false
    }
    
    delete(db.users, id)
    return true
}

func (db *Database) CreateProduct(product Product) Product {
    db.mu.Lock()
    defer db.mu.Unlock()
    
    product.ID = db.nextID
    db.nextID++
    db.products[product.ID] = product
    
    return product
}

func (db *Database) GetProduct(id int) (Product, bool) {
    db.mu.RLock()
    defer db.mu.RUnlock()
    
    product, exists := db.products[id]
    return product, exists
}

func (db *Database) ListProducts() []Product {
    db.mu.RLock()
    defer db.mu.RUnlock()
    
    products := make([]Product, 0, len(db.products))
    for _, product := range db.products {
        products = append(products, product)
    }
    
    return products
}

func (db *Database) CreateOrder(order Order) Order {
    db.mu.Lock()
    defer db.mu.Unlock()
    
    order.ID = db.nextID
    db.nextID++
    db.orders[order.ID] = order
    
    return order
}

func (db *Database) GetOrder(id int) (Order, bool) {
    db.mu.RLock()
    defer db.mu.RUnlock()
    
    order, exists := db.orders[id]
    return order, exists
}

func (db *Database) ListOrders() []Order {
    db.mu.RLock()
    defer db.mu.RUnlock()
    
    orders := make([]Order, 0, len(db.orders))
    for _, order := range db.orders {
        orders = append(orders, order)
    }
    
    return orders
}

// API处理函数
func getUsers(c *gin.Context) {
    users := db.ListUsers()
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    users,
    })
}

func getUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "无效的用户ID",
        })
        return
    }
    
    user, exists := db.GetUser(id)
    if !exists {
        c.JSON(http.StatusNotFound, APIResponse{
            Success: false,
            Error:   "用户不存在",
        })
        return
    }
    
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    user,
    })
}

func createUser(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        handleValidationError(c, err)
        return
    }
    
    // 检查邮箱是否已存在
    users := db.ListUsers()
    for _, user := range users {
        if user.Email == req.Email {
            c.JSON(http.StatusConflict, APIResponse{
                Success: false,
                Error:   "邮箱已被使用",
            })
            return
        }
    }
    
    user := User{
        BaseModel: BaseModel{
            CreatedAt: time.Now(),
            UpdatedAt: time.Now(),
        },
        Name:     req.Name,
        Email:    req.Email,
        Age:      req.Age,
        IsActive: true,
    }
    
    createdUser := db.CreateUser(user)
    
    c.JSON(http.StatusCreated, APIResponse{
        Success: true,
        Message: "用户创建成功",
        Data:    createdUser,
    })
}

func updateUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "无效的用户ID",
        })
        return
    }
    
    var req UpdateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        handleValidationError(c, err)
        return
    }
    
    // 如果更新邮箱，检查是否已存在
    if req.Email != nil {
        users := db.ListUsers()
        for _, user := range users {
            if user.ID != id && user.Email == *req.Email {
                c.JSON(http.StatusConflict, APIResponse{
                    Success: false,
                    Error:   "邮箱已被使用",
                })
                return
            }
        }
    }
    
    updatedUser, exists := db.UpdateUser(id, req)
    if !exists {
        c.JSON(http.StatusNotFound, APIResponse{
            Success: false,
            Error:   "用户不存在",
        })
        return
    }
    
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Message: "用户更新成功",
        Data:    updatedUser,
    })
}

func deleteUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "无效的用户ID",
        })
        return
    }
    
    if !db.DeleteUser(id) {
        c.JSON(http.StatusNotFound, APIResponse{
            Success: false,
            Error:   "用户不存在",
        })
        return
    }
    
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Message: "用户删除成功",
    })
}

func getProducts(c *gin.Context) {
    products := db.ListProducts()
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    products,
    })
}

func getProduct(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "无效的产品ID",
        })
        return
    }
    
    product, exists := db.GetProduct(id)
    if !exists {
        c.JSON(http.StatusNotFound, APIResponse{
            Success: false,
            Error:   "产品不存在",
        })
        return
    }
    
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    product,
    })
}

func createProduct(c *gin.Context) {
    var req CreateProductRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        handleValidationError(c, err)
        return
    }
    
    product := Product{
        BaseModel: BaseModel{
            CreatedAt: time.Now(),
            UpdatedAt: time.Now(),
        },
        Name:        req.Name,
        Price:       req.Price,
        Description: req.Description,
        Category:    req.Category,
        Stock:       req.Stock,
    }
    
    createdProduct := db.CreateProduct(product)
    
    c.JSON(http.StatusCreated, APIResponse{
        Success: true,
        Message: "产品创建成功",
        Data:    createdProduct,
    })
}

func createOrder(c *gin.Context) {
    var req CreateOrderRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        handleValidationError(c, err)
        return
    }
    
    // 检查用户是否存在
    _, userExists := db.GetUser(req.UserID)
    if !userExists {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "用户不存在",
        })
        return
    }
    
    // 检查产品是否存在
    product, productExists := db.GetProduct(req.ProductID)
    if !productExists {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "产品不存在",
        })
        return
    }
    
    // 检查库存
    if product.Stock < req.Quantity {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   fmt.Sprintf("库存不足，当前库存: %d", product.Stock),
        })
        return
    }
    
    // 计算总价
    total := product.Price * float64(req.Quantity)
    
    order := Order{
        BaseModel: BaseModel{
            CreatedAt: time.Now(),
            UpdatedAt: time.Now(),
        },
        UserID:    req.UserID,
        ProductID: req.ProductID,
        Quantity:  req.Quantity,
        Total:     total,
        Status:    "pending",
    }
    
    createdOrder := db.CreateOrder(order)
    
    c.JSON(http.StatusCreated, APIResponse{
        Success: true,
        Message: "订单创建成功",
        Data:    createdOrder,
    })
}

func handleValidationError(c *gin.Context, err error) {
    if validationErrors, ok := err.(validator.ValidationErrors); ok {
        var errors []string
        for _, fieldError := range validationErrors {
            switch fieldError.Tag() {
            case "required":
                errors = append(errors, fieldError.Field()+" 为必填项")
            case "email":
                errors = append(errors, fieldError.Field()+" 格式不正确")
            case "min":
                errors = append(errors, fieldError.Field()+" 长度不足")
            case "max":
                errors = append(errors, fieldError.Field()+" 长度过长")
            case "gte":
                errors = append(errors, fieldError.Field()+" 值过小")
            case "lte":
                errors = append(errors, fieldError.Field()+" 值过大")
            case "gt":
                errors = append(errors, fieldError.Field()+" 必须大于0")
            default:
                errors = append(errors, fieldError.Field()+" "+fieldError.Tag())
            }
        }
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "验证失败",
            Data:    errors,
        })
        return
    }
    
    c.JSON(http.StatusBadRequest, APIResponse{
        Success: false,
        Error:   err.Error(),
    })
}

func main() {
    r := gin.Default()
    
    // 用户相关路由
    users := r.Group("/api/v1/users")
    {
        users.GET("", getUsers)
        users.POST("", createUser)
        users.GET("/:id", getUser)
        users.PUT("/:id", updateUser)
        users.DELETE("/:id", deleteUser)
    }
    
    // 产品相关路由
    products := r.Group("/api/v1/products")
    {
        products.GET("", getProducts)
        products.POST("", createProduct)
        products.GET("/:id", getProduct)
    }
    
    // 订单相关路由
    orders := r.Group("/api/v1/orders")
    {
        orders.POST("", createOrder)
    }
    
    r.Run(":8080")
}
```

## 练习题

1. 为一个图书管理系统设计RESTful API，包含图书、作者、分类等资源
2. 实现API版本控制，支持v1和v2两个版本
3. 为API添加速率限制功能，防止恶意请求

```go
// 练习题参考答案

// library_management.go
package main

import (
    "fmt"
    "net/http"
    "strconv"
    "strings"
    "sync"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
)

// 数据模型
type Author struct {
    ID        int       `json:"id"`
    Name      string    `json:"name" binding:"required"`
    Biography string    `json:"biography"`
    BirthDate string    `json:"birth_date"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type Category struct {
    ID          int       `json:"id"`
    Name        string    `json:"name" binding:"required"`
    Description string    `json:"description"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

type Book struct {
    ID          int       `json:"id"`
    Title       string    `json:"title" binding:"required"`
    ISBN        string    `json:"isbn" binding:"required"`
    AuthorID    int       `json:"author_id" binding:"required"`
    Author      Author    `json:"author" gorm:"foreignKey:AuthorID"`
    CategoryID  int       `json:"category_id" binding:"required"`
    Category    Category  `json:"category" gorm:"foreignKey:CategoryID"`
    PublishedAt string    `json:"published_at"`
    Pages       int       `json:"pages"`
    Description string    `json:"description"`
    Price       float64   `json:"price"`
    Stock       int       `json:"stock"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

// 请求结构体
type CreateAuthorRequest struct {
    Name      string `json:"name" binding:"required"`
    Biography string `json:"biography"`
    BirthDate string `json:"birth_date"`
}

type CreateCategoryRequest struct {
    Name        string `json:"name" binding:"required"`
    Description string `json:"description"`
}

type CreateBookRequest struct {
    Title       string  `json:"title" binding:"required"`
    ISBN        string  `json:"isbn" binding:"required"`
    AuthorID    int     `json:"author_id" binding:"required"`
    CategoryID  int     `json:"category_id" binding:"required"`
    PublishedAt string  `json:"published_at"`
    Pages       int     `json:"pages"`
    Description string  `json:"description"`
    Price       float64 `json:"price"`
    Stock       int     `json:"stock"`
}

// 响应结构体
type APIResponse struct {
    Success bool        `json:"success"`
    Message string      `json:"message,omitempty"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
}

// 模拟数据库
type LibraryDB struct {
    authors   map[int]Author
    categories map[int]Category
    books     map[int]Book
    nextID    int
    mu        sync.RWMutex
}

func NewLibraryDB() *LibraryDB {
    return &LibraryDB{
        authors:   make(map[int]Author),
        categories: make(map[int]Category),
        books:     make(map[int]Book),
        nextID:    1,
    }
}

var db = NewLibraryDB()

// 初始化测试数据
func init() {
    // 创建测试作者
    author1 := Author{
        ID:        1,
        Name:      "鲁迅",
        Biography: "中国现代文学的奠基人之一",
        BirthDate: "1881-09-25",
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }
    db.authors[author1.ID] = author1
    
    author2 := Author{
        ID:        2,
        Name:      "老舍",
        Biography: "中国现代著名小说家、文学家",
        BirthDate: "1899-02-03",
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }
    db.authors[author2.ID] = author2
    
    // 创建测试分类
    category1 := Category{
        ID:          1,
        Name:        "小说",
        Description: "虚构文学作品",
        CreatedAt:   time.Now(),
        UpdatedAt:   time.Now(),
    }
    db.categories[category1.ID] = category1
    
    category2 := Category{
        ID:          2,
        Name:        "散文",
        Description: "非虚构文学作品",
        CreatedAt:   time.Now(),
        UpdatedAt:   time.Now(),
    }
    db.categories[category2.ID] = category2
    
    // 创建测试图书
    book1 := Book{
        ID:          1,
        Title:       "呐喊",
        ISBN:        "9787010000011",
        AuthorID:    1,
        Author:      author1,
        CategoryID:  1,
        Category:    category1,
        PublishedAt: "1923",
        Pages:       200,
        Description: "鲁迅的第一本小说集",
        Price:       29.80,
        Stock:       50,
        CreatedAt:   time.Now(),
        UpdatedAt:   time.Now(),
    }
    db.books[book1.ID] = book1
}

// 数据库操作方法
func (db *LibraryDB) CreateAuthor(author Author) Author {
    db.mu.Lock()
    defer db.mu.Unlock()
    
    author.ID = db.nextID
    db.nextID++
    db.authors[author.ID] = author
    
    return author
}

func (db *LibraryDB) GetAuthor(id int) (Author, bool) {
    db.mu.RLock()
    defer db.mu.RUnlock()
    
    author, exists := db.authors[id]
    return author, exists
}

func (db *LibraryDB) ListAuthors() []Author {
    db.mu.RLock()
    defer db.mu.RUnlock()
    
    authors := make([]Author, 0, len(db.authors))
    for _, author := range db.authors {
        authors = append(authors, author)
    }
    
    return authors
}

func (db *LibraryDB) CreateCategory(category Category) Category {
    db.mu.Lock()
    defer db.mu.Unlock()
    
    category.ID = db.nextID
    db.nextID++
    db.categories[category.ID] = category
    
    return category
}

func (db *LibraryDB) GetCategory(id int) (Category, bool) {
    db.mu.RLock()
    defer db.mu.RUnlock()
    
    category, exists := db.categories[id]
    return category, exists
}

func (db *LibraryDB) ListCategories() []Category {
    db.mu.RLock()
    defer db.mu.RUnlock()
    
    categories := make([]Category, 0, len(db.categories))
    for _, category := range db.categories {
        categories = append(categories, category)
    }
    
    return categories
}

func (db *LibraryDB) CreateBook(book Book) Book {
    db.mu.Lock()
    defer db.mu.Unlock()
    
    book.ID = db.nextID
    db.nextID++
    
    // 关联作者和分类
    if author, exists := db.authors[book.AuthorID]; exists {
        book.Author = author
    }
    if category, exists := db.categories[book.CategoryID]; exists {
        book.Category = category
    }
    
    db.books[book.ID] = book
    
    return book
}

func (db *LibraryDB) GetBook(id int) (Book, bool) {
    db.mu.RLock()
    defer db.mu.RUnlock()
    
    book, exists := db.books[id]
    return book, exists
}

func (db *LibraryDB) ListBooks() []Book {
    db.mu.RLock()
    defer db.mu.RUnlock()
    
    books := make([]Book, 0, len(db.books))
    for _, book := range db.books {
        // 确保关联数据存在
        if author, exists := db.authors[book.AuthorID]; exists {
            book.Author = author
        }
        if category, exists := db.categories[book.CategoryID]; exists {
            book.Category = category
        }
        books = append(books, book)
    }
    
    return books
}

// API处理函数
func getAuthors(c *gin.Context) {
    authors := db.ListAuthors()
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    authors,
    })
}

func getAuthor(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "无效的作者ID",
        })
        return
    }
    
    author, exists := db.GetAuthor(id)
    if !exists {
        c.JSON(http.StatusNotFound, APIResponse{
            Success: false,
            Error:   "作者不存在",
        })
        return
    }
    
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    author,
    })
}

func createAuthor(c *gin.Context) {
    var req CreateAuthorRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        handleValidationError(c, err)
        return
    }
    
    author := Author{
        Name:      req.Name,
        Biography: req.Biography,
        BirthDate: req.BirthDate,
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }
    
    createdAuthor := db.CreateAuthor(author)
    
    c.JSON(http.StatusCreated, APIResponse{
        Success: true,
        Message: "作者创建成功",
        Data:    createdAuthor,
    })
}

func getCategories(c *gin.Context) {
    categories := db.ListCategories()
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    categories,
    })
}

func getCategory(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "无效的分类ID",
        })
        return
    }
    
    category, exists := db.GetCategory(id)
    if !exists {
        c.JSON(http.StatusNotFound, APIResponse{
            Success: false,
            Error:   "分类不存在",
        })
        return
    }
    
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    category,
    })
}

func createCategory(c *gin.Context) {
    var req CreateCategoryRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        handleValidationError(c, err)
        return
    }
    
    category := Category{
        Name:        req.Name,
        Description: req.Description,
        CreatedAt:   time.Now(),
        UpdatedAt:   time.Now(),
    }
    
    createdCategory := db.CreateCategory(category)
    
    c.JSON(http.StatusCreated, APIResponse{
        Success: true,
        Message: "分类创建成功",
        Data:    createdCategory,
    })
}

func getBooks(c *gin.Context) {
    books := db.ListBooks()
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    books,
    })
}

func getBook(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "无效的图书ID",
        })
        return
    }
    
    book, exists := db.GetBook(id)
    if !exists {
        c.JSON(http.StatusNotFound, APIResponse{
            Success: false,
            Error:   "图书不存在",
        })
        return
    }
    
    // 确保关联数据存在
    if author, exists := db.GetAuthor(book.AuthorID); exists {
        book.Author = author
    }
    if category, exists := db.GetCategory(book.CategoryID); exists {
        book.Category = category
    }
    
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    book,
    })
}

func createBook(c *gin.Context) {
    var req CreateBookRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        handleValidationError(c, err)
        return
    }
    
    // 检查作者是否存在
    if _, exists := db.GetAuthor(req.AuthorID); !exists {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "作者不存在",
        })
        return
    }
    
    // 检查分类是否存在
    if _, exists := db.GetCategory(req.CategoryID); !exists {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "分类不存在",
        })
        return
    }
    
    book := Book{
        Title:       req.Title,
        ISBN:        req.ISBN,
        AuthorID:    req.AuthorID,
        CategoryID:  req.CategoryID,
        PublishedAt: req.PublishedAt,
        Pages:       req.Pages,
        Description: req.Description,
        Price:       req.Price,
        Stock:       req.Stock,
        CreatedAt:   time.Now(),
        UpdatedAt:   time.Now(),
    }
    
    createdBook := db.CreateBook(book)
    
    c.JSON(http.StatusCreated, APIResponse{
        Success: true,
        Message: "图书创建成功",
        Data:    createdBook,
    })
}

func searchBooks(c *gin.Context) {
    query := c.Query("q")
    if query == "" {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "搜索关键词不能为空",
        })
        return
    }
    
    allBooks := db.ListBooks()
    var results []Book
    
    query = strings.ToLower(query)
    for _, book := range allBooks {
        // 搜索标题、作者名、分类名
        if strings.Contains(strings.ToLower(book.Title), query) ||
           strings.Contains(strings.ToLower(book.Author.Name), query) ||
           strings.Contains(strings.ToLower(book.Category.Name), query) {
            results = append(results, book)
        }
    }
    
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    results,
    })
}

func handleValidationError(c *gin.Context, err error) {
    if validationErrors, ok := err.(validator.ValidationErrors); ok {
        var errors []string
        for _, fieldError := range validationErrors {
            switch fieldError.Tag() {
            case "required":
                errors = append(errors, fieldError.Field()+" 为必填项")
            default:
                errors = append(errors, fieldError.Field()+" "+fieldError.Tag())
            }
        }
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "验证失败",
            Data:    errors,
        })
        return
    }
    
    c.JSON(http.StatusBadRequest, APIResponse{
        Success: false,
        Error:   err.Error(),
    })
}

// 练习题2: API版本控制
func setupAPIVersions(r *gin.Engine) {
    // v1版本
    v1 := r.Group("/api/v1")
    {
        authors := v1.Group("/authors")
        {
            authors.GET("", getAuthors)
            authors.POST("", createAuthor)
            authors.GET("/:id", getAuthor)
        }
        
        categories := v1.Group("/categories")
        {
            categories.GET("", getCategories)
            categories.POST("", createCategory)
            categories.GET("/:id", getCategory)
        }
        
        books := v1.Group("/books")
        {
            books.GET("", getBooks)
            books.POST("", createBook)
            books.GET("/:id", getBook)
            books.GET("/search", searchBooks)
        }
    }
    
    // v2版本（可以添加新功能或修改现有功能）
    v2 := r.Group("/api/v2")
    {
        authors := v2.Group("/authors")
        {
            authors.GET("", getAuthors)
            authors.POST("", createAuthor)
            authors.GET("/:id", getAuthor)
            // v2可以添加新的端点
            authors.GET("/:id/books", getAuthorBooks) // 获取作者的所有图书
        }
        
        categories := v2.Group("/categories")
        {
            categories.GET("", getCategories)
            categories.POST("", createCategory)
            categories.GET("/:id", getCategory)
            // v2可以添加新的端点
            categories.GET("/:id/books", getCategoryBooks) // 获取分类下的所有图书
        }
        
        books := v2.Group("/books")
        {
            books.GET("", getBooks)
            books.POST("", createBook)
            books.GET("/:id", getBook)
            books.GET("/search", searchBooks)
            // v2可以添加新的端点
            books.GET("/:id/similar", getSimilarBooks) // 获取相似图书
        }
    }
}

// v2新增功能
func getAuthorBooks(c *gin.Context) {
    authorID, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "无效的作者ID",
        })
        return
    }
    
    _, exists := db.GetAuthor(authorID)
    if !exists {
        c.JSON(http.StatusNotFound, APIResponse{
            Success: false,
            Error:   "作者不存在",
        })
        return
    }
    
    // 查找该作者的所有图书
    var authorBooks []Book
    allBooks := db.ListBooks()
    for _, book := range allBooks {
        if book.AuthorID == authorID {
            authorBooks = append(authorBooks, book)
        }
    }
    
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    authorBooks,
    })
}

func getCategoryBooks(c *gin.Context) {
    categoryID, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "无效的分类ID",
        })
        return
    }
    
    _, exists := db.GetCategory(categoryID)
    if !exists {
        c.JSON(http.StatusNotFound, APIResponse{
            Success: false,
            Error:   "分类不存在",
        })
        return
    }
    
    // 查找该分类下的所有图书
    var categoryBooks []Book
    allBooks := db.ListBooks()
    for _, book := range allBooks {
        if book.CategoryID == categoryID {
            categoryBooks = append(categoryBooks, book)
        }
    }
    
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    categoryBooks,
    })
}

func getSimilarBooks(c *gin.Context) {
    bookID, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, APIResponse{
            Success: false,
            Error:   "无效的图书ID",
        })
        return
    }
    
    book, exists := db.GetBook(bookID)
    if !exists {
        c.JSON(http.StatusNotFound, APIResponse{
            Success: false,
            Error:   "图书不存在",
        })
        return
    }
    
    // 查找相似图书（相同分类或作者的图书）
    var similarBooks []Book
    allBooks := db.ListBooks()
    for _, b := range allBooks {
        if b.ID != bookID && (b.CategoryID == book.CategoryID || b.AuthorID == book.AuthorID) {
            similarBooks = append(similarBooks, b)
        }
    }
    
    c.JSON(http.StatusOK, APIResponse{
        Success: true,
        Data:    similarBooks,
    })
}

// 练习题3: 速率限制中间件
func RateLimitMiddleware(maxRequests int, window time.Duration) gin.HandlerFunc {
    type clientInfo struct {
        requests []time.Time
    }
    
    clients := make(map[string]*clientInfo)
    mutex := sync.Mutex{}
    
    return func(c *gin.Context) {
        clientIP := c.ClientIP()
        
        mutex.Lock()
        client, exists := clients[clientIP]
        if !exists {
            client = &clientInfo{requests: make([]time.Time, 0)}
            clients[clientIP] = client
        }
        
        now := time.Now()
        
        // 清理过期请求记录
        validRequests := make([]time.Time, 0)
        for _, reqTime := range client.requests {
            if now.Sub(reqTime) < window {
                validRequests = append(validRequests, reqTime)
            }
        }
        client.requests = validRequests
        
        // 检查是否超过限制
        if len(client.requests) >= maxRequests {
            mutex.Unlock()
            c.JSON(http.StatusTooManyRequests, APIResponse{
                Success: false,
                Error:   fmt.Sprintf("请求过于频繁，请在%s后再试", window.String()),
            })
            c.Abort()
            return
        }
        
        // 记录当前请求
        client.requests = append(client.requests, now)
        mutex.Unlock()
        
        c.Next()
    }
}

func main() {
    r := gin.Default()
    
    // 添加速率限制中间件（每分钟最多60个请求）
    r.Use(RateLimitMiddleware(60, time.Minute))
    
    // 设置API版本
    setupAPIVersions(r)
    
    fmt.Println("图书管理系统API服务器启动在 :8080")
    fmt.Println("API文档:")
    fmt.Println("  v1版本: http://localhost:8080/api/v1")
    fmt.Println("  v2版本: http://localhost:8080/api/v2")
    
    r.Run(":8080")
}
```

## 总结

本章详细介绍了RESTful API设计的原则和最佳实践，包括URI设计、HTTP方法使用、状态码选择、错误处理、分页过滤等核心概念。通过完整的示例和练习题，帮助读者掌握构建高质量RESTful API的技能。良好的API设计对于系统的可维护性和可扩展性至关重要，掌握这些技能对于后端开发者来说是必不可少的。下一章我们将学习微服务架构。