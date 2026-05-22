package service

import (
	"sync"
	"time"
)

var schedMu sync.Mutex

var lastScheduled =
	make(map[string]int64)

const minScheduleGapMs = 200

func ShouldSchedule(
	userID string,
	symbol string,
) bool {

	key :=
		userID + ":" + symbol

	now :=
		time.Now().UnixMilli()

	schedMu.Lock()
	defer schedMu.Unlock()

	last :=
		lastScheduled[key]

	if now-last < minScheduleGapMs {
		return false
	}

	lastScheduled[key] = now

	return true
}