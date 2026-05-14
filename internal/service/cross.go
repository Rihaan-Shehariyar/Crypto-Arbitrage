package service

import (
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/metrics"
	"crypto-arbitrage/internal/paper"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
)

var tradeLock sync.Map

// -----------------------------------
// LOCK
// -----------------------------------

func lock(symbol string) bool {

	_, loaded :=
		tradeLock.LoadOrStore(
			symbol,
			true,
		)

	return !loaded
}

func unlock(symbol string) {

	tradeLock.Delete(symbol)
}

// -----------------------------------
// CONFIG
// -----------------------------------

const (
	feeRate        = 0.001 // 0.1%
	slippageBuffer = 0.05  // %
	latencyBuffer  = 0.05  // %

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

	// -----------------------------------
	// METRICS
	// -----------------------------------

	metrics.ArbitrageChecks.Inc()

	metrics.WorkerQueueDepth.Set(
		float64(len(CrossJobs)),
	)

	// -----------------------------------
	// GET ORDERBOOKS
	// -----------------------------------

	orderBooks :=
		feed.GetOrderBooks(symbol)

	if orderBooks == nil ||
		len(orderBooks) < 2 {

		return
	}

	now := time.Now().UnixMilli()

	// -----------------------------------
	// LOOP EXCHANGES
	// -----------------------------------

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

			if netSpread <= 0 {
				continue
			}

			metrics.ProfitableSpreads.Inc()

			// -----------------------------------
			// USER METRICS
			// -----------------------------------

			userMetrics :=
				metrics.GetUserMetrics(userID)

			userMetrics.TotalOpportunities++

			// -----------------------------------
			// LOCK
			// -----------------------------------

			if !lock(symbol) {
				continue
			}

			opportunityCount++

			tradeID :=
				uuid.NewString()

			// -----------------------------------
			// REAL OPPORTUNITY LOG
			// -----------------------------------

			log.Printf(
				"⚡ ARB %s | BUY %s → SELL %s | NET %.4f%%",
				symbol,
				buyEx,
				sellEx,
				netSpread,
			)

			// -----------------------------------
			// EXECUTION
			// -----------------------------------

			go func(
				tradeID string,
				symbol string,
				buyEx string,
				sellEx string,
				avgBuy float64,
				avgSell float64,
				qty float64,
			) {

				defer unlock(symbol)

				start := time.Now()

				// BUY

				paper.Buy(
					symbol,
					avgBuy,
					maxCapital,
				)

				time.Sleep(
					500 * time.Millisecond,
				)

				// SELL

				paper.Sell(
					symbol,
					avgSell,
				)

				// PROFIT

				profitUSDT :=
					(avgSell - avgBuy) * qty

				profitPercent :=
					((avgSell - avgBuy) / avgBuy) * 100

				duration :=
					time.Since(start)

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

				// -----------------------------------
				// TRADE CLOSED LOG
				// -----------------------------------

				log.Printf(
					"✅ TRADE CLOSED | %s | %.4f USDT (%.4f%%) | %d ms",
					symbol,
					profitUSDT,
					profitPercent,
					duration.Milliseconds(),
				)

			}(
				tradeID,
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
