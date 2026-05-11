package metrics

import "sync"

// USER METRICS

type UserMetrics struct {
	TotalTrades int64

	ClosedTrades int64

	FailedTrades int64

	TotalOpportunities int64

	ProfitUSDT float64
}

var mu sync.RWMutex

var users = make(map[string]*UserMetrics)

// GET USER METRICS

func GetUserMetrics(
	userID string,
) *UserMetrics {

	mu.Lock()
	defer mu.Unlock()

	if users[userID] == nil {

		users[userID] =
			&UserMetrics{}
	}

	return users[userID]
}
