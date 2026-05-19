package paper

import (
	"crypto-arbitrage/internal/db"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Trade struct {
	ID            string    `gorm:"primaryKey" json:"id"`
	Symbol        string    `json:"symbol"`
	UserID        string    `json:"user_id"`
	BuyExchange   string    `json:"buy_exchange"`
	SellExchange  string    `json:"sell_exchange"`
	BuyPrice      float64   `json:"buy_price"`
	SellPrice     float64   `json:"sell_price"`
	Quantity      float64   `json:"quantity"`
	ProfitUSDT    float64   `json:"profit_usdt"`
	ProfitPercent float64   `json:"profit_percent"`
	LatencyMs     int64     `json:"latency_ms"`
	Time          time.Time `json:"time"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
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

func (t *Trade) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" {
		t.ID = uuid.NewString()
	}

	return nil
}

func UpdateTrade(t Trade) error {
	return db.DB.Model(&Trade{}).Where("id=?").Updates(t).Error
}
