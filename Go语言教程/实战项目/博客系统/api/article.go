package api

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"blog/models"
	"gorm.io/gorm"
)

// CreateArticleRequest represents the request body for creating an article
type CreateArticleRequest struct {
	Title   string `json:"title" binding:"required,min=1,max=200"`
	Content string `json:"content" binding:"required"`
	Summary string `json:"summary" binding:"max=500"`
	Status  int    `json:"status" binding:"oneof=1 2"` // 1: draft, 2: published
	TagIDs  []uint `json:"tag_ids"`
}

// CreateArticleHandler handles creating a new article
func CreateArticleHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get authenticated user ID from context
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		var req CreateArticleRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Set default status to draft if not provided
		if req.Status == 0 {
			req.Status = 1 // draft
		}

		// Create article
		article := models.Article{
			Title:   req.Title,
			Content: req.Content,
			Summary: req.Summary,
			UserID:  userID.(uint),
			Status:  req.Status,
		}

		// Handle tags
		if len(req.TagIDs) > 0 {
			var tags []models.Tag
			if err := db.Where("id IN ?", req.TagIDs).Find(&tags).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tags"})
				return
			}
			article.Tags = tags
		}

		if err := db.Create(&article).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create article"})
			return
		}

		// Preload user and tags for response
		if err := db.Preload("User").Preload("Tags").First(&article, article.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch created article"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "Article created successfully",
			"article": article,
		})
	}
}

// GetArticlesRequest represents the query parameters for getting articles
type GetArticlesRequest struct {
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
	Status   int    `form:"status"`
	TagID    uint   `form:"tag_id"`
	Search   string `form:"search"`
}

// GetArticlesHandler handles getting a list of articles
func GetArticlesHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req GetArticlesRequest
		if err := c.ShouldBindQuery(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Set default values
		if req.Page <= 0 {
			req.Page = 1
		}
		if req.PageSize <= 0 {
			req.PageSize = 10
		}
		if req.PageSize > 100 {
			req.PageSize = 100 // Limit maximum page size
		}

		// Build query
		query := db.Model(&models.Article{}).Preload("User").Preload("Tags")

		// Filter by status
		if req.Status > 0 {
			query = query.Where("status = ?", req.Status)
		}

		// Filter by tag
		if req.TagID > 0 {
			query = query.Joins("JOIN article_tags ON articles.id = article_tags.article_id").
				Where("article_tags.tag_id = ?", req.TagID)
		}

		// Search by title or content
		if req.Search != "" {
			query = query.Where("title LIKE ? OR content LIKE ?", "%"+req.Search+"%", "%"+req.Search+"%")
		}

		// Count total records
		var total int64
		query.Count(&total)

		// Apply pagination and ordering
		var articles []models.Article
		offset := (req.Page - 1) * req.PageSize
		if err := query.Offset(offset).Limit(req.PageSize).Order("created_at DESC").Find(&articles).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch articles"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"articles": articles,
			"pagination": map[string]interface{}{
				"page":      req.Page,
				"page_size": req.PageSize,
				"total":     total,
				"pages":     (int(total) + req.PageSize - 1) / req.PageSize,
			},
		})
	}
}

// GetArticleHandler handles getting a single article by ID
func GetArticleHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get article ID from URL parameter
		articleID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid article ID"})
			return
		}

		// Find article with user and tags
		var article models.Article
		if err := db.Preload("User").Preload("Tags").First(&article, articleID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch article"})
			return
		}

		// Increment view count
		db.Model(&article).Update("view_count", gorm.Expr("view_count + 1"))

		c.JSON(http.StatusOK, article)
	}
}

// UpdateArticleRequest represents the request body for updating an article
type UpdateArticleRequest struct {
	Title   string `json:"title" binding:"max=200"`
	Content string `json:"content"`
	Summary string `json:"summary" binding:"max=500"`
	Status  int    `json:"status" binding:"oneof=1 2"`
	TagIDs  []uint `json:"tag_ids"`
}

// UpdateArticleHandler handles updating an article
func UpdateArticleHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get article ID from URL parameter
		articleID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid article ID"})
			return
		}

		// Get authenticated user ID from context
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		// Find article
		var article models.Article
		if err := db.First(&article, articleID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch article"})
			return
		}

		// Check if user is the author
		if article.UserID != userID.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You can only update your own articles"})
			return
		}

		var req UpdateArticleRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Update article
		updates := make(map[string]interface{})
		if req.Title != "" {
			updates["title"] = req.Title
		}
		if req.Content != "" {
			updates["content"] = req.Content
		}
		if req.Summary != "" {
			updates["summary"] = req.Summary
		}
		if req.Status > 0 {
			updates["status"] = req.Status
		}

		if err := db.Model(&article).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update article"})
			return
		}

		// Handle tags if provided
		if req.TagIDs != nil {
			// Clear existing tags
			if err := db.Model(&article).Association("Tags").Clear(); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tags"})
				return
			}

			// Add new tags
			if len(req.TagIDs) > 0 {
				var tags []models.Tag
				if err := db.Where("id IN ?", req.TagIDs).Find(&tags).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tags"})
					return
				}
				if err := db.Model(&article).Association("Tags").Append(&tags); err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tags"})
					return
				}
			}
		}

		// Fetch updated article with associations
		if err := db.Preload("User").Preload("Tags").First(&article, article.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated article"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Article updated successfully",
			"article": article,
		})
	}
}

// DeleteArticleHandler handles deleting an article
func DeleteArticleHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get article ID from URL parameter
		articleID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid article ID"})
			return
		}

		// Get authenticated user ID from context
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		// Find article
		var article models.Article
		if err := db.First(&article, articleID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch article"})
			return
		}

		// Check if user is the author
		if article.UserID != userID.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own articles"})
			return
		}

		// Delete article (soft delete)
		if err := db.Delete(&article).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete article"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Article deleted successfully"})
	}
}