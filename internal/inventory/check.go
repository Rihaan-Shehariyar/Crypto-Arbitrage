package inventory

func HasInventory(

	buyExchange string,
	sellExchange string,

	baseAsset string,

	usdtNeeded float64,

	baseQty float64,
) bool {

	// -------------------------
	// BUY SIDE NEEDS USDT
	// -------------------------

	buyUSDT := GetInventory(
		buyExchange,
		"USDT",
	)

	if buyUSDT < usdtNeeded {
		return false
	}

	// -------------------------
	// SELL SIDE NEEDS ASSET
	// -------------------------

	sellAsset := GetInventory(
		sellExchange,
		baseAsset,
	)

	if sellAsset < baseQty {
		return false
	}

	return true
}
