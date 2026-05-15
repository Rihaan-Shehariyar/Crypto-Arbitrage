package opportunity

import "time"

type Opportunity struct {
	ID uint `gorm:"primaryKey"`

	Symbol string

	BuyExchange string

	SellExchange string

	BuyPrice float64

	SellPrice float64

	SpreadPercent float64

	EstimatedProfit float64

	LatencyMs int64

	UserID string

	CreatedAt time.Time
}
