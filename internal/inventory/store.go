package inventory

import (
	"crypto-arbitrage/internal/db"
	"sync"
)

var invMu sync.RWMutex

// -----------------------------------
// user -> exchange -> asset -> amount
// -----------------------------------

var inventory = make(map[string]map[string]map[string]float64)

// -----------------------------------
// INIT USER
// -----------------------------------

func InitUser(
	userID string,
) {

	invMu.Lock()
	defer invMu.Unlock()

	if inventory[userID] == nil {

		inventory[userID] =
			make(map[string]map[string]float64)
	}
}

// -----------------------------------
// UPDATE INVENTORY
// -----------------------------------

func UpdateInventory(
	userID string,
	exchange string,
	bal map[string]float64,
) {

	invMu.Lock()
	defer invMu.Unlock()

	if inventory[userID] == nil {

		inventory[userID] =
			make(map[string]map[string]float64)
	}

	inventory[userID][exchange] = bal
}

// -----------------------------------
// GET INVENTORY
// -----------------------------------

func GetInventory(
	userID string,
	exchange string,
	asset string,
) float64 {

	invMu.RLock()
	defer invMu.RUnlock()

	if inventory[userID] == nil {
		return 0
	}

	if inventory[userID][exchange] == nil {
		return 0
	}

	return inventory[userID][exchange][asset]
}

// -----------------------------------
// ADD INVENTORY
// -----------------------------------
func AddInventory(
	userID string,
	exchange string,
	asset string,
	amount float64,
) {

	invMu.Lock()
	defer invMu.Unlock()

	if inventory[userID] == nil {

		inventory[userID] =
			make(map[string]map[string]float64)
	}

	if inventory[userID][exchange] == nil {

		inventory[userID][exchange] =
			make(map[string]float64)
	}

	// -----------------------------------
	// MEMORY UPDATE
	// -----------------------------------

	inventory[userID][exchange][asset] += amount

	// -----------------------------------
	// DB UPSERT
	// -----------------------------------

	var inv Inventory

	err := db.DB.
		Where(
			"user_id = ? AND exchange = ? AND asset = ?",
			userID,
			exchange,
			asset,
		).
		First(&inv).Error

	if err != nil {

		inv = Inventory{

			UserID: userID,

			Exchange: exchange,

			Asset: asset,

			Balance: amount,
		}

		db.DB.Create(&inv)

		return
	}

	inv.Balance += amount

	db.DB.Save(&inv)
}

// -----------------------------------
// SUB INVENTORY
// -----------------------------------
func SubInventory(
	userID string,
	exchange string,
	asset string,
	amount float64,
) bool {

	invMu.Lock()
	defer invMu.Unlock()

	if inventory[userID] == nil {
		return false
	}

	if inventory[userID][exchange] == nil {
		return false
	}

	current :=
		inventory[userID][exchange][asset]

	if current < amount {
		return false
	}

	// -----------------------------------
	// MEMORY
	// -----------------------------------

	inventory[userID][exchange][asset] -= amount

	// -----------------------------------
	// DB
	// -----------------------------------

	var inv Inventory

	err := db.DB.
		Where(
			"user_id = ? AND exchange = ? AND asset = ?",
			userID,
			exchange,
			asset,
		).
		First(&inv).Error

	if err != nil {
		return false
	}

	inv.Balance -= amount

	db.DB.Save(&inv)

	return true
}

// -----------------------------------
// GET ALL USER INVENTORY
// -----------------------------------

func GetUserInventory(
	userID string,
) map[string]map[string]float64 {

	invMu.RLock()
	defer invMu.RUnlock()

	result :=
		make(map[string]map[string]float64)

	if inventory[userID] == nil {
		return result
	}

	for exchange, assets := range inventory[userID] {

		result[exchange] =
			make(map[string]float64)

		for asset, amount := range assets {

			result[exchange][asset] = amount
		}
	}

	return result
}
