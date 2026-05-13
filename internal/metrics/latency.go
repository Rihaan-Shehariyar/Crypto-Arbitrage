package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// -----------------------------------
// QUEUE WAIT LATENCY
// -----------------------------------

var QueueWaitLatency = promauto.NewHistogram(

	prometheus.HistogramOpts{

		Name: "queue_wait_latency_ms",

		Help: "Time spent waiting in queue",

		Buckets: prometheus.LinearBuckets(
			1,
			5,
			20,
		),
	},
)

// -----------------------------------
// WORKER EXECUTION LATENCY
// -----------------------------------

var WorkerExecutionLatency = promauto.NewHistogram(

	prometheus.HistogramOpts{

		Name: "worker_execution_latency_ms",

		Help: "Worker execution latency",

		Buckets: prometheus.LinearBuckets(
			1,
			10,
			20,
		),
	},
)
