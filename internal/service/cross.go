package service

import (
	"crypto-arbitrage/internal/events"
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/inventory"
	"crypto-arbitrage/internal/journal"
	"crypto-arbitrage/internal/metrics"
	"crypto-arbitrage/internal/paper"
	"crypto-arbitrage/internal/risk"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

var tradeLock sync.Map

func lock(
	userID string,
	symbol string,
) bool {

	key :=
		userID + ":" + symbol

	_, loaded :=
		tradeLock.LoadOrStore(
			key,
			true,
		)

	return !loaded
}

func unlock(
	userID string,
	symbol string,
) {

	key :=
		userID + ":" + symbol

	tradeLock.Delete(key)
}

const (
	feeRate        = 0.001 // 0.1%
	slippageBuffer = 0.05  // %
	latencyBuffer  = 0.05  // %

	minTradeValue = 10.0

	maxCapital = 50.0
)

var opportunityCount int

func handleCross(
	userID string,
	symbol string,
) {

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

			// -----------------------------------
			// SAME EXCHANGE
			// -----------------------------------

			if buyEx == sellEx {
				continue
			}

			// -----------------------------------
			// STALE DATA
			// -----------------------------------

			if now-buyOB.Time > 1000 ||
				now-sellOB.Time > 1000 {

				metrics.IncStaleBooks()

				continue
			}

			// -----------------------------------
			// EMPTY ORDERBOOK
			// -----------------------------------

			if len(buyOB.Asks) == 0 ||
				len(sellOB.Bids) == 0 {

				continue
			}

			// -----------------------------------
			// DEPTH-AWARE BUY
			// -----------------------------------

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

			// -----------------------------------
			// DEPTH-AWARE SELL
			// -----------------------------------

			avgSell := simulateSell(
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
				continue
			}

			// -----------------------------------
			// USER METRICS
			// -----------------------------------

			userMetrics := metrics.GetUserMetrics(
				userID,
			)

			userMetrics.TotalOpportunities++

			// -----------------------------------
			// RISK VALIDATION
			// -----------------------------------

			err := risk.ValidateTrade(

				risk.TradeRequest{

					Symbol: symbol,

					BuyExchange:  buyEx,
					SellExchange: sellEx,

					BuyPrice:  avgBuy,
					SellPrice: avgSell,

					Quantity: qty,

					Spread: netSpread,

					Capital: tradeValue,
				},
			)

			if err != nil {

				log.Printf(
					"[RISK BLOCKED] %v",
					err,
				)

				continue
			}

			// -----------------------------------
			// INVENTORY CHECK
			// -----------------------------------

			baseAsset :=
				strings.TrimSuffix(
					symbol,
					"USDT",
				)

			if !inventory.HasInventory(

				buyEx,
				sellEx,

				baseAsset,

				tradeValue,
				qty,
			) {

				log.Printf(
					"[INVENTORY BLOCKED] %s",
					symbol,
				)

				continue
			}

			// -----------------------------------
			// LOCK SYMBOL
			// -----------------------------------

			if !lock(
				userID,
				symbol,
			) {
				continue
			}

			opportunityCount++

			tradeID := uuid.NewString()

			// -----------------------------------
			// CREATE TRADE
			// -----------------------------------

			trade := paper.Trade{

				ID: tradeID,

				UserID: userID,

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

			userMetrics.TotalTrades++

			// -----------------------------------
			// JOURNAL
			// -----------------------------------

			journal.Add(
				trade.ID,
				"OPPORTUNITY",
				"arbitrage opportunity detected",
			)

			// -----------------------------------
			// PUBLISH EVENT
			// -----------------------------------

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

			log.Printf(
				"[TRADE:%s] 🔥 OPPORTUNITY #%d | %s | BUY %s → SELL %s | NET %.4f%%",
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
				userID string,
				trade paper.Trade,
				symbol string,
				buyEx string,
				sellEx string,
				avgBuy float64,
				avgSell float64,
				qty float64,
				tradeValue float64,
				baseAsset string,
			) {

				defer unlock(
					userID,
					symbol,
				)
				start := time.Now()

				log.Printf(
					"[TRADE:%s] 🧪 PAPER EXECUTION %s | BUY %s → SELL %s",
					trade.ID,
					symbol,
					buyEx,
					sellEx,
				)

				// -----------------------------------
				// BUYING
				// -----------------------------------

				trade.Status =
					paper.StatusBuying

				paper.UpdateTrade(trade)

				journal.Add(
					trade.ID,
					"BUYING",
					"paper buy started",
				)

				// -----------------------------------
				// INVENTORY UPDATE (BUY)
				// -----------------------------------

				inventory.SubInventory(
					buyEx,
					"USDT",
					tradeValue,
				)

				inventory.AddInventory(
					buyEx,
					baseAsset,
					qty,
				)

				// -----------------------------------
				// PAPER BUY
				// -----------------------------------

				paper.Buy(
					symbol,
					avgBuy,
					maxCapital,
				)

				// -----------------------------------
				// BUY FILLED
				// -----------------------------------

				trade.Status =
					paper.StatusBuyFilled

				paper.UpdateTrade(trade)

				journal.Add(
					trade.ID,
					"BUY_FILLED",
					"buy completed",
				)

				time.Sleep(
					500 * time.Millisecond,
				)

				// -----------------------------------
				// SELLING
				// -----------------------------------

				trade.Status =
					paper.StatusSelling

				paper.UpdateTrade(trade)

				journal.Add(
					trade.ID,
					"SELLING",
					"paper sell started",
				)

				// -----------------------------------
				// INVENTORY UPDATE (SELL)
				// -----------------------------------

				inventory.SubInventory(
					sellEx,
					baseAsset,
					qty,
				)

				inventory.AddInventory(
					sellEx,
					"USDT",
					qty*avgSell,
				)

				// -----------------------------------
				// PAPER SELL
				// -----------------------------------

				paper.Sell(
					symbol,
					avgSell,
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

				// -----------------------------------
				// CLOSED
				// -----------------------------------

				trade.ProfitUSDT =
					profitUSDT

				trade.ProfitPercent =
					profitPercent

				trade.Status =
					paper.StatusClosed

				trade.LatencyMs =
					duration.Milliseconds()

				paper.UpdateTrade(trade)

				journal.Add(
					trade.ID,
					"CLOSED",
					"trade closed successfully",
				)

				userMetrics.ClosedTrades++

				userMetrics.ProfitUSDT +=
					profitUSDT

				log.Printf(
					"[TRADE:%s] ✅ CLOSED | %s | PnL %.4f USDT (%.4f%%) | %d ms",
					trade.ID,
					symbol,
					profitUSDT,
					profitPercent,
					duration.Milliseconds(),
				)

			}(userID,
				trade,
				symbol,
				buyEx,
				sellEx,
				avgBuy,
				avgSell,
				qty,
				tradeValue,
				baseAsset,
			)
		}
	}
}
