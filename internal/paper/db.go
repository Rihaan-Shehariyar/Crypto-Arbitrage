package paper

import (
	"crypto-arbitrage/internal/db"
	"log"
)

func SaveTrade(t Trade) {

	err := db.DB.Create(&t).Error

	if err != nil {

		log.Println(
			"save trade error:",
			err,
		)

		return
	}

	log.Printf(
		"TRADE SAVED %s",
		t.Symbol,
	)
}
