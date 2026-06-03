package service

import (
	"context"
	"crypto-arbitrage/broker"
	"crypto-arbitrage/internal/feed"
	"log"
	"time"
)

var GlobalFeed *feed.Feed

var GlobalBrokers map[string]broker.Broker

func StartEngineManager(
	ctx context.Context,
) {

	ticker :=
		time.NewTicker(
			5 * time.Second,
		)

	defer ticker.Stop()

	for {

		select {

		case <-ctx.Done():

			log.Println(
				"[ENGINE MANAGER] stopped",
			)

			return

		case <-ticker.C:

			activeUsers, err :=
				GetActiveTraders()

			if err != nil {

				log.Println(
					"[ENGINE MANAGER]",
					err,
				)

				continue
			}

			for _, userID := range activeUsers {

				if EngineRunning(
					userID,
				) {

					continue
				}

				log.Printf(
					"[ENGINE MANAGER] starting engine for %s",
					userID,
				)

				engineCtx,
					cancel :=
					context.WithCancel(
						ctx,
					)

				ok :=
					RegisterEngine(
						userID,
						cancel,
					)

				if !ok {

					cancel()

					continue
				}

				go StartEngine(

					engineCtx,

					userID,

					GlobalFeed,

					GlobalBrokers,
				)
			}
		}
	}
}
