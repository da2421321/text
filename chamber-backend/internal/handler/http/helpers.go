package http

import (
	"errors"
	"log"
	"strconv"
	"strings"

	"chamber-backend/internal/service"
	"chamber-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

// bindJSON 统一处理 JSON 请求体绑定。
// 它的意义不只是少写几行代码，而是确保所有接口在绑定失败时返回一致的 400 响应，
// 避免有的接口返回数据库错误、有的接口返回框架默认错误。
func bindJSON(c *gin.Context, target any) bool {
	if err := c.ShouldBindJSON(target); err != nil {
		response.Error(c, 400, "invalid request body")
		return false
	}
	return true
}

// parseUintParam 用于解析路径里的资源 ID。
// 这里明确拒绝 0 和非法字符串，是为了在进入 service 层前就把明显错误拦截掉，
// 让后续代码只处理“合法格式但可能不存在”的情况。
func parseUintParam(c *gin.Context, name string) (uint, bool) {
	rawValue := strings.TrimSpace(c.Param(name))
	parsed, err := strconv.ParseUint(rawValue, 10, 64)
	if err != nil || parsed == 0 {
		response.Error(c, 400, "invalid "+name)
		return 0, false
	}
	return uint(parsed), true
}

// parseOptionalUintQuery 用于解析可选查询参数，例如 organization_id。
// 返回值设计成 (*uint, bool) 是为了表达两层信息：
// 1. *uint == nil：调用方没有传这个过滤条件。
// 2. bool == false：调用方传了，但格式错误，应该立刻返回 400。
func parseOptionalUintQuery(c *gin.Context, name string) (*uint, bool) {
	rawValue := strings.TrimSpace(c.Query(name))
	if rawValue == "" {
		return nil, true
	}

	parsed, err := strconv.ParseUint(rawValue, 10, 64)
	if err != nil || parsed == 0 {
		response.Error(c, 400, "invalid "+name)
		return nil, false
	}

	value := uint(parsed)
	return &value, true
}

// respondBadRequest 统一处理参数类错误。
// 这类错误通常来自 DTO 校验或字段归一化，不属于服务端内部异常，所以直接返回 400。
func respondBadRequest(c *gin.Context, err error) {
	response.Error(c, 400, err.Error())
}

// respondServiceError 负责把业务层错误翻译成 HTTP 响应。
// 这里刻意不把 err.Error() 原样返回给前端，
// 因为很多底层错误会包含表名、索引名、SQL 细节，这些信息不应该暴露出去。
func respondServiceError(c *gin.Context, err error) {
	switch {
	case err == nil:
		return
	case errors.Is(err, service.ErrInvalidCredentials):
		response.Error(c, 401, "invalid username or password")
	case errors.Is(err, service.ErrNotFound):
		response.Error(c, 404, "resource not found")
	case errors.Is(err, service.ErrInvalidReference):
		response.Error(c, 400, "related resource not found")
	case errors.Is(err, service.ErrInvalidState):
		response.Error(c, 400, "request violates resource constraints")
	case errors.Is(err, service.ErrConflict):
		response.Error(c, 409, "resource conflict")
	case errors.Is(err, service.ErrDependencyExists):
		response.Error(c, 409, "resource has dependent records")
	default:
		log.Printf("unexpected handler error: %v", err)
		response.Error(c, 500, "internal server error")
	}
}
