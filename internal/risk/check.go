package risk

// -----------------------------------
// ALLOW TRADE?
// -----------------------------------

func AllowTrade(

	userID string,

	tradeValue float64,

	spread float64,

) (
	bool,
	string,
) {

	risk :=
		GetUserRisk(userID)

	// -----------------------------------
	// MAX TRADE
	// -----------------------------------

	if tradeValue > MaxTradeUSDT {
		LastRejectReason =
			"MAX_TRADE_EXCEEDED"

		return false, "MAX_TRADE_EXCEEDED"
	}

	// -----------------------------------
	// MAX EXPOSURE
	// -----------------------------------

	if risk.ExposureUSDT+tradeValue >
		MaxUserExposure {
		LastRejectReason =
			"MAX_EXPOSURE"

		return false, "MAX_EXPOSURE"
	}

	// -----------------------------------
	// MAX OPEN TRADES
	// -----------------------------------

	if risk.OpenTrades >=
		MaxOpenTrades {
		LastRejectReason =
			"MAX_OPEN_TRADES"

		return false, "MAX_OPEN_TRADES"
	}

	// -----------------------------------
	// DAILY LOSS LIMIT
	// -----------------------------------

	if risk.DailyPnL <=
		MaxDailyLossUSDT {

		LastRejectReason =
			"MAX_DAILY_LOSS"

		return false, "MAX_DAILY_LOSS"
	}

	// -----------------------------------
	// MIN SPREAD
	// -----------------------------------

	if spread < MinSpreadPercent {
		LastRejectReason =
			"SPREAD_TOO_LOW"

		return false, "SPREAD_TOO_LOW"
	}

	// if spread < -0.05 {

	// 	return false
	// }
	return true, ""
}

func GetMetrics(
	userID string,
) Metrics {

	risk :=
		GetUserRisk(userID)

	return Metrics{

		CurrentExposure: risk.ExposureUSDT,

		OpenTrades: risk.OpenTrades,

		DailyPnL: risk.DailyPnL,

		LastRejectReason: LastRejectReason,
	}
}
