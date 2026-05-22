package risk

import "sync"

type UserRisk struct {

	// current open exposure
	ExposureUSDT float64

	// current open trades
	OpenTrades int

	// realized pnl today
	DailyPnL float64
}

var (
	mu sync.RWMutex

	userRisk = make(map[string]*UserRisk)
)

// -----------------------------------
// GET
// -----------------------------------

func GetUserRisk(
	userID string,
) *UserRisk {

	mu.Lock()
	defer mu.Unlock()

	if userRisk[userID] == nil {

		userRisk[userID] =
			&UserRisk{}
	}

	return userRisk[userID]
}
