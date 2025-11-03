package api

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"blog/models"
	"gorm.io/gorm"
)

// GetUserHandler handles getting a user by ID
func GetUserHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user ID from URL parameter
		userID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}

		// Find user
		var user models.User
		if err := db.Select("id", "username", "email", "nickname", "avatar", "created_at", "updated_at").First(&user, userID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
			return
		}

		c.JSON(http.StatusOK, user)
	}
}

// UpdateUserRequest represents the request body for updating a user
type UpdateUserRequest struct {
	Nickname string `json:"nickname"`
	Avatar   string `json:"avatar"`
}

// UpdateUserHandler handles updating a user
func UpdateUserHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user ID from URL parameter
		userID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}

		// Get authenticated user ID from context
		authUserID, exists := c.Get("user_id")
		if !exists || authUserID != uint(userID) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You can only update your own profile"})
			return
		}

		var req UpdateUserRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Update user
		updates := make(map[string]interface{})
		if req.Nickname != "" {
			updates["nickname"] = req.Nickname
		}
		if req.Avatar != "" {
			updates["avatar"] = req.Avatar
		}

		if err := db.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
			return
		}

		// Fetch updated user
		var updatedUser models.User
		if err := db.Select("id", "username", "email", "nickname", "avatar", "created_at", "updated_at").First(&updatedUser, userID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated user"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "User updated successfully",
			"user":    updatedUser,
		})
	}
}