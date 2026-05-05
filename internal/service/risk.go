package service

import "log"

func canTrade(qty float64) bool {

	// basic safety
	if qty <= 0 {
		return false
	}

	// cap size
	if qty > 1 {
		return false
	}

	return true
}

func hasBalance(buyEx, sellEx, symbol string, qty float64, price float64) bool {

	base := symbol[:len(symbol)-4] // BTC from BTCUSDT
	quote := "USDT"

	buyBal := GetBalance(buyEx)
	sellBal := GetBalance(sellEx)

	log.Println("💰 BUY BAL:", buyBal)
	log.Println("💰 SELL BAL:", sellBal)
	if buyBal == nil || sellBal == nil {
		return false
	}

	// Need USDT to BUY
	requiredUSDT := qty * price
	if buyBal[quote] < requiredUSDT {
		return false
	}

	// if buyBal["USDT"] < 1000000 {
	// 	return false
	// }
	// Need asset to SELL
	if sellBal[base] < qty {
		return false
	}

	return true
}


func hasInventory(buyEx, sellEx, symbol string, qty, price float64) bool {

	base := symbol[:len(symbol)-4]
	quote := "USDT"

	buyUSDT := GetInventory(buyEx, quote)
	sellAsset := GetInventory(sellEx, base)

	required := qty * price

	log.Printf("💰 INV CHECK %s BUY:%s USDT=%.2f SELL:%s %s=%.6f need=%.2f",
		symbol, buyEx, buyUSDT, sellEx, base, sellAsset, required)

	if buyUSDT < required {
		return false
	}

	if sellAsset < qty {
		return false
	}

	return true
}