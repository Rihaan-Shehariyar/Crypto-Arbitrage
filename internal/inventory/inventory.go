package inventory

// import "sync"

// var invMu sync.RWMutex

// // -----------------------------------
// // exchange -> asset -> amount
// // -----------------------------------

// var inventory = make(map[string]map[string]float64)

// // -----------------------------------
// // FULL INVENTORY UPDATE
// // -----------------------------------

// func UpdateInventory(
// 	exchange string,
// 	bal map[string]float64,
// ) {

// 	invMu.Lock()
// 	defer invMu.Unlock()

// 	inventory[exchange] = bal
// }

// // -----------------------------------
// // GET INVENTORY
// // -----------------------------------

// func GetInventory(
// 	exchange string,
// 	asset string,
// ) float64 {

// 	invMu.RLock()
// 	defer invMu.RUnlock()

// 	if inventory[exchange] == nil {
// 		return 0
// 	}

// 	return inventory[exchange][asset]
// }

// // -----------------------------------
// // ADD INVENTORY
// // -----------------------------------

// func AddInventory(
// 	exchange string,
// 	asset string,
// 	amount float64,
// ) {

// 	invMu.Lock()
// 	defer invMu.Unlock()

// 	if inventory[exchange] == nil {

// 		inventory[exchange] =
// 			make(map[string]float64)
// 	}

// 	inventory[exchange][asset] += amount
// }

// // -----------------------------------
// // SUB INVENTORY
// // -----------------------------------

// func SubInventory(
// 	exchange string,
// 	asset string,
// 	amount float64,
// ) {

// 	invMu.Lock()
// 	defer invMu.Unlock()

// 	if inventory[exchange] == nil {

// 		inventory[exchange] =
// 			make(map[string]float64)
// 	}

// 	inventory[exchange][asset] -= amount
// }
