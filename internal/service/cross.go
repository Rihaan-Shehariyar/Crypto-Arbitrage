package service

import (
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/inventory"
	"crypto-arbitrage/internal/metrics"
	"crypto-arbitrage/internal/opportunity"
	"crypto-arbitrage/internal/paper"
	"crypto-arbitrage/internal/risk"
	"crypto-arbitrage/internal/websocket"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

var tradeLock sync.Map

// -----------------------------------
// LOCK
// -----------------------------------

func lock(key string) bool {

	_, loaded :=
		tradeLock.LoadOrStore(
			key,
			true,
		)

	return !loaded
}

func unlock(key string) {

	tradeLock.Delete(key)
}

// -----------------------------------
// CONFIG
// -----------------------------------

const (
	feeRate        = 0.0002 // 0.001%
	slippageBuffer = 0.01   // % 0.05
	latencyBuffer  = 0.01   // % 0.05

	minTradeValue = 10.0

	maxCapital = 50.0
)

var opportunityCount int

// -----------------------------------
// HANDLE CROSS
// -----------------------------------

func handleCross(
	userID string,
	symbol string,
) {

	metrics.ArbitrageChecks.Inc()

	metrics.WorkerQueueDepth.Set(
		float64(len(CrossJobs)),
	)

	orderBooks :=
		feed.GetOrderBooks(symbol)

	if len(orderBooks) < 2 {

		return
	}

	now := time.Now().UnixMilli()

	// -----------------------------------
	// BASE ASSET
	// -----------------------------------

	baseAsset :=
		strings.TrimSuffix(
			symbol,
			"USDT",
		)

	for buyEx, buyOB := range orderBooks {

		for sellEx, sellOB := range orderBooks {

			// -----------------------------------
			// SAME EXCHANGE
			// -----------------------------------

			if buyEx == sellEx {
				continue
			}

			// -----------------------------------
			// STALE CHECK
			// -----------------------------------

			if now-buyOB.Time > 3000 {

				metrics.StaleBooks.Inc()

				continue
			}

			if now-sellOB.Time > 3000 {

				metrics.StaleBooks.Inc()

				continue
			}

			// -----------------------------------
			// EMPTY CHECK
			// -----------------------------------

			if len(buyOB.Asks) == 0 {
				continue
			}

			if len(sellOB.Bids) == 0 {
				continue
			}

			// -----------------------------------
			// DEPTH BUY
			// -----------------------------------

			avgBuy, qty :=
				simulateBuy(
					buyOB.Asks,
					maxCapital,
				)

			if qty <= 0 {
				continue
			}

			tradeValue :=
				qty * avgBuy

			if tradeValue < minTradeValue {
				continue
			}

			// -----------------------------------
			// DEPTH SELL
			// -----------------------------------

			avgSell :=
				simulateSell(
					sellOB.Bids,
					qty,
				)

			if avgSell == 0 {
				continue
			}

			// -----------------------------------
			// SPREAD
			// -----------------------------------

			rawSpread :=
				((avgSell - avgBuy) / avgBuy) * 100

			totalFees :=
				2 * feeRate * 100

			netSpread :=
				rawSpread -
					totalFees -
					slippageBuffer -
					latencyBuffer

			// -----------------------------------
			// PROFITABLE?
			// -----------------------------------

			if netSpread <= -0.05 {

				log.Printf(
					"❌ SPREAD FAIL %s | %.4f%%",
					symbol,
					netSpread,
				)
				continue
			}

			// -----------------------------------
			// INVENTORY CHECK
			// -----------------------------------

			if !inventory.HasInventory(

				userID,

				buyEx,
				sellEx,

				baseAsset,

				tradeValue,

				qty,
			) {
				log.Printf(
					"❌ INVENTORY FAIL %s | %s -> %s",
					symbol,
					buyEx,
					sellEx,
				)

				continue
			}

			metrics.ProfitableSpreads.Inc()

			go opportunity.Save(
				opportunity.Opportunity{

					UserID: userID,

					Symbol: symbol,

					BuyExchange: buyEx,

					SellExchange: sellEx,

					BuyPrice: avgBuy,

					SellPrice: avgSell,

					SpreadPercent: netSpread,

					EstimatedProfit: (avgSell - avgBuy) * qty,

					LatencyMs: 0,
				},
			)

			websocket.Broadcast(
				"OPPORTUNITY_FOUND",
				map[string]interface{}{
					"symbol": symbol,

					"buy_exchange": buyEx,

					"sell_exchange": sellEx,

					"spread_percent": netSpread,

					"buy_price": avgBuy,

					"sell_price": avgSell,

					"timestamp": time.Now().UnixMilli(),
				},
			)

			userMetrics :=
				metrics.GetUserMetrics(userID)

			userMetrics.TotalOpportunities++

			// -----------------------------------
			// USER + SYMBOL LOCK
			// -----------------------------------

			lockKey :=
				userID + ":" + symbol

			if !lock(lockKey) {
				continue
			}

			log.Printf(
				"🔒 LOCK ACQUIRED %s",
				symbol,
			)

			defer func() {

				unlock(lockKey)

				log.Printf(
					"🔓 LOCK RELEASED %s",
					symbol,
				)

			}()

			if !risk.AllowTrade(

				userID,

				tradeValue,

				netSpread,
			) {
				log.Printf(
					"❌ RISK FAIL %s | %.4f%%",
					symbol,
					netSpread)

				continue
			}

			opportunityCount++

			tradeID :=
				uuid.NewString()

			log.Printf(
				"ARB %s | USER %s | BUY %s → SELL %s | NET %.4f%%",
				symbol,
				userID,
				buyEx,
				sellEx,
				netSpread,
			)

			// -----------------------------------
			// EXECUTION
			// -----------------------------------
			risk.OpenTrade(
				userID,
				tradeValue,
			)
			go func(
				tradeID string,
				symbol string,
				buyEx string,
				sellEx string,
				baseAsset string,
				avgBuy float64,
				avgSell float64,
				qty float64,
				tradeValue float64,
			) {

				defer unlock(lockKey)

				start := time.Now()

				// -----------------------------------
				// BUY
				// -----------------------------------

				paper.Buy(
					symbol,
					avgBuy,
					maxCapital,
				)

				// INVENTORY UPDATE

				inventory.SubInventory(
					userID,
					buyEx,
					"USDT",
					tradeValue,
				)

				inventory.AddInventory(
					userID,
					buyEx,
					baseAsset,
					qty,
				)

				time.Sleep(
					500 * time.Millisecond,
				)

				// -----------------------------------
				// SELL
				// -----------------------------------

				paper.Sell(
					symbol,
					avgSell,
				)

				// INVENTORY UPDATE

				inventory.SubInventory(
					userID,
					sellEx,
					baseAsset,
					qty,
				)

				inventory.AddInventory(
					userID,
					sellEx,
					"USDT",
					qty*avgSell,
				)

				websocket.BroadcastToUser(
					"PORTFOLIO_UPDATED",
					userID,
					map[string]interface{}{
						"user_id": userID,
					},
				)

				// -----------------------------------
				// PROFIT
				// -----------------------------------

				profitUSDT :=
					(avgSell - avgBuy) * qty

				profitPercent :=
					((avgSell - avgBuy) / avgBuy) * 100

				duration :=
					time.Since(start)

				risk.CloseTrade(
					userID,
					tradeValue,
					profitUSDT,
				)

				// -----------------------------------
				// USER METRICS
				// -----------------------------------

				userMetrics :=
					metrics.GetUserMetrics(userID)

				userMetrics.TotalTrades++

				userMetrics.ClosedTrades++

				userMetrics.ProfitUSDT +=
					profitUSDT

				// -----------------------------------
				// STORE
				// -----------------------------------

				paper.AddTrade(
					paper.Trade{

						ID: tradeID,

						UserID: userID,

						Symbol: symbol,

						BuyExchange: buyEx,

						SellExchange: sellEx,

						BuyPrice: avgBuy,

						SellPrice: avgSell,

						Quantity: qty,

						ProfitUSDT: profitUSDT,

						ProfitPercent: profitPercent,

						Status: "CLOSED",

						LatencyMs: duration.Milliseconds(),

						Time: time.Now(),
					},
				)

				websocket.BroadcastToUser(
					"TRADE_EXECUTED",
					userID,
					map[string]interface{}{

						"id": tradeID,

						"user_id": userID,

						"symbol": symbol,

						"buy_exchange": buyEx,

						"sell_exchange": sellEx,

						"profit_usdt": profitUSDT,

						"profit_percent": profitPercent,

						"latency_ms": duration.Milliseconds(),

						"timestamp": time.Now().UnixMilli(),
					},
				)

				log.Printf(
					"✅ TRADE CLOSED | USER %s | %s | %.4f USDT (%.4f%%)",
					userID,
					symbol,
					profitUSDT,
					profitPercent,
				)

			}(
				tradeID,
				symbol,
				buyEx,
				sellEx,
				baseAsset,
				avgBuy,
				avgSell,
				qty,
				tradeValue,
			)

		}
	}
}
