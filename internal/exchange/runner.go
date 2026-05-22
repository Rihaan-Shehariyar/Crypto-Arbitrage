package exchange

import (
	"log"
	"time"
)

func RunExchange(
	ex WSExchange,
	symbols []string,
) {

	go func() {

		for {

			log.Printf(
				"[%s] starting worker...",
				ex.Name(),
			)

			err := ex.Connect(
				symbols,
			)

			if err != nil {

				log.Printf(
					"[%s] connect error: %v",
					ex.Name(),
					err,
				)

				time.Sleep(
					3 * time.Second,
				)

				continue
			}

			err = ex.Subscribe()

			if err != nil {

				log.Printf(
					"[%s] subscribe error: %v",
					ex.Name(),
					err,
				)

				ex.Close()

				time.Sleep(
					3 * time.Second,
				)

				continue
			}

			err = ex.ReadLoop()

			if err != nil {

				log.Printf(
					"[%s] disconnected: %v",
					ex.Name(),
					err,
				)
			}

			ex.Close()

			log.Printf(
				"[%s] reconnecting in 3s...",
				ex.Name(),
			)

			time.Sleep(
				3 * time.Second,
			)
		}
	}()
}
