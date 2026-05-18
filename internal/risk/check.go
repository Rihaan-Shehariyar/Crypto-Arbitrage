package risk

// -----------------------------------
// ALLOW TRADE?
// -----------------------------------

func AllowTrade(

	userID string,

	tradeValue float64,

	spread float64,
) bool {

	risk :=
		GetUserRisk(userID)

	// -----------------------------------
	// MAX TRADE
	// -----------------------------------

	if tradeValue > MaxTradeUSDT {

		return false
	}

	// -----------------------------------
	// MAX EXPOSURE
	// -----------------------------------

	if risk.ExposureUSDT+tradeValue >
		MaxUserExposure {

		return false
	}

	// -----------------------------------
	// MAX OPEN TRADES
	// -----------------------------------

	if risk.OpenTrades >=
		MaxOpenTrades {

		return false
	}

	// -----------------------------------
	// DAILY LOSS LIMIT
	// -----------------------------------

	if risk.DailyPnL <=
		MaxDailyLossUSDT {

		return false
	}

	// -----------------------------------
	// MIN SPREAD
	// -----------------------------------

	if spread < MinSpreadPercent {

		return false
	}

	// if spread < -0.05 {

	// 	return false
	// }
	return true
}
