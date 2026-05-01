package service

import (
	"context"
	"crypto-arbitrage/broker"
	"crypto-arbitrage/internal/feed"
	"log"
)

type Mode string

const (
	Cross      Mode = "cross"
	Triangular Mode = "triangular"
)

var CurrentMode = Cross
var Simulate = true

func StartEngine(ctx context.Context, f *feed.Feed, brokers map[string]broker.Broker) {

	go func() {
		log.Println("🚀 Engine Started")

		for {
			select {

			case <-ctx.Done():
				return

			case p := <-f.Stream:
				feed.UpdatePrice(p)

				switch CurrentMode {

				case Cross:
					handleCross(p.Symbol, brokers)

				case Triangular:
					handleTriangular(brokers["binance"])
				}
			}
		}
	}()
}
