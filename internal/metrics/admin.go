package metrics

import "sync/atomic"

// GLOBAL SYSTEM METRICS

var TotalReconnects int64

var TotalWSConnections int64

var TotalStaleBooks int64

var TotalEngineErrors int64

// HELPERS

func IncReconnects() {

	atomic.AddInt64(
		&TotalReconnects,
		1,
	)
}

func IncWSConnections() {

	atomic.AddInt64(
		&TotalWSConnections,
		1,
	)
}

func IncStaleBooks() {

	atomic.AddInt64(
		&TotalStaleBooks,
		1,
	)
}

func IncEngineErrors() {

	atomic.AddInt64(
		&TotalEngineErrors,
		1,
	)
}
