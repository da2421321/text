package model

import "time"

// BaseModel 抽取了所有表都会重复出现的公共字段。
// 这样每个业务模型只关心自己的业务字段，主键和时间戳由基类统一维护。
type BaseModel struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// User 表示后台登录账户。
// 当前系统没有开放注册，所以它主要承担“管理员登录”和“角色承载”两个作用。
type User struct {
	BaseModel
	Username     string `json:"username" gorm:"uniqueIndex;size:64;not null"`
	PasswordHash string `json:"-" gorm:"size:255;not null"`
	Role         string `json:"role" gorm:"size:32;not null;default:admin"`
}

// Organization 表示商会组织主体。
// 它是会员的上游资源，很多业务都会围绕组织展开。
type Organization struct {
	BaseModel
	Name    string `json:"name" gorm:"size:128;not null;uniqueIndex"`
	Code    string `json:"code" gorm:"size:64;not null;uniqueIndex"`
	Contact string `json:"contact" gorm:"size:64"`
	Phone   string `json:"phone" gorm:"size:32"`
}

// Member 表示会员实体。
// 它通过 OrganizationID 关联到组织，当前设计里一个会员必须属于一个组织。
type Member struct {
	BaseModel
	Name           string        `json:"name" gorm:"size:128;not null"`
	MemberType     string        `json:"member_type" gorm:"size:32;not null;default:enterprise"`
	OrganizationID uint          `json:"organization_id" gorm:"index;not null"`
	Organization   *Organization `json:"organization,omitempty" gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Phone          string        `json:"phone" gorm:"size:32"`
	Email          string        `json:"email" gorm:"size:128"`
	Status         string        `json:"status" gorm:"size:32;not null;default:active"`
}

// Activity 表示商会活动。
// 这里保存活动标题、时间范围、地点和状态，是一个相对独立的业务对象。
type Activity struct {
	BaseModel
	Title       string    `json:"title" gorm:"size:128;not null"`
	Description string    `json:"description" gorm:"type:text"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	Location    string    `json:"location" gorm:"size:255"`
	Status      string    `json:"status" gorm:"size:32;not null;default:draft"`
}

// FeeBill 表示会费单。
// 它依附于会员，用来记录某个会员在某个年度的应收会费及支付状态。
type FeeBill struct {
	BaseModel
	MemberID uint    `json:"member_id" gorm:"index;not null"`
	Member   *Member `json:"member,omitempty" gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Year     int     `json:"year" gorm:"index;not null"`
	Amount   int64   `json:"amount" gorm:"not null"`
	Status   string  `json:"status" gorm:"size:32;not null;default:unpaid"`
	Remark   string  `json:"remark" gorm:"size:255"`
}

// Notice 表示后台发布的公告。
// 目前公告和其他资源没有强关联，设计上属于独立内容模块。
type Notice struct {
	BaseModel
	Title     string `json:"title" gorm:"size:128;not null"`
	Content   string `json:"content" gorm:"type:text;not null"`
	Publisher string `json:"publisher" gorm:"size:64"`
	Status    string `json:"status" gorm:"size:32;not null;default:published"`
}
