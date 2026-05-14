package service

import (
	"crypto-arbitrage/internal/metrics"
	"log"
	"time"
)

var exchanges = []string{
	"binance",
	"bybit",
	"okx",
	"kucoin",
	"gate",
}

func StartExchangeHealthMonitor() {

	go func() {

		for {

			now :=
				time.Now().UnixMilli()

			for _, exchange :=
				range exchanges {

				last :=
					metrics.GetExchangeHeartbeat(
						exchange,
					)

				if last == 0 {

					log.Printf(
						"[HEALTH] %s no data yet",
						exchange,
					)

					continue
				}

				diff := now - last

				if diff > 10000 {

					log.Printf(
						"[HEALTH] %s STALE (%dms)",
						exchange,
						diff,
					)

				} else {

					log.Printf(
						"[HEALTH] %s healthy (%dms)",
						exchange,
						diff,
					)
				}
			}

			time.Sleep(
				5 * time.Second,
			)
		}
	}()
}