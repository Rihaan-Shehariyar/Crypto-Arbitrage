package service

import "crypto-arbitrage/internal/feed"

// -----------------------------------
// SIMULATE BUY
// -----------------------------------

func simulateBuy(
	asks []feed.Level,
	capital float64,
) (float64, float64) {

	remaining :=
		capital

	totalCost := 0.0

	totalQty := 0.0

	for _, ask := range asks {

		// -------------------------
		// VALIDATION
		// -------------------------

		if ask.Price <= 0 ||
			ask.Qty <= 0 {

			continue
		}

		levelValue :=
			ask.Price * ask.Qty

		// -------------------------
		// PARTIAL FILL
		// -------------------------

		if remaining <= levelValue {

			qty :=
				remaining / ask.Price

			totalCost +=
				qty * ask.Price

			totalQty += qty

			remaining = 0

			break
		}

		// -------------------------
		// FULL LEVEL
		// -------------------------

		totalCost += levelValue

		totalQty += ask.Qty

		remaining -= levelValue
	}

	// -------------------------
	// NO FILL
	// -------------------------

	if totalQty <= 0 {

		return 0, 0
	}

	avgPrice :=
		totalCost / totalQty

	return avgPrice, totalQty
}

// -----------------------------------
// SIMULATE SELL
// -----------------------------------

func simulateSell(
	bids []feed.Level,
	amount float64,
) float64 {

	remaining :=
		amount

	totalReturn := 0.0

	totalFilled := 0.0

	for _, bid := range bids {

		// -------------------------
		// VALIDATION
		// -------------------------

		if bid.Price <= 0 ||
			bid.Qty <= 0 {

			continue
		}

		// -------------------------
		// PARTIAL FILL
		// -------------------------

		if remaining <= bid.Qty {

			totalReturn +=
				remaining * bid.Price

			totalFilled += remaining

			remaining = 0

			break
		}

		// -------------------------
		// FULL LEVEL
		// -------------------------

		totalReturn +=
			bid.Qty * bid.Price

		totalFilled += bid.Qty

		remaining -= bid.Qty
	}

	// -------------------------
	// NO FILL
	// -------------------------

	if totalFilled <= 0 {

		return 0
	}

	avgSell :=
		totalReturn / totalFilled

	return avgSell
}
