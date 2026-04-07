package http

import (
	"errors"
	"fmt"
	"net/mail"
	"strings"
	"time"

	"chamber-backend/internal/model"
)

// errNoFieldsToUpdate 表示客户端提交了一个“空更新”请求。
// 也就是请求体合法，但没有任何一个字段真正参与更新。
var errNoFieldsToUpdate = errors.New("at least one field must be provided")

// loginRequest 是登录接口使用的请求结构。
// 这里只保留登录必需字段，避免把用户模型直接暴露给 HTTP 绑定层。
type loginRequest struct {
	Username string `json:"username" binding:"required,max=64"`
	Password string `json:"password" binding:"required,min=8,max=128"`
}

// UsernameValue 会去掉用户名首尾空格。
// 这样可以避免前端不小心多传空格时，导致看起来一样的用户名无法匹配。
func (r loginRequest) UsernameValue() string {
	return strings.TrimSpace(r.Username)
}

// organizationCreateRequest 是组织创建接口的请求 DTO。
// DTO 和数据库模型分离后，客户端就不能直接传入 id、created_at 之类的字段。
type organizationCreateRequest struct {
	Name    string `json:"name" binding:"required,max=128"`
	Code    string `json:"code" binding:"required,max=64"`
	Contact string `json:"contact" binding:"omitempty,max=64"`
	Phone   string `json:"phone" binding:"omitempty,max=32"`
}

// ToModel 把创建请求转换成数据库模型。
// 在这个过程中会统一做字符串裁剪、长度限制和默认值处理，
// 保证进入 service 层的数据已经是“干净的业务值”。
func (r organizationCreateRequest) ToModel() (model.Organization, error) {
	name, err := normalizeRequiredString(r.Name, "name", 128)
	if err != nil {
		return model.Organization{}, err
	}
	code, err := normalizeRequiredString(r.Code, "code", 64)
	if err != nil {
		return model.Organization{}, err
	}
	contact, err := normalizeOptionalString(r.Contact, "contact", 64)
	if err != nil {
		return model.Organization{}, err
	}
	phone, err := normalizeOptionalString(r.Phone, "phone", 32)
	if err != nil {
		return model.Organization{}, err
	}

	return model.Organization{
		Name:    name,
		Code:    code,
		Contact: contact,
		Phone:   phone,
	}, nil
}

// organizationUpdateRequest 使用指针字段来表达“部分更新”。
// 例如：
// 1. 字段为 nil，表示前端没有传这个字段，不应该更新。
// 2. 字段不为 nil 但内容为空字符串，表示前端明确要把它清空。
type organizationUpdateRequest struct {
	Name    *string `json:"name" binding:"omitempty,max=128"`
	Code    *string `json:"code" binding:"omitempty,max=64"`
	Contact *string `json:"contact" binding:"omitempty,max=64"`
	Phone   *string `json:"phone" binding:"omitempty,max=32"`
}

// Updates 把更新请求转换成 map。
// 这里不用 struct 直接交给 GORM，是因为 GORM 对 struct 更新默认会忽略零值，
// 那样就无法正确处理“把字段更新为空字符串”这类场景。
func (r organizationUpdateRequest) Updates() (map[string]any, error) {
	updates := map[string]any{}

	if r.Name != nil {
		value, err := normalizeRequiredString(*r.Name, "name", 128)
		if err != nil {
			return nil, err
		}
		updates["name"] = value
	}
	if r.Code != nil {
		value, err := normalizeRequiredString(*r.Code, "code", 64)
		if err != nil {
			return nil, err
		}
		updates["code"] = value
	}
	if r.Contact != nil {
		value, err := normalizeOptionalString(*r.Contact, "contact", 64)
		if err != nil {
			return nil, err
		}
		updates["contact"] = value
	}
	if r.Phone != nil {
		value, err := normalizeOptionalString(*r.Phone, "phone", 32)
		if err != nil {
			return nil, err
		}
		updates["phone"] = value
	}

	return finalizeUpdates(updates)
}

// memberCreateRequest 是会员创建接口的请求 DTO。
// 会员和组织存在关联关系，所以 organization_id 是必填字段。
type memberCreateRequest struct {
	Name           string `json:"name" binding:"required,max=128"`
	MemberType     string `json:"member_type" binding:"omitempty,max=32"`
	OrganizationID uint   `json:"organization_id" binding:"required"`
	Phone          string `json:"phone" binding:"omitempty,max=32"`
	Email          string `json:"email" binding:"omitempty,max=128"`
	Status         string `json:"status" binding:"omitempty,max=32"`
}

