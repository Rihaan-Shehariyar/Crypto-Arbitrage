package paper

import (
	"sync"
	"time"

	"github.com/google/uuid"
)

type Trade struct {
	ID     string
	Symbol string

	BuyExchange  string
	SellExchange string

	BuyPrice  float64
	SellPrice float64

	Quantity float64

	ProfitUSDT    float64
	ProfitPercent float64

	Status string

	Time time.Time
}

var Trades []Trade

var tradesMu sync.Mutex

func AddTrade(t Trade) {

	tradesMu.Lock()
	defer tradesMu.Unlock()

	t.ID = uuid.NewString()

	Trades = append(
		[]Trade{t},
		Trades...,
	)

	SaveTrade(t)
}
