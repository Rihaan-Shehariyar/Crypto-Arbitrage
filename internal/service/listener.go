package service

import (
	"crypto-arbitrage/internal/events"
)

func StartEventConsumer() {

	go func() {

		for event := range events.Bus {

			switch event.Type {

			case "ORDERBOOK":

				ob :=
					event.Data.(events.OrderBookEvent)

				handleCross(
					ob.Symbol,
				)
			}
		}
	}()
}
