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
) (*broker.OrderInfo, bool) {

	timeout := time.After(8 * time.Second)
	ticker := time.NewTicker(300 * time.Millisecond)
	defer ticker.Stop()

	var lastInfo *broker.OrderInfo

	for {
		select {

		// ⏰ Timeout → cancel order
		case <-timeout:
			log.Println("⏰ Timeout → cancelling order:", orderId)

			// If partially filled, return what we got
			if lastInfo != nil && lastInfo.FilledQty > 0 {
				_ = b.CancelOrder(symbol, orderId)
				return lastInfo, true
			}

			_ = b.CancelOrder(symbol, orderId)
			return nil, false

		// 🔄 Poll order status
		case <-ticker.C:
			info, err := b.GetOrderInfo(symbol, orderId)
			if err != nil || info == nil {
				continue
			}

			lastInfo = info

			status := strings.ToLower(info.Status)

			// ✅ FULL FILLED
			if status == "filled" {
				return info, true
			}

			// ⚠️ PARTIAL FILL (log only)
			if info.FilledQty > 0 {
				log.Printf("⚠️ Partial fill [%s]: %.6f", b.Name(), info.FilledQty)
			}

			// ❌ FAILED STATES
			if status == "cancelled" ||
				status == "canceled" || // binance spelling
				status == "rejected" {
				return info, false
			}
		}
	}
}
