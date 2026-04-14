package exchange

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
)

type BinanceResponse struct {
	Price string `json:"price"`
}

func GetBTCprice() (float64, error) {
	resp, err := http.Get("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT")
	if err != nil {
		return 0, err
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, err
	}

	var data BinanceResponse

	err = json.Unmarshal(body, &data)
	if err != nil {
		return 0, err
	}

	price, err := strconv.ParseFloat(data.Price, 64)
	if err != nil {
		return 0, err
	}

	return price, nil

}