// ToModel 把会员创建请求转换成模型。
// 这里除了常规字段清洗，还会：
// 1. 给 member_type、status 等字段补默认值。
// 2. 保证 organization_id 不是 0，避免明显非法的数据继续向后流转。
func (r memberCreateRequest) ToModel() (model.Member, error) {
	name, err := normalizeRequiredString(r.Name, "name", 128)
	if err != nil {
		return model.Member{}, err
	}
	memberType, err := normalizeDefaultedString(r.MemberType, "member_type", "enterprise", 32)
	if err != nil {
		return model.Member{}, err
	}
	phone, err := normalizeOptionalString(r.Phone, "phone", 32)
	if err != nil {
		return model.Member{}, err
	}
	email, err := normalizeEmail(r.Email)
	if err != nil {
		return model.Member{}, err
	}
	status, err := normalizeDefaultedString(r.Status, "status", "active", 32)
	if err != nil {
		return model.Member{}, err
	}
	if r.OrganizationID == 0 {
		return model.Member{}, fmt.Errorf("organization_id must be greater than 0")
	}

	return model.Member{
		Name:           name,
		MemberType:     memberType,
		OrganizationID: r.OrganizationID,
		Phone:          phone,
		Email:          email,
		Status:         status,
	}, nil
}

// memberUpdateRequest 用于会员的部分更新。
// 指针字段的主要价值，是保留“字段是否出现过”这个信息。
type memberUpdateRequest struct {
	Name           *string `json:"name" binding:"omitempty,max=128"`
	MemberType     *string `json:"member_type" binding:"omitempty,max=32"`
	OrganizationID *uint   `json:"organization_id"`
	Phone          *string `json:"phone" binding:"omitempty,max=32"`
	Email          *string `json:"email" binding:"omitempty,max=128"`
	Status         *string `json:"status" binding:"omitempty,max=32"`
}

// Updates 把更新请求转换成 map，显式保留零值。
// 例如邮箱被更新成空字符串时，这里仍然会把 email 放进 updates，
// 这样 service 层才能把“清空邮箱”准确地写入数据库。
func (r memberUpdateRequest) Updates() (map[string]any, error) {
	updates := map[string]any{}

	if r.Name != nil {
		value, err := normalizeRequiredString(*r.Name, "name", 128)
		if err != nil {
			return nil, err
		}
		updates["name"] = value
	}
	if r.MemberType != nil {
		value, err := normalizeRequiredString(*r.MemberType, "member_type", 32)
		if err != nil {
			return nil, err
		}
		updates["member_type"] = value
	}
	if r.OrganizationID != nil {
		if *r.OrganizationID == 0 {
			return nil, fmt.Errorf("organization_id must be greater than 0")
		}
		updates["organization_id"] = *r.OrganizationID
	}
	if r.Phone != nil {
		value, err := normalizeOptionalString(*r.Phone, "phone", 32)
		if err != nil {
			return nil, err
		}
		updates["phone"] = value
	}
	if r.Email != nil {
		value, err := normalizeEmail(*r.Email)
		if err != nil {
			return nil, err
		}
		updates["email"] = value
	}
	if r.Status != nil {
		value, err := normalizeRequiredString(*r.Status, "status", 32)
		if err != nil {
			return nil, err
		}
		updates["status"] = value
	}

	return finalizeUpdates(updates)
}

