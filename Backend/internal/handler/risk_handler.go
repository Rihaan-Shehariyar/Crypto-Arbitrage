package handler

import (
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/risk"
	"net/http"

	"github.com/gin-gonic/gin"
)

func RiskMetricsHandler(
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

	metrics :=
		risk.GetMetrics(
			user.ID,
		)

	c.JSON(
		http.StatusOK,
		metrics,
	)
}	