package service

import (
	"log"
)

func executeTrade(symbol, buyEx, sellEx string, qty float64) {

	if Simulate {
		log.Printf("[SIM] %s BUY %s → SELL %s qty=%.6f",
			symbol, buyEx, sellEx, qty,
		)
		return
	}

	// 🔴 Real execution (future)
	log.Println("REAL EXECUTION NOT ENABLED YET")
}
