package recovery

import (
	"crypto-arbitrage/internal/db"
	"crypto-arbitrage/internal/paper"
	"log"
)

func RecoverTrades() {

	var trades []paper.Trade

	err := db.DB.Where("status!=?", paper.StatusClosed).Find(&trades).Error

	if err != nil {
		log.Println("recovery error :", err)
		return
	}

	log.Printf("RECOVERY:found %d open trades", len(trades))

	for _, trades := range trades {
		log.Printf("RECOVERING TRADE %s | %s", trades.ID, trades.Status)

	}
}

func handlerRecovery(trade paper.Trade) {
	switch trade.Status {
	case paper.StatusPending:
		log.Printf(
			"[RECOVERY] %s was pending",
			trade.ID,
		)

	case paper.StatusBuying:
		log.Printf(
			"[RECOVERY] %s interrupted during buy",
			trade.ID,
		)

	case paper.StatusBuyFilled:

		log.Printf(
			"[RECOVERY] %s buy completed but sell missing",
			trade.ID,
		)

	case paper.StatusSelling:

		log.Printf(
			"[RECOVERY] %s interrupted during sell",
			trade.ID,
		)

	case paper.StatusFailed:

		log.Printf(
			"[RECOVERY] %s previously failed",
			trade.ID,
		)

	}
}
