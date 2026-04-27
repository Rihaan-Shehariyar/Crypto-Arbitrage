package broker

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"
)

type BinanceBroker struct {
	ApiKey  string
	Secret  string
	BaseURL string
	Client  *http.Client
}

func NewBinance(apiKey, secret string) *BinanceBroker {
	return &BinanceBroker{
		ApiKey:  apiKey,
		Secret:  secret,
		BaseURL: "https://testnet.binance.vision", // testnet
		Client:  &http.Client{},
	}
}

func (b *BinanceBroker) Name() string {
	return "binance"
}

//////////////////////////////////////////////////////
// 🔐 SIGNING
//////////////////////////////////////////////////////

func (b *BinanceBroker) sign(query string) string {
	h := hmac.New(sha256.New, []byte(b.Secret))
	h.Write([]byte(query))
	return hex.EncodeToString(h.Sum(nil))
}

//////////////////////////////////////////////////////
// 🔧 HTTP HELPER
//////////////////////////////////////////////////////

func (b *BinanceBroker) doRequest(method, endpoint string, params string, body []byte) ([]byte, error) {

	ts := strconv.FormatInt(time.Now().UnixMilli(), 10)

	if params != "" {
		params += "&timestamp=" + ts
	} else {
		params = "timestamp=" + ts
	}

	signature := b.sign(params)
	fullURL := b.BaseURL + endpoint + "?" + params + "&signature=" + signature

	req, _ := http.NewRequest(method, fullURL, bytes.NewBuffer(body))

	req.Header.Set("X-MBX-APIKEY", b.ApiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := b.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

//////////////////////////////////////////////////////
// 🟢 MARKET BUY (quote)
//////////////////////////////////////////////////////

func (b *BinanceBroker) MarketBuy(symbol string, quoteQty float64) (string, error) {

	params := fmt.Sprintf(
		"symbol=%s&side=BUY&type=MARKET&quoteOrderQty=%.6f",
		symbol,
		quoteQty,
	)

	respBytes, err := b.doRequest("POST", "/api/v3/order", params, nil)
	if err != nil {
		return "", err
	}

	var resp struct {
		OrderID int64 `json:"orderId"`
	}

	if err := json.Unmarshal(respBytes, &resp); err != nil {
		return "", err
	}

	return strconv.FormatInt(resp.OrderID, 10), nil
}

//////////////////////////////////////////////////////
// 🔴 MARKET SELL (base qty)
//////////////////////////////////////////////////////

func (b *BinanceBroker) MarketSell(symbol string, baseQty float64) (string, error) {

	params := fmt.Sprintf(
		"symbol=%s&side=SELL&type=MARKET&quantity=%.6f",
		symbol,
		baseQty,
	)

	respBytes, err := b.doRequest("POST", "/api/v3/order", params, nil)
	if err != nil {
		return "", err
	}

	var resp struct {
		OrderID int64 `json:"orderId"`
	}

	if err := json.Unmarshal(respBytes, &resp); err != nil {
		return "", err
	}

	return strconv.FormatInt(resp.OrderID, 10), nil
}

//////////////////////////////////////////////////////
// 📊 ORDER INFO
//////////////////////////////////////////////////////

func (b *BinanceBroker) GetOrderInfo(symbol, orderId string) (*OrderInfo, error) {

	params := fmt.Sprintf(
		"symbol=%s&orderId=%s",
		symbol,
		orderId,
	)

	respBytes, err := b.doRequest("GET", "/api/v3/order", params, nil)
	if err != nil {
		return nil, err
	}

	var resp struct {
		Status              string `json:"status"`
		ExecutedQty         string `json:"executedQty"`
		CummulativeQuoteQty string `json:"cummulativeQuoteQty"`
	}

	if err := json.Unmarshal(respBytes, &resp); err != nil {
		return nil, err
	}

	qty, _ := strconv.ParseFloat(resp.ExecutedQty, 64)
	quote, _ := strconv.ParseFloat(resp.CummulativeQuoteQty, 64)

	price := 0.0
	if qty > 0 {
		price = quote / qty
	}

	return &OrderInfo{
		OrderID:   orderId,
		Status:    resp.Status,
		AvgPrice:  price,
		FilledQty: qty,
	}, nil
}

//////////////////////////////////////////////////////
// ❌ CANCEL ORDER
//////////////////////////////////////////////////////

func (b *BinanceBroker) CancelOrder(symbol, orderId string) error {

	params := fmt.Sprintf(
		"symbol=%s&orderId=%s",
		symbol,
		orderId,
	)

	_, err := b.doRequest("DELETE", "/api/v3/order", params, nil)
	return err
}

//////////////////////////////////////////////////////
// 💼 BALANCE
//////////////////////////////////////////////////////

func (b *BinanceBroker) GetBalance() (map[string]float64, error) {

	respBytes, err := b.doRequest("GET", "/api/v3/account", "", nil)
	if err != nil {
		return nil, err
	}

	var resp struct {
		Balances []struct {
			Asset string `json:"asset"`
			Free  string `json:"free"`
		} `json:"balances"`
	}

	if err := json.Unmarshal(respBytes, &resp); err != nil {
		return nil, err
	}

	balances := make(map[string]float64)

	for _, b := range resp.Balances {
		val, _ := strconv.ParseFloat(b.Free, 64)
		if val > 0 {
			balances[b.Asset] = val
		}
	}

	return balances, nil
}
