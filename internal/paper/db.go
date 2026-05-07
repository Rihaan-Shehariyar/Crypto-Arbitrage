package paper

import (
	"context"
	"crypto-arbitrage/internal/db"
	"log"
)

func SaveTrade(t Trade) {

	_, err := db.DB.Exec(
		context.Background(),

		`
		INSERT INTO paper_trades
		(
			id,
			symbol,

			buy_exchange,
			sell_exchange,

			buy_price,
			sell_price,

			quantity,

			profit_usdt,
			profit_percent,

			status,

			created_at
		)
		VALUES
		(
			$1,$2,$3,$4,$5,
			$6,$7,$8,$9,$10,$11
		)
		`,

		t.ID,
		t.Symbol,

		t.BuyExchange,
		t.SellExchange,

		t.BuyPrice,
		t.SellPrice,

		t.Quantity,

		t.ProfitUSDT,
		t.ProfitPercent,

		t.Status,

		t.Time,
	)

	if err != nil {

		log.Println(
			"save trade error:",
			err,
		)

		return
	}
}
