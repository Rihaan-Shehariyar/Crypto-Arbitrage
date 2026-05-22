package handler

import (
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/db"
	"net/http"

	"github.com/gin-gonic/gin"
)

type AnalyticsResponse struct {
	TotalProfit float64 `json:"total_profit"`

	TotalTrades int64 `json:"total_trades"`

	AvgProfit float64 `json:"avg_profit"`

	AvgSpread float64 `json:"avg_spread"`

	AvgLatency float64 `json:"avg_latency"`

	BestSymbol string `json:"best_symbol"`

	BestExchangePair string `json:"best_exchange_pair"`
}

func AnalyticsHandler(
	c *gin.Context,
) {

	// -----------------------------------
	// AUTH
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

	var totalProfit float64

	var totalTrades int64

	var avgProfit float64

	var avgSpread float64

	var avgLatency float64

	// -----------------------------------
	// TOTAL PROFIT
	// -----------------------------------

	db.DB.Raw(`
		SELECT COALESCE(SUM(profit_usdt),0)
		FROM trades
		WHERE user_id = ?
	`, user.ID).
		Scan(&totalProfit)

	// -----------------------------------
	// TOTAL TRADES
	// -----------------------------------

	db.DB.Raw(`
		SELECT COUNT(*)
		FROM trades
		WHERE user_id = ?
	`, user.ID).
		Scan(&totalTrades)

	// -----------------------------------
	// AVG PROFIT
	// -----------------------------------

	db.DB.Raw(`
		SELECT COALESCE(AVG(profit_usdt),0)
		FROM trades
		WHERE user_id = ?
	`, user.ID).
		Scan(&avgProfit)

	// -----------------------------------
	// AVG SPREAD
	// -----------------------------------

	db.DB.Raw(`
		SELECT COALESCE(AVG(spread_percent),0)
		FROM opportunities
		WHERE user_id = ?
	`, user.ID).
		Scan(&avgSpread)

	// -----------------------------------
	// AVG LATENCY
	// -----------------------------------

	db.DB.Raw(`
		SELECT COALESCE(AVG(latency_ms),0)
		FROM trades
		WHERE user_id = ?
	`, user.ID).
		Scan(&avgLatency)

	// -----------------------------------
	// BEST SYMBOL
	// -----------------------------------

	var bestSymbol string

	db.DB.Raw(`
		SELECT symbol
		FROM trades
		WHERE user_id = ?
		GROUP BY symbol
		ORDER BY SUM(profit_usdt) DESC
		LIMIT 1
	`, user.ID).
		Scan(&bestSymbol)

	// -----------------------------------
	// BEST EXCHANGE PAIR
	// -----------------------------------

	var bestPair string

	db.DB.Raw(`
		SELECT buy_exchange || ' -> ' || sell_exchange
		FROM trades
		WHERE user_id = ?
		GROUP BY buy_exchange, sell_exchange
		ORDER BY SUM(profit_usdt) DESC
		LIMIT 1
	`, user.ID).
		Scan(&bestPair)

	// -----------------------------------
	// RESPONSE
	// -----------------------------------

	c.JSON(
		http.StatusOK,
		AnalyticsResponse{

			TotalProfit: totalProfit,

			TotalTrades: totalTrades,

			AvgProfit: avgProfit,

			AvgSpread: avgSpread,

			AvgLatency: avgLatency,

			BestSymbol: bestSymbol,

			BestExchangePair: bestPair,
		},
	)
}
