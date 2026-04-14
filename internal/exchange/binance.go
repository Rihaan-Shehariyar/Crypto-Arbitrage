package exchange

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
)

type BinanceResponse struct {
	BidPrice string `json:"bidPrice"`
	AskPrice string `json:"askPrice"`
}

func GetBinanceBTCPrice() (float64, float64, error) {
	resp, err := http.Get("https://api.binance.com/api/v3/ticker/bookTicker?symbol=BTCUSDT")
	if err != nil {
		return 0, 0, err
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, 0, err
	}

	var data BinanceResponse

	err = json.Unmarshal(body, &data)
	if err != nil {
		return 0, 0, err
	}

	bid, err := strconv.ParseFloat(data.BidPrice, 64)
	if err != nil {
		return 0, 0, err
	}

	ask, err := strconv.ParseFloat(data.AskPrice, 64)
	if err != nil {
		return 0, 0, err
	}

	return bid, ask, nil

}
