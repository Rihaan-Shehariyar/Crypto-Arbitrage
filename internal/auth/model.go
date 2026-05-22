package auth

type User struct {
	ID string `gorm:"primaryKey"`

	Name string `json:"name"`

	Email string `gorm:"uniqueIndex"`

	Password string

	TradingEnabled bool `gorm:"default:false"`

	SubscriptionActive bool `json:"subscription_active"`

	ExchangeKeys []ExchangeKey
}
