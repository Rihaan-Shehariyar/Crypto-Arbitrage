package service

import (
	"crypto-arbitrage/broker"
	"crypto-arbitrage/internal/feed"
	"log"
	"strings"
	"time"
)

func simulateBuy(asks []feed.Level, capital float64) (float64, float64) {
	remaining := capital
	totalCost := 0.0
	amount := 0.0

	for _, ask := range asks {
		levelValue := ask.Price * ask.Amount

		if remaining <= levelValue {
			qty := remaining / ask.Price
			totalCost += qty * ask.Price
			amount += qty
			break
		}

		totalCost += levelValue
		amount += ask.Amount
		remaining -= levelValue
	}

	if amount == 0 {
		return 0, 0
	}

	return totalCost / amount, amount
}

func simulateSell(bids []feed.Level, amount float64) float64 {
	remaining := amount
	totalReturn := 0.0
	filled := 0.0

	for _, bid := range bids {
		if remaining <= bid.Amount {
			totalReturn += remaining * bid.Price
			filled += remaining
			break
		}

		totalReturn += bid.Amount * bid.Price
		filled += bid.Amount
		remaining -= bid.Amount
	}

	if filled == 0 {
		return 0
	}

	return totalReturn / filled
}

func waitForExecution(
	b broker.Broker,
	symbol string,
	orderId string,
	expectedQty float64,
) (*broker.OrderInfo, bool) {

	timeout := time.After(6 * time.Second)
	ticker := time.NewTicker(200 * time.Millisecond)
	defer ticker.Stop()

	var lastInfo *broker.OrderInfo

	for {
		select {

		//  TIMEOUT
		case <-timeout:
			log.Println("⏰ Timeout → cancelling order:", orderId)

			if err := b.CancelOrder(symbol, orderId); err != nil {
				log.Println("⚠️ Cancel error:", err)
			}

			// Accept ONLY meaningful partial fills
			if lastInfo != nil && lastInfo.FilledQty > 0 {

				fillRatio := lastInfo.FilledQty / expectedQty

				if fillRatio < 0.9 {
					log.Println("BUY partial too small → skip")
					continue
				}

				log.Printf("Partial fill ratio: %.2f%%",
					fillRatio*100,
				)

				//  Accept only if >80% filled
				if fillRatio >= 0.8 {
					return lastInfo, true
				}

				log.Println("Partial fill too small → discard")
			}

			return nil, false

		// POLLING
		case <-ticker.C:
			info, err := b.GetOrderInfo(symbol, orderId)
			if err != nil || info == nil {
				continue
			}

			lastInfo = info

			status := strings.ToLower(info.Status)

			// FULL FILLED
			if status == "filled" {
				return info, true
			}

			// PARTIAL
			if info.FilledQty > 0 {
				log.Printf("Partial fill [%s]: %.6f / %.6f",
					b.Name(),
					info.FilledQty,
					expectedQty,
				)
			}

			// FAILURE STATES
			if status == "cancelled" ||
				status == "canceled" ||
				status == "rejected" {

				log.Println("Order failed:", status)
				return info, false
			}
		}
	}
}
