package service

import "log"

type CrossJob struct {

	UserID string

	Symbol string
}

var CrossJobs =
	make(chan CrossJob, 1000)

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

				log.Printf(
					"[WORKER %d] processing %s for user %s",
					workerID,
					job.Symbol,
					job.UserID,
				)

				handleCross(
					job.UserID,
					job.Symbol,
				)
			}

		}(i)
	}
}