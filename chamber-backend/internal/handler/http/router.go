package http

import (
	"chamber-backend/internal/config"
	"chamber-backend/internal/handler/http/middleware"
	"chamber-backend/internal/service"
	"chamber-backend/pkg/jwtutil"
	"chamber-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

// NewRouter 创建 HTTP 路由入口。
// 路由结构分成两层：
// 1. 公开接口：健康检查、登录。
// 2. 受保护接口：所有业务 CRUD，都要求先通过 JWT 校验，并具备 admin 角色。
func NewRouter(cfg config.Config, svc *service.Service) *gin.Engine {
	r := gin.Default()

	v1 := r.Group("/api/v1")
	{
		// 健康检查接口用于容器探活、部署校验和本地联通性检查。
		v1.GET("/health", func(c *gin.Context) {
			response.OK(c, gin.H{"service": cfg.AppName, "status": "up"})
		})

		// 登录接口只负责认证，不承担注册等额外职责。
		// 成功后返回签发好的 JWT，后续所有业务接口都依赖这个 token。
		v1.POST("/auth/login", func(c *gin.Context) {
			var req loginRequest
			if !bindJSON(c, &req) {
				return
			}

			user, err := svc.Login(req.UsernameValue(), req.Password)
			if err != nil {
				respondServiceError(c, err)
				return
			}

			token, err := jwtutil.Generate(cfg.JWTSecret, user.ID, user.Username, user.Role, cfg.TokenExpiresIn)
			if err != nil {
				respondServiceError(c, err)
				return
			}

			response.OK(c, gin.H{"token": token, "user": user})
		})
	}

	// 统一给受保护接口挂载 JWT 校验和管理员角色校验，
	// 避免每个业务分组重复写相同的中间件。
	auth := v1.Group("")
	auth.Use(middleware.JWTAuth(cfg), middleware.RequireRole("admin"))
	{
		registerOrganizationRoutes(auth, svc)
		registerMemberRoutes(auth, svc)
		registerActivityRoutes(auth, svc)
		registerFeeRoutes(auth, svc)
		registerNoticeRoutes(auth, svc)
	}

	return r
}

// registerOrganizationRoutes 注册组织管理接口。
// 组织是会员的上游资源，所以它的增删改查通常是后台管理系统里的基础能力。
func registerOrganizationRoutes(g *gin.RouterGroup, svc *service.Service) {
	org := g.Group("/organizations")
	org.POST("", func(c *gin.Context) {
		var req organizationCreateRequest
		if !bindJSON(c, &req) {
			return
		}

		orgModel, err := req.ToModel()
		if err != nil {
			respondBadRequest(c, err)
			return
		}
		if err := svc.CreateOrganization(&orgModel); err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, orgModel)
	})
	org.GET("", func(c *gin.Context) {
		list, err := svc.ListOrganizations()
		if err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, list)
	})
	org.GET("/:id", func(c *gin.Context) {
		id, ok := parseUintParam(c, "id")
		if !ok {
			return
		}
		item, err := svc.GetOrganization(id)
		if err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, item)
	})
	org.PUT("/:id", func(c *gin.Context) {
		id, ok := parseUintParam(c, "id")
		if !ok {
			return
		}

		var req organizationUpdateRequest
		if !bindJSON(c, &req) {
			return
		}

		updates, err := req.Updates()
		if err != nil {
			respondBadRequest(c, err)
			return
		}
		item, err := svc.UpdateOrganization(id, updates)
		if err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, item)
	})
	org.DELETE("/:id", func(c *gin.Context) {
		id, ok := parseUintParam(c, "id")
		if !ok {
			return
		}
		if err := svc.DeleteOrganization(id); err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, gin.H{"deleted": id})
	})
}

// registerMemberRoutes 注册会员管理接口。
// 会员接口额外支持 organization_id 过滤，用于按组织查看会员。
func registerMemberRoutes(g *gin.RouterGroup, svc *service.Service) {
	member := g.Group("/members")
	member.POST("", func(c *gin.Context) {
		var req memberCreateRequest
		if !bindJSON(c, &req) {
			return
		}

		memberModel, err := req.ToModel()
		if err != nil {
			respondBadRequest(c, err)
			return
		}
		if err := svc.CreateMember(&memberModel); err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, memberModel)
	})
	member.GET("", func(c *gin.Context) {
		organizationID, ok := parseOptionalUintQuery(c, "organization_id")
		if !ok {
			return
		}

		list, err := svc.ListMembers(organizationID)
		if err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, list)
	})
	member.GET("/:id", func(c *gin.Context) {
		id, ok := parseUintParam(c, "id")
		if !ok {
			return
		}
		item, err := svc.GetMember(id)
		if err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, item)
	})
	member.PUT("/:id", func(c *gin.Context) {
		id, ok := parseUintParam(c, "id")
		if !ok {
			return
		}

		var req memberUpdateRequest
		if !bindJSON(c, &req) {
			return
		}

		updates, err := req.Updates()
		if err != nil {
			respondBadRequest(c, err)
			return
		}
		item, err := svc.UpdateMember(id, updates)
		if err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, item)
	})
	member.DELETE("/:id", func(c *gin.Context) {
		id, ok := parseUintParam(c, "id")
		if !ok {
			return
		}
		if err := svc.DeleteMember(id); err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, gin.H{"deleted": id})
	})
}

