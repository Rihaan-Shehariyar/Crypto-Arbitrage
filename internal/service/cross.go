package service

import (
	"crypto-arbitrage/internal/events"
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/paper"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
)

var tradeLock sync.Map

func lock(symbol string) bool {

	_, loaded := tradeLock.LoadOrStore(
		symbol,
		true,
	)

	return !loaded
}

func unlock(symbol string) {

	tradeLock.Delete(symbol)
}

const (
	feeRate        = 0.001 // 0.1%
	slippageBuffer = 0.05  // %
	latencyBuffer  = 0.05  // %

	minTradeValue = 10.0 // minimum USDT trade

	maxCapital = 50.0 // paper capital
)

var opportunityCount int

func handleCross(symbol string) {

	orderBooks := feed.GetOrderBooks(
		symbol,
	)

	if orderBooks == nil ||
		len(orderBooks) < 2 {

		return
	}

	now := time.Now().UnixMilli()

	for buyEx, buyOB := range orderBooks {

		for sellEx, sellOB := range orderBooks {

			// -------------------------
			// SAME EXCHANGE
			// -------------------------

			if buyEx == sellEx {
				continue
			}

			// -------------------------
			// STALE DATA
			// -------------------------

			if now-buyOB.Time > 1000 ||
				now-sellOB.Time > 1000 {

				continue
			}

			// -------------------------
			// EMPTY BOOK
			// -------------------------

			if len(buyOB.Asks) == 0 ||
				len(sellOB.Bids) == 0 {

				continue
			}

			// -------------------------
			// DEPTH-AWARE BUY
			// -------------------------

			avgBuy, qty := simulateBuy(
				buyOB.Asks,
				maxCapital,
			)

			if qty <= 0 {
				continue
			}

			tradeValue := qty * avgBuy

			if tradeValue < minTradeValue {
				continue
			}

			// -------------------------
			// DEPTH-AWARE SELL
			// -------------------------

			avgSell := simulateSell(
				sellOB.Bids,
				qty,
			)

			if avgSell == 0 {
				continue
			}

			// -------------------------
			// SPREAD
			// -------------------------

			rawSpread :=
				((avgSell - avgBuy) / avgBuy) * 100

			totalFees :=
				2 * feeRate * 100

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

			// -------------------------
			// PROFITABLE?
			// -------------------------

			if netSpread <= 0 {
				continue
			}

			events.Bus <- events.Event{

				Type: "OPPORTUNITY",

				Data: events.OpportunityEvent{

					Symbol: symbol,

					BuyExchange:  buyEx,
					SellExchange: sellEx,

					BuyPrice:  avgBuy,
					SellPrice: avgSell,

					Spread: netSpread,

					ProfitUSDT: (avgSell - avgBuy) * qty,

					Time: time.Now().UnixMilli(),
				},
			}
			// -------------------------
			// LOCK SYMBOL
			// -------------------------

			if !lock(symbol) {
				continue
			}

			opportunityCount++

			tradeID := uuid.NewString()

			// -------------------------
			// CREATE TRADE
			// -------------------------

			trade := paper.Trade{

				ID: tradeID,

				Symbol: symbol,

				BuyExchange:  buyEx,
				SellExchange: sellEx,

				BuyPrice:  avgBuy,
				SellPrice: avgSell,

				Quantity: qty,

				Status: paper.StatusPending,

				Time: time.Now(),
			}

			paper.AddTrade(trade)

			log.Printf(
				"[TRADE:%s] 🔥 OPPORTUNITY #%d | %s | BUY %s → SELL %s | NET %.4f%%",
				tradeID,
				opportunityCount,
				symbol,
				buyEx,
				sellEx,
				netSpread,
			)

			// -------------------------
			// PAPER EXECUTION
			// -------------------------

			go func(
				trade paper.Trade,
				symbol string,
				buyEx string,
				sellEx string,
				avgBuy float64,
				avgSell float64,
				qty float64,
			) {

				defer unlock(symbol)

				start := time.Now()

				log.Printf(
					"[TRADE:%s] 🧪 PAPER EXECUTION %s | BUY %s → SELL %s",
					trade.ID,
					symbol,
					buyEx,
					sellEx,
				)

				// -------------------------
				// BUYING
				// -------------------------

				trade.Status = paper.StatusBuying

				paper.UpdateTrade(trade)

				// -------------------------
				// PAPER BUY
				// -------------------------

				paper.Buy(
					symbol,
					avgBuy,
					maxCapital,
				)

				// -------------------------
				// BUY FILLED
				// -------------------------

				trade.Status = paper.StatusBuyFilled

				paper.UpdateTrade(trade)

				// simulate latency
				time.Sleep(
					500 * time.Millisecond,
				)

				// -------------------------
				// SELLING
				// -------------------------

				trade.Status = paper.StatusSelling

				paper.UpdateTrade(trade)

				// -------------------------
				// PAPER SELL
				// -------------------------

				paper.Sell(
					symbol,
					avgSell,
				)

				// -------------------------
				// PROFIT
				// -------------------------

				profitUSDT :=
					(avgSell - avgBuy) * qty

				profitPercent :=
					((avgSell - avgBuy) / avgBuy) * 100

				duration :=
					time.Since(start)

				// -------------------------
				// CLOSED
				// -------------------------

				trade.ProfitUSDT =
					profitUSDT

				trade.ProfitPercent =
					profitPercent

				trade.Status =
					paper.StatusClosed

				trade.LatencyMs =
					duration.Milliseconds()

				paper.UpdateTrade(trade)

				// -------------------------
				// FINAL LOG
				// -------------------------

				log.Printf(
					"[TRADE:%s] ✅ CLOSED | %s | PnL %.4f USDT (%.4f%%) | %d ms",
					trade.ID,
					symbol,
					profitUSDT,
					profitPercent,
					duration.Milliseconds(),
				)

			}(
				trade,
				symbol,
				buyEx,
				sellEx,
				avgBuy,
				avgSell,
				qty,
			)
		}
	}
}
