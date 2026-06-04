package service

import (
	"context"
	"sync"
)

var (
	engineMu sync.Mutex

	activeEngines = make(
		map[string]context.CancelFunc,
	)
)

func RegisterEngine(

	userID string,

	cancel context.CancelFunc,
) bool {

	engineMu.Lock()
	defer engineMu.Unlock()

	// -----------------------------------
	// ENGINE ALREADY RUNNING
	// -----------------------------------

	if _, exists :=
		activeEngines[userID]; exists {

		return false
	}

	activeEngines[userID] =
		cancel

	return true
}
func StopEngine(
	userID string,
) {

	engineMu.Lock()
	defer engineMu.Unlock()

	cancel, exists :=
		activeEngines[userID]

	if !exists {
		return
	}

	cancel()

	delete(
		activeEngines,
		userID,
	)
}

func EngineRunning(
	userID string,
) bool {

	engineMu.Lock()
	defer engineMu.Unlock()

	_, exists :=
		activeEngines[userID]

	return exists
}


func EngineCount() int {

	engineMu.Lock()
	defer engineMu.Unlock()

	return len(
		activeEngines,
	)
}
