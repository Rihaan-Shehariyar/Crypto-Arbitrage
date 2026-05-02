package service

import (
	"crypto-arbitrage/internal/feed"
	"log"
)

const (
	tradeCapital = 100.0
	feeRate      = 0.001 // 0.1% per trade
	minSpread    = 0.2   // % threshold
)

func handleCross(symbol string) {

	orderBooks := feed.GetOrderBooks(symbol)

	if orderBooks == nil {
		return
	}

	// Need at least 2 exchanges
	if len(orderBooks) < 2 {
		return
	}

	for buyEx, buyOB := range orderBooks {

		for sellEx, sellOB := range orderBooks {

			if buyEx == sellEx {
				continue
			}

			// 🔥 Ignore exchanges without execution support
			if buyEx == "kucoin" || sellEx == "kucoin" {
				continue
			}

			if len(buyOB.Asks) == 0 || len(sellOB.Bids) == 0 {
				continue
			}

			// Best prices
			buyPrice := buyOB.Asks[0].Price
			sellPrice := sellOB.Bids[0].Price

			if buyPrice <= 0 || sellPrice <= 0 {
				continue
			}

			// Quantity based on capital
			qty := tradeCapital / buyPrice

			// Apply fees
			cost := qty * buyPrice * (1 + feeRate)
			revenue := qty * sellPrice * (1 - feeRate)

			profit := revenue - cost

			percent := (profit / cost) * 100

			// 🔍 Debug log (keep for now)
			log.Printf("[CROSS CHECK] %s | %s → %s | %.5f%%",
				symbol, buyEx, sellEx, percent,
			)

			// 🔥 Real filter
			if percent < minSpread {
				continue
			}

			// 🔥 VALID ARBITRAGE
			log.Printf(
				"🔥 ARB %s | BUY %s → SELL %s | %.3f%%",
				symbol,
				buyEx,
				sellEx,
				percent,
			)

			// Execute
			go executeTrade(symbol, buyEx, sellEx, qty)
		}
	}
}
