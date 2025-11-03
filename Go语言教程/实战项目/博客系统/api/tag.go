package api

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"blog/models"
	"gorm.io/gorm"
)

// CreateTagRequest represents the request body for creating a tag
type CreateTagRequest struct {
	Name string `json:"name" binding:"required,min=1,max=50"`
}

// CreateTagHandler handles creating a new tag
func CreateTagHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateTagRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Check if tag already exists
		var existingTag models.Tag
		if err := db.Where("name = ?", req.Name).First(&existingTag).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Tag already exists"})
			return
		}

		// Create tag
		tag := models.Tag{
			Name: req.Name,
		}

		if err := db.Create(&tag).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create tag"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "Tag created successfully",
			"tag":     tag,
		})
	}
}

// GetTagsHandler handles getting a list of tags
func GetTagsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get query parameters
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

		// Set default values
		if page <= 0 {
			page = 1
		}
		if pageSize <= 0 {
			pageSize = 20
		}
		if pageSize > 100 {
			pageSize = 100 // Limit maximum page size
		}

		// Count total tags
		var total int64
		db.Model(&models.Tag{}).Count(&total)

		// Fetch tags with pagination
		var tags []models.Tag
		offset := (page - 1) * pageSize
		if err := db.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&tags).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tags"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"tags": tags,
			"pagination": map[string]interface{}{
				"page":      page,
				"page_size": pageSize,
				"total":     total,
				"pages":     (int(total) + pageSize - 1) / pageSize,
			},
		})
	}
}

// GetTagHandler handles getting a single tag by ID
func GetTagHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get tag ID from URL parameter
		tagID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tag ID"})
			return
		}

		// Find tag
		var tag models.Tag
		if err := db.Preload("Articles.User").First(&tag, tagID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Tag not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tag"})
			return
		}

		c.JSON(http.StatusOK, tag)
	}
}

// GetTagArticlesHandler handles getting articles for a specific tag
func GetTagArticlesHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get tag ID from URL parameter
		tagID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tag ID"})
			return
		}

		// Check if tag exists
		var tag models.Tag
		if err := db.First(&tag, tagID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Tag not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tag"})
			return
		}

		// Get query parameters
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

		// Set default values
		if page <= 0 {
			page = 1
		}
		if pageSize <= 0 {
			pageSize = 10
		}
		if pageSize > 100 {
			pageSize = 100 // Limit maximum page size
		}

		// Count total articles for this tag
		var total int64
		db.Model(&models.Article{}).
			Joins("JOIN article_tags ON articles.id = article_tags.article_id").
			Where("article_tags.tag_id = ?", tagID).
			Where("articles.status = ?", 2). // Only published articles
			Count(&total)

		// Fetch articles with pagination
		var articles []models.Article
		offset := (page - 1) * pageSize
		if err := db.Preload("User").Preload("Tags").
			Joins("JOIN article_tags ON articles.id = article_tags.article_id").
			Where("article_tags.tag_id = ?", tagID).
			Where("articles.status = ?", 2). // Only published articles
			Offset(offset).Limit(pageSize).Order("articles.created_at DESC").
			Find(&articles).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch articles"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"articles": articles,
			"pagination": map[string]interface{}{
				"page":      page,
				"page_size": pageSize,
				"total":     total,
				"pages":     (int(total) + pageSize - 1) / pageSize,
			},
		})
	}
}

// UpdateTagRequest represents the request body for updating a tag
type UpdateTagRequest struct {
	Name string `json:"name" binding:"required,min=1,max=50"`
}

// UpdateTagHandler handles updating a tag
func UpdateTagHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get tag ID from URL parameter
		tagID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tag ID"})
			return
		}

		var req UpdateTagRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Check if tag exists
		var tag models.Tag
		if err := db.First(&tag, tagID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Tag not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tag"})
			return
		}

		// Check if new name already exists
		if req.Name != tag.Name {
			var existingTag models.Tag
			if err := db.Where("name = ?", req.Name).First(&existingTag).Error; err == nil {
				c.JSON(http.StatusConflict, gin.H{"error": "Tag name already exists"})
				return
			}
		}

		// Update tag
		if err := db.Model(&tag).Update("name", req.Name).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tag"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Tag updated successfully",
			"tag":     tag,
		})
	}
}

// DeleteTagHandler handles deleting a tag
func DeleteTagHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get tag ID from URL parameter
		tagID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tag ID"})
			return
		}

		// Check if tag exists
		var tag models.Tag
		if err := db.First(&tag, tagID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Tag not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tag"})
			return
		}

		// Delete tag (this will also remove associations due to cascade delete)
		if err := db.Delete(&tag).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete tag"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Tag deleted successfully"})
	}
}