package metrics

import (
	"sync"
	"time"
)

var exchangeMutex sync.RWMutex

var lastExchangeUpdate = make(map[string]int64)

// -----------------------------------
// UPDATE EXCHANGE HEARTBEAT
// -----------------------------------

func UpdateExchangeHeartbeat(
	exchange string,
) {

	exchangeMutex.Lock()
	defer exchangeMutex.Unlock()

	lastExchangeUpdate[exchange] =
		time.Now().UnixMilli()
}

// -----------------------------------
// GET LAST UPDATE
// -----------------------------------

func GetExchangeHeartbeat(
	exchange string,
) int64 {

	exchangeMutex.RLock()
	defer exchangeMutex.RUnlock()

	return lastExchangeUpdate[exchange]
}
