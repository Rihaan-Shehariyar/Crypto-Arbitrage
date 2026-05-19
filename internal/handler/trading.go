package handler

import (
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/db"
	"crypto-arbitrage/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

func StartTradingHandler(
	c *gin.Context,
) {

	userValue, exists := c.Get("user")

	if !exists {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"error": "unauthorized",
			},
		)

		return
	}

	user := userValue.(auth.User)

	user.TradingEnabled = true

	err := db.DB.Save(&user).Error

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "failed to enable trading",
			},
		)

		return
	}

	service.RefreshUsers()

	c.JSON(
		http.StatusOK,
		gin.H{
			"message": "trading started",
		},
	)
}
func StopTradingHandler(
	c *gin.Context,
) {

	userValue, exists := c.Get("user")

	if !exists {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"error": "unauthorized",
			},
		)

		return
	}

	user := userValue.(auth.User)

	user.TradingEnabled = false

	err := db.DB.Save(&user).Error

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "failed to stop trading",
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"message": "trading stopped",
		},
	)
}
