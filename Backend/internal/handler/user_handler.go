package handler

import (
	"crypto-arbitrage/internal/auth"
	"net/http"

	"github.com/gin-gonic/gin"
)

func MeHandler(
	c *gin.Context,
) {

	userValue, exists :=
		c.Get("user")

	if !exists {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"error": "unauthorized",
			},
		)

		return
	}

	user :=
		userValue.(auth.User)

	c.JSON(
		http.StatusOK,
		gin.H{

			"id": user.ID,

			"name": user.Name,

			"email": user.Email,

			"subscription_active": user.SubscriptionActive,

			"trading_enabled": user.TradingEnabled,
		},
	)
}
