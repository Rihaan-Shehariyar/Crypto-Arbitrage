package service

import (
	"crypto-arbitrage/broker"
	"crypto-arbitrage/internal/feed"
	"log"
)

const tradeCapital = 10.0

func handleCross(symbol string, brokers map[string]broker.Broker) {

	prices := feed.GetPrices(symbol)
	if len(prices) < 2 {
		return
	}

	orderBooks := feed.GetOrderBooks(symbol)
	if orderBooks == nil {
		return
	}

	bestPercent := -999.0
	var bestBuy, bestSell feed.Price
	var bestQty float64

	for _, buy := range prices {
		for _, sell := range prices {

			if buy.Exchange == sell.Exchange {
				continue
			}

			buyOB, ok1 := orderBooks[buy.Exchange]
			sellOB, ok2 := orderBooks[sell.Exchange]

			if !ok1 || !ok2 {
				continue
			}

			avgBuy, qty := simulateBuy(buyOB.Asks, tradeCapital)
			if avgBuy == 0 || qty == 0 {
				continue
			}

			avgSell := simulateSell(sellOB.Bids, qty)
			if avgSell == 0 {
				continue
			}

			profit := (avgSell * qty) - tradeCapital
			percent := (profit / tradeCapital) * 100

			if percent > bestPercent {
				bestPercent = percent
				bestBuy = buy
				bestSell = sell
				bestQty = qty
			}
		}
	}

	if bestPercent <= 0 {
		return
	}

	log.Printf("🔥 ARB %s | BUY %s → SELL %s | %.3f%%",
		symbol, bestBuy.Exchange, bestSell.Exchange, bestPercent,
	)

	go executeTrade(symbol, bestBuy, bestSell, bestQty, brokers)
}