package handler

import (
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type PortfolioResponse struct {
	TotalProfitUSDT float64 `json:"total_profit_usdt"`

	TotalTrades int `json:"total_trades"`

	Balances map[string]map[string]float64 `json:"balances"`
}

func PortfolioHandler(
	c *gin.Context,
) {

	// -----------------------------------
	// AUTH USER
	// -----------------------------------

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

	// -----------------------------------
	// BUILD PAYLOAD
	// -----------------------------------

	payload :=
		service.BuildPortfolioPayload(
			user.ID,
		)

	// -----------------------------------
	// RESPONSE
	// -----------------------------------

	c.JSON(
		http.StatusOK,
		payload,
	)
}
