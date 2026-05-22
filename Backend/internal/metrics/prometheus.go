package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// -----------------------------------
// SYSTEM METRICS
// -----------------------------------

var EventsReceived = prometheus.NewCounter(
	prometheus.CounterOpts{
		Name: "events_received_total",
		Help: "Total events received",
	},
)

var KafkaMessages = prometheus.NewCounter(
	prometheus.CounterOpts{
		Name: "kafka_messages_total",
		Help: "Total kafka messages processed",
	},
)

var ArbitrageChecks = prometheus.NewCounter(
	prometheus.CounterOpts{
		Name: "arbitrage_checks_total",
		Help: "Total arbitrage evaluations",
	},
)

var ProfitableSpreads = prometheus.NewCounter(
	prometheus.CounterOpts{
		Name: "profitable_spreads_total",
		Help: "Total profitable spreads detected",
	},
)

var StaleBooks = prometheus.NewCounter(
	prometheus.CounterOpts{
		Name: "stale_books_total",
		Help: "Total stale orderbooks detected",
	},
)

var EngineErrors = prometheus.NewCounter(
	prometheus.CounterOpts{
		Name: "engine_errors_total",
		Help: "Total engine errors",
	},
)

// -----------------------------------
// EXCHANGE METRICS
// -----------------------------------

var ExchangeUpdates = prometheus.NewCounterVec(
	prometheus.CounterOpts{
		Name: "exchange_updates_total",
		Help: "Exchange orderbook updates",
	},
	[]string{
		"exchange",
	},
)

// -----------------------------------
// WORKER QUEUE
// -----------------------------------

var WorkerQueueDepth = promauto.NewGauge(

	prometheus.GaugeOpts{

		Name: "worker_queue_depth",

		Help: "Current worker queue depth",
	},
)

var KafkaLatency = promauto.NewHistogram(
	prometheus.HistogramOpts{
		Name: "kafka_latency_ms",

		Help: "Kafka transport latency",

		Buckets: prometheus.LinearBuckets(
			1,
			5,
			20,
		),
	},
)
