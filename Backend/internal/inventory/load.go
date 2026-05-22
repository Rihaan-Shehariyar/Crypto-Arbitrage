package inventory

import "crypto-arbitrage/internal/db"

func LoadInventories() error {

	var rows []Inventory

	err := db.DB.Find(&rows).Error

	if err != nil {
		return err
	}

	for _, row := range rows {

		if inventory[row.UserID] == nil {

			inventory[row.UserID] =
				make(map[string]map[string]float64)
		}

		if inventory[row.UserID][row.Exchange] == nil {

			inventory[row.UserID][row.Exchange] =
				make(map[string]float64)
		}

		inventory[row.UserID][row.Exchange][row.Asset] =
			row.Balance
	}

	return nil
}
