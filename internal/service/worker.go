package service

import (
	"crypto-arbitrage/internal/metrics"
	"log"
	"time"
)

type CrossJob struct {
	UserID   string
	QueuedAt int64
	Symbol   string
}  

var CrossJobs = make(
	chan CrossJob,  
	1000,
)

func StartCrossWorkers(
	count int,
) {

	for i := 0; i < count; i++ {

		go func(
			workerID int,
		) {

			log.Printf(
				"[WORKER %d] started",
				workerID,
			)

			for job := range CrossJobs {

				queueWait :=
					time.Now().UnixMilli() -
						job.QueuedAt

				metrics.QueueWaitLatency.
					Observe(
						float64(queueWait),
					)

				start :=
					time.Now().UnixMilli()

				handleCross(job.UserID,job.Symbol)

				duration :=
					time.Now().UnixMilli() -
						start

				metrics.WorkerExecutionLatency.
					Observe(
						float64(duration),
					)
			}

		}(i)
	}
}
