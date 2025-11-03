package models

import (
	"time"

	"gorm.io/gorm"
)

// Article represents a blog article
type Article struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Title     string         `gorm:"not null;size:200" json:"title"`
	Content   string         `gorm:"type:text;not null" json:"content"`
	Summary   string         `gorm:"size:500" json:"summary"`
	UserID    uint           `gorm:"not null" json:"user_id"`
	User      User           `gorm:"foreignKey:UserID" json:"user"`
	Status    int            `gorm:"default:1" json:"status"` // 1: draft, 2: published
	ViewCount uint           `gorm:"default:0" json:"view_count"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	
	// 关联标签
	Tags []Tag `gorm:"many2many:article_tags;" json:"tags"`
}

// TableName specifies the table name for Article
func (Article) TableName() string {
	return "articles"
}

// BeforeCreate hook to generate summary
func (a *Article) BeforeCreate(tx *gorm.DB) error {
	// 如果没有提供摘要，从内容中截取前200个字符
	if a.Summary == "" && len(a.Content) > 0 {
		if len(a.Content) > 200 {
			a.Summary = a.Content[:200] + "..."
		} else {
			a.Summary = a.Content
		}
	}
	return nil
}

// BeforeUpdate hook to update summary if needed
func (a *Article) BeforeUpdate(tx *gorm.DB) error {
	// 如果内容更新了但摘要未提供，重新生成摘要
	if a.Summary == "" && len(a.Content) > 0 {
		if len(a.Content) > 200 {
			a.Summary = a.Content[:200] + "..."
		} else {
			a.Summary = a.Content
		}
	}
	return nil
}