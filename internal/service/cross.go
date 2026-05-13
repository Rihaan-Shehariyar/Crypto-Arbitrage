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

	log.Printf(
		"[CROSS] evaluating %s for user %s",
		symbol,
		userID,
	)

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

	log.Printf(
		"[CROSS] orderbooks for %s = %d",
		symbol,
		len(orderBooks),
	)

	if orderBooks == nil ||
		len(orderBooks) < 2 {

		log.Printf(
			"[CROSS] insufficient orderbooks for %s",
			symbol,
		)

		return
	}

	now := time.Now().UnixMilli()

	// -----------------------------------
	// LOOP EXCHANGES
	// -----------------------------------

	for buyEx, buyOB := range orderBooks {

		for sellEx, sellOB := range orderBooks {

			log.Printf(
				"[CROSS] compare %s -> %s",
				buyEx,
				sellEx,
			)

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

				log.Printf(
					"[CROSS] stale buy book %s",
					buyEx,
				)

				continue
			}

			if now-sellOB.Time > 3000 {

				metrics.StaleBooks.Inc()

				log.Printf(
					"[CROSS] stale sell book %s",
					sellEx,
				)

				continue
			}

			// -----------------------------------
			// EMPTY CHECK
			// -----------------------------------

			log.Printf(
				"[CROSS] %s asks=%d | %s bids=%d",
				buyEx,
				len(buyOB.Asks),
				sellEx,
				len(sellOB.Bids),
			)

			if len(buyOB.Asks) == 0 {

				log.Printf(
					"[CROSS] empty asks on %s",
					buyEx,
				)

				continue
			}

			if len(sellOB.Bids) == 0 {

				log.Printf(
					"[CROSS] empty bids on %s",
					sellEx,
				)

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

				log.Printf(
					"[CROSS] invalid qty on buy %s",
					buyEx,
				)

				continue
			}

			tradeValue :=
				qty * avgBuy

			if tradeValue < minTradeValue {

				log.Printf(
					"[CROSS] trade value too low %.4f",
					tradeValue,
				)

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

				log.Printf(
					"[CROSS] invalid sell on %s",
					sellEx,
				)

				continue
			}

			// -----------------------------------
			// PRICES
			// -----------------------------------

			log.Printf(
				"[CROSS] prices buy=%.4f sell=%.4f",
				avgBuy,
				avgSell,
			)

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

			log.Printf(
				"[CHECK] %s %s→%s | raw=%.4f%% net=%.4f%%",
				symbol,
				buyEx,
				sellEx,
				rawSpread,
				netSpread,
			)

			// -----------------------------------
			// PROFITABLE?
			// -----------------------------------

			if netSpread <= 0 {

				log.Printf(
					"[CROSS] not profitable",
				)

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

				log.Printf(
					"[CROSS] symbol locked %s",
					symbol,
				)

				continue
			}

			opportunityCount++

			tradeID :=
				uuid.NewString()

			log.Printf(
				"[TRADE:%s] OPPORTUNITY #%d | %s | BUY %s → SELL %s | NET %.4f%%",
				tradeID,
				opportunityCount,
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

				log.Printf(
					"[TRADE:%s] PAPER EXECUTION",
					tradeID,
				)

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

				log.Printf(
					"[TRADE:%s] CLOSED | %s | %.4f USDT (%.4f%%) | %d ms",
					tradeID,
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
