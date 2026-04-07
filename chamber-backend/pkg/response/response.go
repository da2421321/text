package response

import "github.com/gin-gonic/gin"

// OK 返回统一的成功响应结构。
// 当前约定 code=0 表示成功，真正的业务数据放在 data 字段里。
func OK(c *gin.Context, data interface{}) {
	c.JSON(200, gin.H{"code": 0, "msg": "ok", "data": data})
}

// Error 返回统一的失败响应结构。
// 这里把 HTTP 状态码同步写进 code，前端既可以看状态码，也可以直接看响应体里的 code。
func Error(c *gin.Context, status int, msg string) {
	c.JSON(status, gin.H{"code": status, "msg": msg})
}
