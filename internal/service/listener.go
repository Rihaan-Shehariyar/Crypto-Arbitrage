package service

import (
	"context"
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/events"
	"log"
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
				// ORDERBOOK EVENT
				// -----------------------------------

				case "ORDERBOOK":

					ob :=
						event.Data.(events.OrderBookEvent)

					// -----------------------------------
					// LOAD USERS
					// -----------------------------------

					users, err :=
						auth.GetAllUsers()

					if err != nil {

						log.Println(
							"[EVENT] failed to load users:",
							err,
						)

						continue
					}

					// -----------------------------------
					// RUN STRATEGY FOR EACH USER
					// -----------------------------------

					for _, user := range users {

						if !ShouldSchedule(
							user.ID,
							ob.Symbol,
						) {
							continue
						}

						select {

						case CrossJobs <- CrossJob{

							UserID: user.ID,

							Symbol: ob.Symbol,
						}:

						default:

							log.Println(
								"[WORKER] queue full, dropping job",
							)
						}
					}

				// -----------------------------------
				// UNKNOWN EVENT
				// -----------------------------------

				default:

					log.Printf(
						"[EVENT] unknown event type: %s",
						event.Type,
					)
				}
			}
		}
	}()
}
