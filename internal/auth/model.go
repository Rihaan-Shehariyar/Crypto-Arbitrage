package auth

type User struct {
	ID string `gorm:"primaryKey"`

	Email string `gorm:"uniqueIndex"`

	Password string

	ExchangeKeys []ExchangeKey
}
