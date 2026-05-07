package service

import (
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/paper"
	"log"
	"sync"
	"time"
)

var tradeLock sync.Map

func lock(symbol string) bool {
	_, loaded := tradeLock.LoadOrStore(symbol, true)
	return !loaded
}

func unlock(symbol string) {
	tradeLock.Delete(symbol)
}

const (
	feeRate        = 0.001 // 0.1%
	slippageBuffer = 0.05  // %
	latencyBuffer  = 0.05  // %
	minTradeValue  = 10.0  // minimum USDT trade
	maxCapital     = 50.0  // paper trade capital
)

var opportunityCount int

func handleCross(symbol string) {

	orderBooks := feed.GetOrderBooks(symbol)

	if orderBooks == nil || len(orderBooks) < 2 {
		return
	}

	now := time.Now().UnixMilli()

	for buyEx, buyOB := range orderBooks {

		for sellEx, sellOB := range orderBooks {

			// SAME EXCHANGE

			if buyEx == sellEx {
				continue
			}

			// STALE DATA CHECK

			if now-buyOB.Time > 1000 ||
				now-sellOB.Time > 1000 {

				continue
			}

			// EMPTY ORDERBOOK

			if len(buyOB.Asks) == 0 ||
				len(sellOB.Bids) == 0 {

				continue
			}

			// DEPTH-AWARE BUY

			avgBuy, qty := simulateBuy(
				buyOB.Asks,
				maxCapital,
			)

			if qty <= 0 {
				continue
			}

			// minimum trade value
			tradeValue := qty * avgBuy

			if tradeValue < minTradeValue {
				continue
			}

			// DEPTH-AWARE SELL

			avgSell := simulateSell(
				sellOB.Bids,
				qty,
			)

			if avgSell == 0 {
				continue
			}

			// RAW SPREAD

			rawSpread :=
				((avgSell - avgBuy) / avgBuy) * 100

			// FEES

			totalFees := 2 * feeRate * 100

			// FINAL NET SPREAD

			netSpread :=
				rawSpread -
					totalFees -
					slippageBuffer -
					latencyBuffer

			log.Printf(
				"[CHECK] %s %s→%s | raw=%.4f%% net=%.4f%%",
				symbol,
				buyEx,
				sellEx,
				rawSpread,
				netSpread,
			)

			// NOT PROFITABLE

			if netSpread <= -100 {
				continue
			}

			// INVENTORY CHECK

			// if !hasInventory(
			// 	buyEx,
			// 	sellEx,
			// 	symbol,
			// 	qty,
			// 	avgBuy,
			// ) {

			// 	log.Println(
			// 		"BLOCKED: insufficient inventory",
			// 	)

			// 	continue
			// }

			// -------------------------
			// LOCK SYMBOL
			// -------------------------

			if !lock(symbol) {
				continue
			}

			opportunityCount++

			// OPPORTUNITY FOUND

			log.Printf(
				"OPPORTUNITY #%d | %s | BUY %s → SELL %s | NET %.4f%%",
				opportunityCount,
				symbol,
				buyEx,
				sellEx,
				netSpread,
			)

			// PAPER TRADE

			go func(
				symbol string,
				buyEx string,
				sellEx string,
				avgBuy float64,
				avgSell float64,
			) {

				defer unlock(symbol)

				log.Printf(
					"PAPER EXECUTION %s | BUY %s → SELL %s",
					symbol,
					buyEx,
					sellEx,
				)

				// PAPER BUY
				paper.Buy(
					symbol,
					avgBuy,
					maxCapital,
				)

				// simulate small execution delay
				time.Sleep(500 * time.Millisecond)

				// PAPER SELL
				paper.Sell(
					symbol,
					avgSell,
				)

				profitUSDT :=
					(avgSell - avgBuy) * qty

				profitPercent :=
					((avgSell - avgBuy) / avgBuy) * 100

				paper.AddTrade(
					paper.Trade{
						Symbol: symbol,

						BuyExchange:  buyEx,
						SellExchange: sellEx,

						BuyPrice:  avgBuy,
						SellPrice: avgSell,

						Quantity: qty,

						ProfitUSDT:    profitUSDT,
						ProfitPercent: profitPercent,

						Status: "CLOSED",

						Time: time.Now(),
					},
				)
				log.Printf(
					"✅PAPER TRADE CLOSED | %s | PnL %.4f USDT (%.4f%%)",
					symbol,
					profitUSDT,
					profitPercent,
				)

			}(
				symbol,
				buyEx,
				sellEx,
				avgBuy,
				avgSell,
			)
		}
	}
}
