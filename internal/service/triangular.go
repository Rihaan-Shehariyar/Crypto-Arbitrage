package service

import (
	"crypto-arbitrage/broker"
	"crypto-arbitrage/internal/feed"
	"log"
)

func handleTriangular(b broker.Broker) {

	usdt := 100.0

	for _, t := range triangles {

		p1 := feed.GetBestPrice(t.Base + t.Quote)
		p2 := feed.GetBestPrice(t.Alt + t.Base)
		p3 := feed.GetBestPrice(t.Alt + t.Quote)

		if p1 == nil || p2 == nil || p3 == nil {
			continue
		}

		baseQty := usdt / p1.Ask
		altQty := baseQty / p2.Ask
		final := altQty * p3.Bid

		profit := final - usdt
		percent := (profit / usdt) * 100

		if percent <= 0 {
			continue
		}

		log.Printf("🔺 TRI %s-%s profit=%.4f (%.3f%%)",
			t.Base, t.Alt, profit, percent,
		)

		go executeTriangularDynamic(b, t, usdt)
	}
}

func executeTriangularDynamic(b broker.Broker, t Triangle, usdt float64) {

	if Simulate {
		log.Printf("[SIM TRI] %s-%s cycle executed", t.Base, t.Alt)
		return
	}

	buy1, err := b.MarketBuy(t.Base+"USDT", usdt)
	if err != nil {
		return
	}

	info1, ok := waitForExecution(b, t.Base+"USDT", buy1, 0)
	if !ok {
		return
	}

	buy2, err := b.MarketBuy(t.Alt+t.Base, info1.FilledQty)
	if err != nil {
		return
	}

	info2, ok := waitForExecution(b, t.Alt+t.Base, buy2, 0)
	if !ok {
		return
	}

	sell, err := b.MarketSell(t.Alt+"USDT", info2.FilledQty)
	if err != nil {
		return
	}

	waitForExecution(b, t.Alt+"USDT", sell, info2.FilledQty)
}
