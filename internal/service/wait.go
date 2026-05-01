package service

import (
	"crypto-arbitrage/broker"
	"strings"
	"time"
)

func waitForExecution(b broker.Broker, symbol, orderId string, expectedQty float64) (*broker.OrderInfo, bool) {

	timeout := time.After(10 * time.Second)
	ticker := time.NewTicker(200 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {

		case <-timeout:
			return nil, false

		case <-ticker.C:
			info, err := b.GetOrderInfo(symbol, orderId)
			if err != nil || info == nil {
				continue
			}

			status := strings.ToLower(info.Status)

			if status == "filled" {
				return info, true
			}

			if status == "cancelled" || status == "rejected" {
				return info, false
			}
		}
	}
}
