package handler

import (
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/redis"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func HeartbeatHandler(c *gin.Context) {

	userValue, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized",
		})
		return
	}

	user := userValue.(auth.User)
	key := "heartbeat:" + user.ID

	err := redis.Client.Set(redis.Ctx, key, "alive", 30*time.Second).Err()

	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "heartbeat failed",
			},
		)
		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
		},
	)

}
