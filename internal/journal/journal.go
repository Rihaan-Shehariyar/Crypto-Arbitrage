package journal

import (
	"sync"
	"time"
)

type Entry struct {
	TradeID string

	Event string

	Message string

	Time time.Time
}

var (
	mu sync.RWMutex

	entries []Entry
)

func Add(
	tradeID string,
	event string,
	message string,
) {

	mu.Lock()
	defer mu.Unlock()

	entries = append(
		entries,
		Entry{

			TradeID: tradeID,

			Event: event,

			Message: message,

			Time: time.Now(),
		},
	)
}
func GetEntries() []Entry {

	mu.RLock()
	defer mu.RUnlock()

	return entries
}
