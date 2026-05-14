package inventory

import "time"

type Inventory struct {
	ID uint `gorm:"primaryKey"`

	UserID string

	Exchange string

	Asset string

	Balance float64

	CreatedAt time.Time

	UpdatedAt time.Time
}
