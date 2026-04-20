package exchange

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"time"
)

type BinanceResponse struct {
	BidPrice string `json:"bidPrice"`
	AskPrice string `json:"askPrice"`
}

var HttpClient = &http.Client{
	Timeout: 5 * time.Second,
}

func GetBinancePrice(symbol string) (float64, float64, error) {

	url := "https://api.binance.com/api/v3/ticker/bookTicker?symbol=" + symbol
	resp, err := HttpClient.Get(url)
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
