package auth

type User struct {
	ID string `gorm:"primaryKey"`

	Email string `gorm:"uniqueIndex"`

	Password string

	TradingEnabled bool `gorm:"default:false"`

	ExchangeKeys []ExchangeKey
}
