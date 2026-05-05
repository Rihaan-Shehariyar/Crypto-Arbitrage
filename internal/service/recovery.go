package service

import (
	"crypto-arbitrage/broker"
	"log"
	"time"
)

// Emergency: sell back on same exchange
func emergencySell(b broker.Broker, symbol string, qty float64) {
	time.Sleep(500 * time.Millisecond)

	log.Println("🚨 EMERGENCY SELL")

	_, err := b.MarketSell(symbol, qty)
	if err != nil {
		log.Println("❌ Emergency sell failed:", err)
	}
}

// Retry selling on target exchange
func retrySell(b broker.Broker, symbol string, qty float64) {
	for i := 0; i < 3; i++ {

		time.Sleep(1 * time.Second)

		_, err := b.MarketSell(symbol, qty)
		if err == nil {
			log.Println("✅ Retry sell success")
			return
		}
	}

	log.Println("❌ Retry sell failed → manual intervention needed")
}
