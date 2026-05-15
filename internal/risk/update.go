package risk

// -----------------------------------
// OPEN TRADE
// -----------------------------------

func OpenTrade(
	userID string,
	value float64,
) {

	risk :=
		GetUserRisk(userID)

	risk.OpenTrades++

	risk.ExposureUSDT += value
}

// -----------------------------------
// CLOSE TRADE
// -----------------------------------

func CloseTrade(
	userID string,
	value float64,
	profit float64,
) {

	risk :=
		GetUserRisk(userID)

	if risk.OpenTrades > 0 {

		risk.OpenTrades--
	}

	risk.ExposureUSDT -= value

	risk.DailyPnL += profit
}
