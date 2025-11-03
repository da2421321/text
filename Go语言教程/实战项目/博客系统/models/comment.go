package models

import (
	"time"

	"gorm.io/gorm"
)

// Comment represents a comment on an article
type Comment struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Content   string         `gorm:"type:text;not null" json:"content"`
	UserID    uint           `gorm:"not null" json:"user_id"`
	User      User           `gorm:"foreignKey:UserID" json:"user"`
	ArticleID uint           `gorm:"not null" json:"article_id"`
	Article   Article        `gorm:"foreignKey:ArticleID" json:"article"`
	ParentID  *uint          `json:"parent_id,omitempty"` // For nested comments
	Parent    *Comment       `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children  []Comment      `gorm:"foreignKey:ParentID" json:"children,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for Comment
func (Comment) TableName() string {
	return "comments"
}