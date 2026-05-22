package service

import (
	"log"
)

func executeTrade(symbol, buyEx, sellEx string, qty float64) {

	log.Printf(" EXECUTION %s %s→%s qty=%.6f",
		symbol, buyEx, sellEx, qty)

	if qty <= 0 {
		return
	}

	//  LIMIT SIZE (extra safety)
	if symbol == "BTCUSDT" && qty > 0.01 {
		log.Println("size too large, skipping")
		return
	}

	if Simulate {
		log.Printf("[SIM REAL] BUY %s → SELL %s qty=%.6f",
			buyEx, sellEx, qty)
		return
	}

	buyBroker := Brokers[buyEx]
	sellBroker := Brokers[sellEx]

	//  BUY
	log.Println("BUY placing")
	buyID, err := buyBroker.MarketBuy(symbol, qty)
	if err != nil {
		log.Println(" BUY failed:", err)
		return
	}

	buyInfo, ok := waitForExecution(buyBroker, symbol, buyID, qty)
	if !ok {
		log.Println(" BUY not filled")
		return
	}

	filled := buyInfo.FilledQty
	log.Println("BUY filled:", filled)

	// SELL
	log.Println("SELL placing")
	sellID, err := sellBroker.MarketSell(symbol, filled)
	if err != nil {
		log.Println("SELL failed:", err)
		return
	}

	_, ok = waitForExecution(sellBroker, symbol, sellID, filled)
	if !ok {
		log.Println(" SELL not filled")
		return
	}

	log.Println("TRADE COMPLETE")
}
