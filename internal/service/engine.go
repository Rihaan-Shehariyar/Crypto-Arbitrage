package service

import (
	"context"
	"crypto-arbitrage/broker"
	"crypto-arbitrage/internal/feed"
	"log"
	"time"
)

type Mode string

const (
	Cross      Mode = "cross"
	Triangular Mode = "triangular"
)

var (
	lastRun     = make(map[string]int64)
	lastPrint   = make(map[string]int64)
	CurrentMode = Cross
	Simulate    = true
)

// Engine config
const (
	minIntervalMs   = 300  // throttle per symbol
	printIntervalMs = 2000 // log OB count every 2s
)

// StartEngine runs the core arbitrage loop
func StartEngine(ctx context.Context, f *feed.Feed, brokers map[string]broker.Broker) {

	log.Println("🚀 Engine Started")

	for {
		select {

		case <-ctx.Done():
			log.Println("🛑 Engine stopped")
			return

		case p := <-f.Stream:

			symbol := p.Symbol
			now := time.Now().UnixMilli()

			// -------------------------
			// 🔒 THROTTLE PER SYMBOL
			// -------------------------
			mu.Lock()
			last, ok := lastRun[symbol]
			if ok && now-last < minIntervalMs {
				mu.Unlock()
				continue
			}
			lastRun[symbol] = now
			mu.Unlock()

			// -------------------------
			// 📊 ORDERBOOK CHECK
			// -------------------------
			orderBooks := feed.GetOrderBooks(symbol)

			if orderBooks == nil || len(orderBooks) < 2 {
				continue
			}

			// -------------------------
			// 🧾 PRINT STATUS (every 2s)
			// -------------------------
			mu.Lock()
			lastP, ok := lastPrint[symbol]
			if !ok || now-lastP > printIntervalMs {
				log.Printf("📊 OB COUNT: %s %d", symbol, len(orderBooks))
				lastPrint[symbol] = now
			}
			mu.Unlock()

			// -------------------------
			// 🔄 RUN STRATEGY
			// -------------------------
			switch CurrentMode {

			case Cross:
				handleCross(symbol)

			case Triangular:
				// handleTriangular()

			default:
				log.Println("⚠️ Unknown mode")
			}
		}
	}
}
