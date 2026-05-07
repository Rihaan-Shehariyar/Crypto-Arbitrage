package paper

import (
	"log"
	"strings"
)

// -------------------------
// PAPER BUY
// -------------------------

func Buy(
	symbol string,
	price float64,
	usdtAmount float64,
) {

	mu.Lock()
	defer mu.Unlock()

	if Balances["USDT"] < usdtAmount {

		log.Println("Not enough USDT")

		return
	}

	base := strings.ReplaceAll(
		symbol,
		"USDT",
		"",
	)

	qty := usdtAmount / price

	Balances["USDT"] -= usdtAmount
	Balances[base] += qty

	log.Printf(
		" PAPER BUY %s | Qty: %.8f | Price: %.2f",
		base,
		qty,
		price,
	)

	printBalances()
}

// -------------------------
// PAPER SELL
// -------------------------

func Sell(
	symbol string,
	price float64,
) {

	mu.Lock()
	defer mu.Unlock()

	base := strings.ReplaceAll(
		symbol,
		"USDT",
		"",
	)

	qty := Balances[base]

	if qty <= 0 {

		log.Println("No asset to sell")

		return
	}

	usdt := qty * price

	Balances[base] = 0
	Balances["USDT"] += usdt

	log.Printf(
		"PAPER SELL %s | Qty: %.8f | Price: %.2f",
		base,
		qty,
		price,
	)

	printBalances()
}

// -------------------------
// PRINT WALLET
// -------------------------

func printBalances() {

	log.Println("💼 PAPER WALLET")

	for asset, bal := range Balances {

		log.Printf(
			"%s = %.8f",
			asset,
			bal,
		)
	}
}
