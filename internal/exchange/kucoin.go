package exchange

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
)

type KucoinResponse struct {
	Data struct {
		Price string `json:"price"`
	} `json:"data"`
}

func GetKucoinBTCPrice() (float64, error) {

	resp, err := http.Get("https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=BTC-USDT")
	if err != nil {
		return 0, err
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, err
	}

	var data KucoinResponse

	err = json.Unmarshal(body, &data)

	if err != nil {
		return 0, nil
	}

	price, err := strconv.ParseFloat(data.Data.Price, 64)
	if err != nil {
		return 0, err
	}

	return price, nil

}
