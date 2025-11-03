package models

import (
	"time"

	"gorm.io/gorm"
)

// Tag represents a tag for categorizing articles
type Tag struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"uniqueIndex;not null;size:50" json:"name"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	
	// 关联文章
	Articles []Article `gorm:"many2many:article_tags;" json:"articles"`
}

// TableName specifies the table name for Tag
func (Tag) TableName() string {
	return "tags"
}