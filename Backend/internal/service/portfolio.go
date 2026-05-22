package service

import (
	"crypto-arbitrage/internal/db"
	"crypto-arbitrage/internal/inventory"
	"crypto-arbitrage/internal/paper"
	"crypto-arbitrage/internal/websocket"
)

func BuildPortfolioPayload(
	userID string,
) websocket.PortfolioPayload {

	balances :=
		inventory.GetUserInventory(
			userID,
		)

	var trades []paper.Trade

	db.DB.
		Where(
			"user_id = ?",
			userID,
		).
		Find(&trades)

	var totalProfit float64

	for _, t := range trades {

		totalProfit +=
			t.ProfitUSDT
	}

	return websocket.PortfolioPayload{

		TotalProfitUSDT: totalProfit,

		TotalTrades: len(trades),

		Balances: balances,
	}
}
