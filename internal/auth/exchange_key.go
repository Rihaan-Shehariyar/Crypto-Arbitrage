package auth

import "time"

type ExchangeKey struct {
	ID string `gorm:"primaryKey"`

	UserID string `gorm:"index"`

	Exchange string

	APIKey    string
	APISecret string

   

	CreatedAt time.Time
}
