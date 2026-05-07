package service

import (
	"crypto-arbitrage/internal/feed"
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
	feeRate        = 0.001 // 0.1% per trade
	slippageBuffer = 0.05  // %
	latencyBuffer  = 0.05  // %
	minTradeSize   = 10.0  // minimum qty (adjust per asset)
	maxCapital     = 50.0  // safer capital
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

			if buyEx == sellEx {
				continue
			}

			if buyEx == "kucoin" || sellEx == "kucoin" {
				continue
			}

			//  STALE DATA CHECK
			if now-buyOB.Time > 1000 || now-sellOB.Time > 1000 {
				continue
			}

			if len(buyOB.Asks) == 0 || len(sellOB.Bids) == 0 {
				continue
			}

			//  SIMULATE DEPTH-AWARE BUY
			avgBuy, qty := simulateBuy(buyOB.Asks, maxCapital)
			if qty <= 0 || qty < minTradeSize {
				continue
			}

			// SIMULATE SELL
			avgSell := simulateSell(sellOB.Bids, qty)
			if avgSell == 0 {
				continue
			}

			// RAW SPREAD
			rawSpread := ((avgSell - avgBuy) / avgBuy) * 100

			// FEES
			totalFees := 2 * feeRate * 100

			//  NET SPREAD
			netSpread := rawSpread - totalFees - slippageBuffer - latencyBuffer

			log.Printf("[REAL] %s %s→%s raw=%.4f%% net=%.4f%%",
				symbol, buyEx, sellEx, rawSpread, netSpread)

			//  NOT PROFITABLE
			if netSpread <= 0 {
				continue
			}

			// INVENTORY CHECK
			if !hasInventory(buyEx, sellEx, symbol, qty, avgBuy) {
				log.Println("BLOCKED: insufficient inventory")
				continue
			}

			// LOCK (avoid duplicate trades)
			if !lock(symbol) {
				continue
			}

			opportunityCount++

			log.Printf("OPPORTUNITY #%d %s %s→%s %.4f%%",
				opportunityCount, symbol, buyEx, sellEx, netSpread)

			go func() {
				defer unlock(symbol)
				executeTrade(symbol, buyEx, sellEx, qty)
			}()
		}
	}
}
