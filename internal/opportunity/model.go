package opportunity

import "time"

type Opportunity struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Symbol          string    `json:"symbol"`
	BuyExchange     string    `json:"buy_exchange"`
	SellExchange    string    `json:"sell_exchange"`
	BuyPrice        float64   `json:"buy_price"`
	SellPrice       float64   `json:"sell_price"`
	SpreadPercent   float64   `json:"spread_percent"`
	EstimatedProfit float64   `json:"estimated_profit"`
	LatencyMs       int64     `json:"latency_ms"`
	UserID          string    `json:"user_id"`
	CreatedAt       time.Time `json:"created_at"`
}
