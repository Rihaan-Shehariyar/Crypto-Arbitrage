package service

import (
	"encoding/json"
	"net/http"
)

type BinanceExchangeInfo struct {
	Symbols []struct {
		Symbol     string `json:"symbol"`
		Status     string `json:"status"`
		BaseAsset  string `json:"baseAsset"`
		QuoteAsset string `json:"quoteAsset"`
		IsSpot     bool   `json:"isSpotTradingAllowed"`
	} `json:"symbols"`
}

func FetchBinanceSymbols() ([]string, error) {

	resp, err := http.Get("https://api.binance.com/api/v3/exchangeInfo")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var data BinanceExchangeInfo
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	var symbols []string

	for _, s := range data.Symbols {
		if s.Status != "TRADING" || !s.IsSpot {
			continue
		}
		symbols = append(symbols, s.Symbol)
	}

	return symbols, nil
}