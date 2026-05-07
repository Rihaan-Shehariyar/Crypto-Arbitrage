package paper

import "sync"

var mu sync.Mutex

var Balances = map[string]float64{
	"USDT": 1000,
	"BTC":  0,
	"ETH":  0,
	"SOL":  0,
}
