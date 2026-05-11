package handler

import (
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/metrics"
	"net/http"

	"github.com/gin-gonic/gin"
)

func UserMetricsHandler(
	c *gin.Context,
) {

	userAny, exists := c.Get(
		"user",
	)

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
		userAny.(auth.User)

	m :=
		metrics.GetUserMetrics(
			user.ID,
		)

	c.JSON(
		http.StatusOK,
		gin.H{

			"total_trades": m.TotalTrades,

			"closed_trades": m.ClosedTrades,

			"failed_trades": m.FailedTrades,

			"opportunities": m.TotalOpportunities,

			"profit_usdt": m.ProfitUSDT,
		},
	)
}
