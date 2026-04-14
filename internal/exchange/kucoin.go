package exchange

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
)

type KucoinResponse struct {
	Data struct {
		BestBid string `json:"bestBid"`
		BestAsk string `json:"bestAsk"`
	} `json:"data"`
}

func GetKuCoinBTCPrice() (float64, float64, error) {

	resp, err := http.Get("https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=BTC-USDT")
	if err != nil {
		return 0, 0, err
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, 0, err
	}

	var data KucoinResponse

	err = json.Unmarshal(body, &data)

	if err != nil {
		return 0, 0, nil
	}

	bid, err := strconv.ParseFloat(data.Data.BestBid, 64)
	if err != nil {
		return 0, 0, err
	}

	ask, err := strconv.ParseFloat(data.Data.BestAsk, 64)
	if err != nil {
		return 0, 0, err
	}

	return bid, ask, nil

}
