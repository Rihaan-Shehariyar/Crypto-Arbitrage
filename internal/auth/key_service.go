package auth

import (
	"context"
	"crypto-arbitrage/internal/db"

	"github.com/google/uuid"
)

// SAVE EXCHANGE KEY

func SaveExchangeKey(
	userID,
	exchange,
	apiKey,
	apiSecret string,
) error {

	id := uuid.NewString()

	_, err := db.DB.Exec(
		context.Background(),
		`
	INSERT INTO exchange_keys
	(
		id,
		user_id,
		exchange,
		api_key,
		api_secret
	)
	VALUES ($1, $2, $3, $4, $5)

	ON CONFLICT (user_id, exchange)

	DO UPDATE SET
		api_key = EXCLUDED.api_key,
		api_secret = EXCLUDED.api_secret
	`,
		id,
		userID,
		exchange,
		apiKey,
		apiSecret,
	)

	return err
}

// GET USER KEYS

func GetUserKeys(
	userID string,
) ([]ExchangeKey, error) {

	rows, err := db.DB.Query(
		context.Background(),
		`
		SELECT
			id,
			exchange,
			api_key,
			api_secret
		FROM exchange_keys
		WHERE user_id=$1
		`,
		userID,
	)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var keys []ExchangeKey

	for rows.Next() {

		var k ExchangeKey

		err := rows.Scan(
			&k.ID,
			&k.Exchange,
			&k.APIKey,
			&k.APISecret,
		)

		if err != nil {
			continue
		}

		k.UserID = userID

		keys = append(keys, k)
	}

	return keys, nil
}
