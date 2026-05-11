package service

import (
	"context"
	"crypto-arbitrage/broker"
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/metrics"
	"log"
	"sync"
	"time"
)

type Mode string

const (
	Cross      Mode = "cross"
	Triangular Mode = "triangular"
)

var (
	mu          sync.RWMutex
	lastRun     = make(map[string]int64)
	lastPrint   = make(map[string]int64)
	CurrentMode = Cross
	Simulate    = true
)

// -----------------------------------
// ENGINE CONFIG
// -----------------------------------

const (
	minIntervalMs   = 300
	printIntervalMs = 2000
)

// -----------------------------------
// START ENGINE
// -----------------------------------

func StartEngine(
	ctx context.Context,
	userID string,
	f *feed.Feed,
	brokers map[string]broker.Broker,
) {

	log.Printf(
		"[ENGINE] started for user %s",
		userID,
	)

	for {

		select {

		// -----------------------------------
		// STOP ENGINE
		// -----------------------------------

		case <-ctx.Done():

			log.Printf(
				"[ENGINE] stopped for user %s",
				userID,
			)

			return

		// -----------------------------------
		// MARKET STREAM
		// -----------------------------------

		case p := <-f.Stream:

			log.Printf(
				"[PRICE] %-8s %-10s | Bid: %.8f | Ask: %.8f",
				p.Exchange,
				p.Symbol,
				p.Bid,
				p.Ask,
			)

			symbol := p.Symbol

			now := time.Now().UnixMilli()

			// -----------------------------------
			// THROTTLE PER SYMBOL
			// -----------------------------------

			mu.Lock()

			last, ok := lastRun[symbol]

			if ok &&
				now-last < minIntervalMs {

				mu.Unlock()

				continue
			}

			lastRun[symbol] = now

			mu.Unlock()

			// -----------------------------------
			// ORDERBOOK CHECK
			// -----------------------------------

			orderBooks :=
				feed.GetOrderBooks(symbol)

			if orderBooks == nil ||
				len(orderBooks) < 2 {

				continue
			}

			// -----------------------------------
			// PRINT STATUS
			// -----------------------------------

			mu.Lock()

			lastP, ok := lastPrint[symbol]

			if !ok ||
				now-lastP > printIntervalMs {

				log.Printf(
					"📊 OB COUNT: %s %d",
					symbol,
					len(orderBooks),
				)

				lastPrint[symbol] = now
			}

			mu.Unlock()

			// -----------------------------------
			// RUN STRATEGY
			// -----------------------------------

			switch CurrentMode {

			case Cross:

				handleCross(
					userID,
					symbol,
				)

			case Triangular:

				// handleTriangular(
				//     userID,
				// )

			default:

				log.Println(
					"[ENGINE] unknown mode",
				)

				metrics.IncEngineErrors()
			}
		}
	}
}
