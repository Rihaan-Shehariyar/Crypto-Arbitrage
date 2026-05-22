package service

import (
	"crypto-arbitrage/internal/redis"
	"log"
	"time"
)

func StartHeartbeatCleanup() {

	go func() {

		ticker :=
			time.NewTicker(
				5 * time.Second,
			)

		defer ticker.Stop()

		for range ticker.C {

			users, err :=
				GetActiveTraders()

			if err != nil {

				continue
			}

			for _, userID := range users {

				key :=
					"heartbeat:" + userID

				exists, err :=
					redis.Client.Exists(

						redis.Ctx,

						key,
					).Result()

				if err != nil {

					continue
				}

				if exists == 0 {

					log.Printf(
						"[HEARTBEAT] removing inactive trader %s",
						userID,
					)

					RemoveActiveTrader(
						userID,
					)
				}
			}
		}
	}()
}
