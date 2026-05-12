package paper

import (
	"crypto-arbitrage/internal/db"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Trade struct {
	ID     string `gorm:"primaryKey"`
	Symbol string
	UserID string

	BuyExchange  string
	SellExchange string

	BuyPrice  float64
	SellPrice float64

	Quantity float64

	ProfitUSDT    float64
	ProfitPercent float64
	LatencyMs     int64
	Time          time.Time
	Status        string

	CreatedAt time.Time
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
