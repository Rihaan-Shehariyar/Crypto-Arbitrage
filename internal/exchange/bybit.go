package exchange

import (
	"encoding/json"
	"fmt"
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

type BybitResponse struct {
	Result struct {
		List []struct {
			Bid1Price string `json:"bid1Price"`
			Ask1Price string `json:"ask1Price"`
		} `json:"list"`
	} `json:"result"`
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

	var data BybitResponse

	err = json.Unmarshal(body, &data)

	if err != nil {
		return 0, 0, err
	}

	if len(data.Result.List) == 0 {
		return 0, 0, fmt.Errorf("no data from bybit")
	}

	bid, err := strconv.ParseFloat(data.Result.List[0].Bid1Price, 64)
	if err != nil {
		return 0, 0, err
	}

	ask, err := strconv.ParseFloat(data.Result.List[0].Ask1Price, 64)
	if err != nil {
		return 0, 0, err
	}

	return bid, ask, nil

}
