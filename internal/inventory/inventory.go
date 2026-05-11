package inventory

import "sync"

var invMu sync.RWMutex

// exchange -> asset -> amount
inventory[userID][exchange][asset]
// -----------------------------------
// FULL BALANCE UPDATE
// -----------------------------------

func UpdateInventory(
	exchange string,
	bal map[string]float64,
) {

	invMu.Lock()
	defer invMu.Unlock()

	inventory[exchange] = bal
}

// -----------------------------------
// GET BALANCE
// -----------------------------------

func GetInventory(
	exchange string,
	asset string,
) float64 {

	invMu.RLock()
	defer invMu.RUnlock()

	if inventory[exchange] == nil {
		return 0
	}

	return inventory[exchange][asset]
}

// -----------------------------------
// ADD BALANCE
// -----------------------------------

func AddInventory(
	exchange string,
	asset string,
	amount float64,
) {

	invMu.Lock()
	defer invMu.Unlock()

	if inventory[exchange] == nil {

		inventory[exchange] =
			make(map[string]float64)
	}

	inventory[exchange][asset] += amount
}

// -----------------------------------
// SUBTRACT BALANCE
// -----------------------------------

func SubInventory(
	exchange string,
	asset string,
	amount float64,
) {

	invMu.Lock()
	defer invMu.Unlock()

	if inventory[exchange] == nil {

		inventory[exchange] =
			make(map[string]float64)
	}

	inventory[exchange][asset] -= amount
}
