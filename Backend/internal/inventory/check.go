package inventory

func HasInventory(

	userID string,

	buyExchange string,
	sellExchange string,

	baseAsset string,

	usdtNeeded float64,

	baseQty float64,
) bool {

	buyUSDT := GetInventory(
		userID,
		buyExchange,
		"USDT",
	)

	if buyUSDT < usdtNeeded {
		return false
	}

	sellAsset := GetInventory(
		userID,
		sellExchange, baseAsset,
	)

	if sellAsset < baseQty {
		return false
	}

	return true
}
