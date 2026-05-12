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

					users, err :=
						auth.GetAllUsers()

					if err != nil {

						log.Println(
							"[EVENT] failed loading users:",
							err,
						)

						continue
					}

					log.Printf(
						"[EVENT] users loaded: %d",
						len(users),
					)

					// -----------------------------------
					// LOOP USERS
					// -----------------------------------

					for _, user := range users {

						// -----------------------------------
						// THROTTLE
						// -----------------------------------

						if !ShouldSchedule(
							user.ID,
							ob.Symbol,
						) {

							log.Printf(
								"[SCHEDULER] skipped %s for %s",
								ob.Symbol,
								user.ID,
							)

							continue
						}

						log.Printf(
							"[SCHEDULER] accepted %s for %s",
							ob.Symbol,
							user.ID,
						)

						// -----------------------------------
						// ENQUEUE
						// -----------------------------------

						select {

						case CrossJobs <- CrossJob{

							UserID: user.ID,

							Symbol: ob.Symbol,
						}:

							log.Printf(
								"[QUEUE] enqueued %s for %s",
								ob.Symbol,
								user.ID,
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
