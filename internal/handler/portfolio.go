package handler

import (
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/db"
	"crypto-arbitrage/internal/inventory"
	"crypto-arbitrage/internal/paper"
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
	// INVENTORY
	// -----------------------------------

	balances :=
		inventory.GetUserInventory(
			user.ID,
		)

	// -----------------------------------
	// TRADES
	// -----------------------------------

	var trades []paper.Trade

	db.DB.
		Where(
			"user_id = ?",
			user.ID,
		).
		Find(&trades)

	// -----------------------------------
	// AGGREGATE
	// -----------------------------------

	var totalProfit float64

	for _, t := range trades {

		totalProfit +=
			t.ProfitUSDT
	}

	// -----------------------------------
	// RESPONSE
	// -----------------------------------

	c.JSON(
		http.StatusOK,
		PortfolioResponse{

			TotalProfitUSDT: totalProfit,

			TotalTrades: len(trades),

			Balances: balances,
		},
	)
}
