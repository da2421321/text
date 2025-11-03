package api

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"blog/models"
	"gorm.io/gorm"
)

// CreateCommentRequest represents the request body for creating a comment
type CreateCommentRequest struct {
	Content  string `json:"content" binding:"required,min=1"`
	ParentID *uint  `json:"parent_id"`
}

// CreateCommentHandler handles creating a new comment
func CreateCommentHandler(db *gorm.DB) gin.HandlerFunc {
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

		var req CreateCommentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Check if article exists
		var article models.Article
		if err := db.First(&article, articleID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch article"})
			return
		}

		// Check if parent comment exists (for nested comments)
		if req.ParentID != nil {
			var parentComment models.Comment
			if err := db.First(&parentComment, req.ParentID).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					c.JSON(http.StatusNotFound, gin.H{"error": "Parent comment not found"})
					return
				}
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch parent comment"})
				return
			}
			
			// Ensure parent comment belongs to the same article
			if parentComment.ArticleID != uint(articleID) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Parent comment does not belong to this article"})
				return
			}
		}

		// Create comment
		comment := models.Comment{
			Content:   req.Content,
			UserID:    userID.(uint),
			ArticleID: uint(articleID),
			ParentID:  req.ParentID,
		}

		if err := db.Create(&comment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
			return
		}

		// Preload associations for response
		if err := db.Preload("User").Preload("Parent").First(&comment, comment.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch created comment"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "Comment created successfully",
			"comment": comment,
		})
	}
}

// GetCommentsHandler handles getting comments for an article
func GetCommentsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get article ID from URL parameter
		articleID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid article ID"})
			return
		}

		// Check if article exists
		var article models.Article
		if err := db.First(&article, articleID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch article"})
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

		// Count total comments
		var total int64
		db.Model(&models.Comment{}).Where("article_id = ?", articleID).Count(&total)

		// Fetch comments with pagination
		var comments []models.Comment
		offset := (page - 1) * pageSize
		if err := db.Preload("User").Preload("Parent").Preload("Children.User").
			Where("article_id = ? AND parent_id IS NULL", articleID).
			Offset(offset).Limit(pageSize).Order("created_at DESC").
			Find(&comments).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"comments": comments,
			"pagination": map[string]interface{}{
				"page":      page,
				"page_size": pageSize,
				"total":     total,
				"pages":     (int(total) + pageSize - 1) / pageSize,
			},
		})
	}
}

// DeleteCommentHandler handles deleting a comment
func DeleteCommentHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get comment ID from URL parameter
		commentID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
			return
		}

		// Get authenticated user ID from context
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		// Find comment
		var comment models.Comment
		if err := db.Preload("Article").First(&comment, commentID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comment"})
			return
		}

		// Check if user is the author or the author of the article
		if comment.UserID != userID.(uint) && comment.Article.UserID != userID.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own comments or comments on your articles"})
			return
		}

		// Delete comment and all its children (cascade delete)
		if err := db.Delete(&models.Comment{}, commentID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Comment deleted successfully"})
	}
}