package auth

import (
	"crypto-arbitrage/internal/db"

	"github.com/google/uuid"
)

func SaveExchangeKey(
	userID,
	exchange,
	apiKey,
	apiSecret string,
) error {

	var existing ExchangeKey

	err := db.DB.
		Where(
			"user_id = ? AND exchange = ?",
			userID,
			exchange,
		).
		First(&existing).Error

	// update existing
	if err == nil {

		existing.APIKey = apiKey
		existing.APISecret = apiSecret

		return db.DB.Save(&existing).Error
	}

	// create new
	key := ExchangeKey{

		ID: uuid.NewString(),

		UserID: userID,

		Exchange: exchange,

		APIKey:    apiKey,
		APISecret: apiSecret,
	}

	return db.DB.Create(&key).Error
}

// GET USER KEYS
func GetUserKeys(
	userID string,
) ([]ExchangeKey, error) {

	var keys []ExchangeKey

	err := db.DB.
		Where("user_id = ?", userID).
		Find(&keys).Error

	if err != nil {
		return nil, err
	}

	return keys, nil
}
