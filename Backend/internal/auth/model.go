package auth

type User struct {
	ID string `gorm:"primaryKey" json:"id"`

	Name string `json:"name"`

	Email string `gorm:"uniqueIndex" json:"email"`

	Password string `json:"-"`

	TradingEnabled bool `gorm:"default:false" json:"trading_enabled"`

	SubscriptionActive bool `json:"subscription_active"`

	Role string `gorm:"default:user" json:"role"`

	ExchangeKeys []ExchangeKey `json:"-"`
}