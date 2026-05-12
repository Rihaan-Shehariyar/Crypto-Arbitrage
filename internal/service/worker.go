package service

import "log"

type CrossJob struct {
	UserID string

	Symbol string
}

var CrossJobs = make(chan CrossJob, 1000)

func StartCrossWorkers(
	count int,
) {

	for i := 0; i < count; i++ {

		go func(
			workerID int,
		) {

			for job := range CrossJobs {

				handleCross(
					job.UserID,
					job.Symbol,
				)

				log.Printf(
					"[WORKER %d] processing %s",
					workerID,
					job.Symbol,
				)
			}

		}(i)
	}
}
