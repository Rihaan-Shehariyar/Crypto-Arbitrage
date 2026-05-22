package service

import (
	"context"
	"crypto-arbitrage/internal/events"
	"log"
	"time"
)

func StartEventConsumer(
	ctx context.Context,
) {

	go func() {

		log.Println(
			"[EVENT] consumer started",
		)

		for {

			select {

			// -----------------------------------
			// SHUTDOWN
			// -----------------------------------

			case <-ctx.Done():

				log.Println(
					"[EVENT] consumer stopped",
				)

				return

			// -----------------------------------
			// EVENT RECEIVED
			// -----------------------------------

			case event := <-events.Bus:

				switch event.Type {

				// -----------------------------------
				// ORDERBOOK
				// -----------------------------------

				case "ORDERBOOK":

					ob :=
						event.Data.(events.OrderBookEvent)

					log.Printf(
						"[EVENT] ORDERBOOK %s %s",
						ob.Exchange,
						ob.Symbol,
					)

					// -----------------------------------
					// LOAD USERS
					// -----------------------------------

					users, _ :=
						GetActiveTraders()

					log.Printf(
						"[EVENT] cached users: %d",
						len(users),
					)

					// -----------------------------------
					// LOOP USERS
					// -----------------------------------

					for _, userID := range users {

						// -----------------------------------
						// THROTTLE
						// -----------------------------------

						if !ShouldSchedule(
							userID,
							ob.Symbol,
						) {

							log.Printf(
								"[SCHEDULER] skipped %s for %s",
								ob.Symbol,
								userID,
							)

							continue
						}

						log.Printf(
							"[SCHEDULER] accepted %s for %s",
							ob.Symbol,
							userID,
						)

						// -----------------------------------
						// ENQUEUE
						// -----------------------------------

						select {

						case CrossJobs <- CrossJob{

							UserID: userID,

							Symbol:   ob.Symbol,
							QueuedAt: time.Now().UnixMilli(),
						}:

							log.Printf(
								"[QUEUE] enqueued %s for %s",
								ob.Symbol,
								userID,
							)

						default:

							log.Println(
								"[QUEUE] full, dropping job",
							)
						}
					}

				// -----------------------------------
				// UNKNOWN EVENT
				// -----------------------------------

				default:

					log.Printf(
						"[EVENT] unknown type: %s",
						event.Type,
					)
				}
			}
		}
	}()
}
