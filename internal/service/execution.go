package service

import (
	"crypto-arbitrage/broker"
	"crypto-arbitrage/internal/feed"
	"log"
)

func executeTrade(symbol string, buy, sell feed.Price, qty float64, brokers map[string]broker.Broker) {

	if Simulate {
		log.Printf("[SIM] %s BUY %s → SELL %s qty=%.6f",
			symbol, buy.Exchange, sell.Exchange, qty)
		return
	}

	buyBroker := brokers[buy.Exchange]
	sellBroker := brokers[sell.Exchange]

	orderId, err := buyBroker.MarketBuy(symbol, tradeCapital)
	if err != nil {
		log.Println("BUY error:", err)
		return
	}

	buyInfo, ok := waitForExecution(buyBroker, symbol, orderId, qty)
	if !ok {
		return
	}

	sellOrder, err := sellBroker.MarketSell(symbol, buyInfo.FilledQty)
	if err != nil {
		log.Println("SELL error:", err)
		return
	}

	waitForExecution(sellBroker, symbol, sellOrder, buyInfo.FilledQty)
}