// registerActivityRoutes 注册活动管理接口。
// 活动主要关注时间区间、标题和状态等字段，时间合法性在 service 层集中处理。
func registerActivityRoutes(g *gin.RouterGroup, svc *service.Service) {
	activity := g.Group("/activities")
	activity.POST("", func(c *gin.Context) {
		var req activityCreateRequest
		if !bindJSON(c, &req) {
			return
		}

		activityModel, err := req.ToModel()
		if err != nil {
			respondBadRequest(c, err)
			return
		}
		if err := svc.CreateActivity(&activityModel); err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, activityModel)
	})
	activity.GET("", func(c *gin.Context) {
		list, err := svc.ListActivities()
		if err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, list)
	})
	activity.GET("/:id", func(c *gin.Context) {
		id, ok := parseUintParam(c, "id")
		if !ok {
			return
		}
		item, err := svc.GetActivity(id)
		if err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, item)
	})
	activity.PUT("/:id", func(c *gin.Context) {
		id, ok := parseUintParam(c, "id")
		if !ok {
			return
		}

		var req activityUpdateRequest
		if !bindJSON(c, &req) {
			return
		}

		updates, err := req.Updates()
		if err != nil {
			respondBadRequest(c, err)
			return
		}
		item, err := svc.UpdateActivity(id, updates)
		if err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, item)
	})
	activity.DELETE("/:id", func(c *gin.Context) {
		id, ok := parseUintParam(c, "id")
		if !ok {
			return
		}
		if err := svc.DeleteActivity(id); err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, gin.H{"deleted": id})
	})
}

// registerFeeRoutes 注册会费管理接口。
// 会费单依赖会员存在，因此创建和更新时都需要经过 service 层的关联校验。
func registerFeeRoutes(g *gin.RouterGroup, svc *service.Service) {
	fee := g.Group("/fees")
	fee.POST("", func(c *gin.Context) {
		var req feeBillCreateRequest
		if !bindJSON(c, &req) {
			return
		}

		feeModel, err := req.ToModel()
		if err != nil {
			respondBadRequest(c, err)
			return
		}
		if err := svc.CreateFeeBill(&feeModel); err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, feeModel)
	})
	fee.GET("", func(c *gin.Context) {
		list, err := svc.ListFeeBills()
		if err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, list)
	})
	fee.GET("/:id", func(c *gin.Context) {
		id, ok := parseUintParam(c, "id")
		if !ok {
			return
		}
		item, err := svc.GetFeeBill(id)
		if err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, item)
	})
	fee.PUT("/:id", func(c *gin.Context) {
		id, ok := parseUintParam(c, "id")
		if !ok {
			return
		}

		var req feeBillUpdateRequest
		if !bindJSON(c, &req) {
			return
		}

		updates, err := req.Updates()
		if err != nil {
			respondBadRequest(c, err)
			return
		}
		item, err := svc.UpdateFeeBill(id, updates)
		if err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, item)
	})
	fee.DELETE("/:id", func(c *gin.Context) {
		id, ok := parseUintParam(c, "id")
		if !ok {
			return
		}
		if err := svc.DeleteFeeBill(id); err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, gin.H{"deleted": id})
	})
}

// registerNoticeRoutes 注册公告管理接口。
// 公告模型相对独立，没有复杂关联，所以 handler 主要负责请求绑定和响应映射。
func registerNoticeRoutes(g *gin.RouterGroup, svc *service.Service) {
	notice := g.Group("/notices")
	notice.POST("", func(c *gin.Context) {
		var req noticeCreateRequest
		if !bindJSON(c, &req) {
			return
		}

		noticeModel, err := req.ToModel()
		if err != nil {
			respondBadRequest(c, err)
			return
		}
		if err := svc.CreateNotice(&noticeModel); err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, noticeModel)
	})
	notice.GET("", func(c *gin.Context) {
		list, err := svc.ListNotices()
		if err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, list)
	})
	notice.GET("/:id", func(c *gin.Context) {
		id, ok := parseUintParam(c, "id")
		if !ok {
			return
		}
		item, err := svc.GetNotice(id)
		if err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, item)
	})
	notice.PUT("/:id", func(c *gin.Context) {
		id, ok := parseUintParam(c, "id")
		if !ok {
			return
		}

		var req noticeUpdateRequest
		if !bindJSON(c, &req) {
			return
		}

		updates, err := req.Updates()
		if err != nil {
			respondBadRequest(c, err)
			return
		}
		item, err := svc.UpdateNotice(id, updates)
		if err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, item)
	})
	notice.DELETE("/:id", func(c *gin.Context) {
		id, ok := parseUintParam(c, "id")
		if !ok {
			return
		}
		if err := svc.DeleteNotice(id); err != nil {
			respondServiceError(c, err)
			return
		}
		response.OK(c, gin.H{"deleted": id})
	})
}
