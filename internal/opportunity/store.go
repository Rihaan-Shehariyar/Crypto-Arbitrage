package opportunity

import "crypto-arbitrage/internal/db"

func Save(
	op Opportunity,
) error {

	return db.DB.Create(&op).Error
}