// activityCreateRequest 是活动创建接口的请求 DTO。
// 活动最关键的业务字段是标题、时间区间和状态。
type activityCreateRequest struct {
	Title       string    `json:"title" binding:"required,max=128"`
	Description string    `json:"description"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	Location    string    `json:"location" binding:"omitempty,max=255"`
	Status      string    `json:"status" binding:"omitempty,max=32"`
}

// ToModel 把活动创建请求转换成模型。
// 时间是否合法虽然最终还会在 service 层再验一次，但这里先做一次前置过滤，
// 可以让明显错误更早返回给前端。
func (r activityCreateRequest) ToModel() (model.Activity, error) {
	title, err := normalizeRequiredString(r.Title, "title", 128)
	if err != nil {
		return model.Activity{}, err
	}
	description := strings.TrimSpace(r.Description)
	location, err := normalizeOptionalString(r.Location, "location", 255)
	if err != nil {
		return model.Activity{}, err
	}
	status, err := normalizeDefaultedString(r.Status, "status", "draft", 32)
	if err != nil {
		return model.Activity{}, err
	}
	if !r.StartTime.IsZero() && !r.EndTime.IsZero() && r.EndTime.Before(r.StartTime) {
		return model.Activity{}, fmt.Errorf("end_time must not be before start_time")
	}

	return model.Activity{
		Title:       title,
		Description: description,
		StartTime:   r.StartTime,
		EndTime:     r.EndTime,
		Location:    location,
		Status:      status,
	}, nil
}

// activityUpdateRequest 用于活动的部分字段更新。
type activityUpdateRequest struct {
	Title       *string    `json:"title" binding:"omitempty,max=128"`
	Description *string    `json:"description"`
	StartTime   *time.Time `json:"start_time"`
	EndTime     *time.Time `json:"end_time"`
	Location    *string    `json:"location" binding:"omitempty,max=255"`
	Status      *string    `json:"status" binding:"omitempty,max=32"`
}

// Updates 负责构建活动更新字段。
// 如果本次请求同时提交了开始时间和结束时间，这里会先做一轮局部校验；
// 如果只提交了其中一个字段，则由 service 层结合旧值再做完整校验。
func (r activityUpdateRequest) Updates() (map[string]any, error) {
	updates := map[string]any{}

	if r.Title != nil {
		value, err := normalizeRequiredString(*r.Title, "title", 128)
		if err != nil {
			return nil, err
		}
		updates["title"] = value
	}
	if r.Description != nil {
		updates["description"] = strings.TrimSpace(*r.Description)
	}
	if r.StartTime != nil {
		updates["start_time"] = *r.StartTime
	}
	if r.EndTime != nil {
		updates["end_time"] = *r.EndTime
	}
	if r.Location != nil {
		value, err := normalizeOptionalString(*r.Location, "location", 255)
		if err != nil {
			return nil, err
		}
		updates["location"] = value
	}
	if r.Status != nil {
		value, err := normalizeRequiredString(*r.Status, "status", 32)
		if err != nil {
			return nil, err
		}
		updates["status"] = value
	}
	if r.StartTime != nil && r.EndTime != nil && r.EndTime.Before(*r.StartTime) {
		return nil, fmt.Errorf("end_time must not be before start_time")
	}

	return finalizeUpdates(updates)
}

// feeBillCreateRequest 是会费单创建接口的请求 DTO。
// 会费单依附于会员，因此 member_id 必填；金额和年份也必须可用。
type feeBillCreateRequest struct {
	MemberID uint   `json:"member_id" binding:"required"`
	Year     int    `json:"year" binding:"required"`
	Amount   int64  `json:"amount" binding:"required"`
	Status   string `json:"status" binding:"omitempty,max=32"`
	Remark   string `json:"remark" binding:"omitempty,max=255"`
}

// ToModel 把会费单创建请求转换成模型。
// 这里重点拦截三类明显错误：
// 1. member_id 为 0。
// 2. year 非正数。
// 3. amount 为负数。
func (r feeBillCreateRequest) ToModel() (model.FeeBill, error) {
	status, err := normalizeDefaultedString(r.Status, "status", "unpaid", 32)
	if err != nil {
		return model.FeeBill{}, err
	}
	remark, err := normalizeOptionalString(r.Remark, "remark", 255)
	if err != nil {
		return model.FeeBill{}, err
	}
	if r.MemberID == 0 {
		return model.FeeBill{}, fmt.Errorf("member_id must be greater than 0")
	}
	if r.Year <= 0 {
		return model.FeeBill{}, fmt.Errorf("year must be greater than 0")
	}
	if r.Amount < 0 {
		return model.FeeBill{}, fmt.Errorf("amount must not be negative")
	}

	return model.FeeBill{
		MemberID: r.MemberID,
		Year:     r.Year,
		Amount:   r.Amount,
		Status:   status,
		Remark:   remark,
	}, nil
}

// feeBillUpdateRequest 用于会费单的部分更新。
type feeBillUpdateRequest struct {
	MemberID *uint   `json:"member_id"`
	Year     *int    `json:"year"`
	Amount   *int64  `json:"amount"`
	Status   *string `json:"status" binding:"omitempty,max=32"`
	Remark   *string `json:"remark" binding:"omitempty,max=255"`
}

// Updates 会显式保留零值。
// 这在会费单场景里尤其重要，因为 amount 更新成 0、remark 清空，
// 都是可能存在的真实业务操作。
func (r feeBillUpdateRequest) Updates() (map[string]any, error) {
	updates := map[string]any{}

	if r.MemberID != nil {
		if *r.MemberID == 0 {
			return nil, fmt.Errorf("member_id must be greater than 0")
		}
		updates["member_id"] = *r.MemberID
	}
	if r.Year != nil {
		if *r.Year <= 0 {
			return nil, fmt.Errorf("year must be greater than 0")
		}
		updates["year"] = *r.Year
	}
	if r.Amount != nil {
		if *r.Amount < 0 {
			return nil, fmt.Errorf("amount must not be negative")
		}
		updates["amount"] = *r.Amount
	}
	if r.Status != nil {
		value, err := normalizeRequiredString(*r.Status, "status", 32)
		if err != nil {
			return nil, err
		}
		updates["status"] = value
	}
	if r.Remark != nil {
		value, err := normalizeOptionalString(*r.Remark, "remark", 255)
		if err != nil {
			return nil, err
		}
		updates["remark"] = value
	}

	return finalizeUpdates(updates)
}

// noticeCreateRequest 是公告创建接口的请求 DTO。
type noticeCreateRequest struct {
	Title     string `json:"title" binding:"required,max=128"`
	Content   string `json:"content" binding:"required"`
	Publisher string `json:"publisher" binding:"omitempty,max=64"`
	Status    string `json:"status" binding:"omitempty,max=32"`
}

// ToModel 把公告创建请求转换成模型，并给 status 提供默认值。
func (r noticeCreateRequest) ToModel() (model.Notice, error) {
	title, err := normalizeRequiredString(r.Title, "title", 128)
	if err != nil {
		return model.Notice{}, err
	}
	content, err := normalizeRequiredString(r.Content, "content", 0)
	if err != nil {
		return model.Notice{}, err
	}
	publisher, err := normalizeOptionalString(r.Publisher, "publisher", 64)
	if err != nil {
		return model.Notice{}, err
	}
	status, err := normalizeDefaultedString(r.Status, "status", "published", 32)
	if err != nil {
		return model.Notice{}, err
	}

	return model.Notice{
		Title:     title,
		Content:   content,
		Publisher: publisher,
		Status:    status,
	}, nil
}

// noticeUpdateRequest 用于公告的部分字段更新。
type noticeUpdateRequest struct {
	Title     *string `json:"title" binding:"omitempty,max=128"`
	Content   *string `json:"content"`
	Publisher *string `json:"publisher" binding:"omitempty,max=64"`
	Status    *string `json:"status" binding:"omitempty,max=32"`
}

// Updates 把公告更新请求转换成 map，供 service 层直接传给 GORM。
func (r noticeUpdateRequest) Updates() (map[string]any, error) {
	updates := map[string]any{}

	if r.Title != nil {
		value, err := normalizeRequiredString(*r.Title, "title", 128)
		if err != nil {
			return nil, err
		}
		updates["title"] = value
	}
	if r.Content != nil {
		value, err := normalizeRequiredString(*r.Content, "content", 0)
		if err != nil {
			return nil, err
		}
		updates["content"] = value
	}
	if r.Publisher != nil {
		value, err := normalizeOptionalString(*r.Publisher, "publisher", 64)
		if err != nil {
			return nil, err
		}
		updates["publisher"] = value
	}
	if r.Status != nil {
		value, err := normalizeRequiredString(*r.Status, "status", 32)
		if err != nil {
			return nil, err
		}
		updates["status"] = value
	}

	return finalizeUpdates(updates)
}

// finalizeUpdates 负责拦截空更新。
// 如果一个更新请求最终没有产生任何可落库字段，就直接返回错误，
// 避免接口看似成功，实际什么都没改。
func finalizeUpdates(updates map[string]any) (map[string]any, error) {
	if len(updates) == 0 {
		return nil, errNoFieldsToUpdate
	}
	return updates, nil
}

// normalizeRequiredString 用于处理必填字符串字段。
// 它会先 trim，再检查是否为空以及是否超长。
func normalizeRequiredString(value, field string, maxLen int) (string, error) {
	normalized := strings.TrimSpace(value)
	if normalized == "" {
		return "", fmt.Errorf("%s is required", field)
	}
	if maxLen > 0 && len(normalized) > maxLen {
		return "", fmt.Errorf("%s must be at most %d characters", field, maxLen)
	}
	return normalized, nil
}

// normalizeOptionalString 用于处理可选字符串字段。
// 它允许值为空，但仍然会限制最大长度，避免异常长文本进入数据库。
func normalizeOptionalString(value, field string, maxLen int) (string, error) {
	normalized := strings.TrimSpace(value)
	if maxLen > 0 && len(normalized) > maxLen {
		return "", fmt.Errorf("%s must be at most %d characters", field, maxLen)
	}
	return normalized, nil
}

// normalizeDefaultedString 用于“可选但有默认值”的字符串字段。
// 如果调用方没传值，就回退到默认值；如果传了值，则继续做长度校验。
func normalizeDefaultedString(value, field, fallback string, maxLen int) (string, error) {
	normalized := strings.TrimSpace(value)
	if normalized == "" {
		return fallback, nil
	}
	if maxLen > 0 && len(normalized) > maxLen {
		return "", fmt.Errorf("%s must be at most %d characters", field, maxLen)
	}
	return normalized, nil
}

// normalizeEmail 单独处理邮箱字段。
// 不把邮箱校验完全交给 tag，是为了兼顾“可以清空邮箱”和“格式必须合法”这两个需求。
func normalizeEmail(value string) (string, error) {
	normalized, err := normalizeOptionalString(value, "email", 128)
	if err != nil {
		return "", err
	}
	if normalized == "" {
		return "", nil
	}

	parsed, err := mail.ParseAddress(normalized)
	if err != nil || parsed.Address != normalized {
		return "", fmt.Errorf("email must be a valid email address")
	}
	return normalized, nil
}
