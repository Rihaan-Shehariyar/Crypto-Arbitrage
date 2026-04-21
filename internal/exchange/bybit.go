package exchange

import (
	"encoding/json"
	"io"
	"strconv"
)

type Bybit struct{}

func (b Bybit) Name() string {
	return "bybit"
}

func (b Bybit) GetPrice(symbol string) (float64, float64, error) {
	return GetBybitPrice(symbol)
}

type bytbitResponse struct {
	Data struct {
		BidPrice string `json:"bidPrice"`
		AskPrice string `json:"askPrice"`
	} `json:"data"`
}

func GetBybitPrice(symbol string) (float64, float64, error) {
	url := "https://api.bybit.com/v5/market/tickers?category=spot&symbol=" + symbol

	resp, err := HttpClient.Get(url)
	if err != nil {
		return 0, 0, err
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, 0, err
	}

	var data bytbitResponse

	err = json.Unmarshal(body, &data)

	if err != nil {
		return 0, 0, err
	}

	bid, err := strconv.ParseFloat(data.Data.BidPrice, 64)
	if err != nil {
		return 0, 0, err
	}

	ask, err := strconv.ParseFloat(data.Data.AskPrice, 64)
	if err != nil {
		return 0, 0, err
	}

	return bid, ask, nil

}
