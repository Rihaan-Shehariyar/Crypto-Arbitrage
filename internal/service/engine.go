package service

import (
	"context"
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/websocket"
	"log"
)

type Opportunity struct {
	Coin      string  `json:"coin"`
	BuyFrom   string  `json:"buy_from"`
	SellTo    string  `json:"sell_to"`
	BuyPrice  float64 `json:"buy_price"`
	SellPrice float64 `json:"sell_price"`
	Profit    float64 `json:"profit"`
}

var (
	LatestResult map[string]interface{}
	AllResults   = make(map[string]Opportunity)
)

func StartEngine(ctx context.Context, f *feed.Feed) {
	go func() {

		for {
			select {

			//  incoming price from WS feed
			case price := <-f.Stream:

				UpdatePrice(price)
				prices := GetPrices(price.Symbol)

				if len(prices) < 2 {
					continue
				}

				bestProfit := -1e9
				var bestBuy, bestSell feed.Price

				fee := 0.001

				//  find best arbitrage pair
				for _, buy := range prices {
					for _, sell := range prices {

						if buy.Exchange == sell.Exchange {
							continue
						}

						profit := sell.Bid*(1-fee) - buy.Ask*(1+fee)

						if profit > bestProfit {
							bestProfit = profit
							bestBuy = buy
							bestSell = sell
						}
					}
				}

				log.Printf("[ENGINE] %s | %s → %s | Profit: %.4f",
					price.Symbol,
					bestBuy.Exchange,
					bestSell.Exchange,
					bestProfit,
				)

				//  build opportunity
				op := Opportunity{
					Coin:      price.Symbol,
					BuyFrom:   bestBuy.Exchange,
					SellTo:    bestSell.Exchange,
					BuyPrice:  bestBuy.Ask,
					SellPrice: bestSell.Bid,
					Profit:    bestProfit,
				}

				//  thread-safe store
				mu.Lock()
				AllResults[price.Symbol] = op

				// convert map → slice for UI
				var list []Opportunity
				for _, v := range AllResults {
					list = append(list, v)
				}

				LatestResult = map[string]interface{}{
					"opportunities": list,
				}
				mu.Unlock()

				//  send to UI
				websocket.Broadcast(LatestResult)

			//  graceful shutdown
			case <-ctx.Done():
				log.Println("[ENGINE] shutting down...")
				return
			}
		}
	}()
}
