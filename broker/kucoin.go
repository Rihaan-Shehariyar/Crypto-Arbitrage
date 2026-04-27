package broker

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type KucoinBroker struct {
	ApiKey     string
	Secret     string
	Passphrase string
	BaseURL    string
	Client     *http.Client
}

func NewKucoin(apiKey, secret, passphrase string) *KucoinBroker {
	return &KucoinBroker{
		ApiKey:     apiKey,
		Secret:     secret,
		Passphrase: passphrase,
		BaseURL:    "https://api.kucoin.com",
		Client:     &http.Client{},
	}
}

func (k *KucoinBroker) Name() string {
	return "kucoin"
}

//////////////////////////////////////////////////////
// 🔐 SIGNING
//////////////////////////////////////////////////////

func (k *KucoinBroker) sign(ts, method, endpoint, body string) (string, string) {

	payload := ts + method + endpoint + body

	h := hmac.New(sha256.New, []byte(k.Secret))
	h.Write([]byte(payload))
	sign := base64.StdEncoding.EncodeToString(h.Sum(nil))

	// passphrase sign
	h2 := hmac.New(sha256.New, []byte(k.Secret))
	h2.Write([]byte(k.Passphrase))
	pass := base64.StdEncoding.EncodeToString(h2.Sum(nil))

	return sign, pass
}

//////////////////////////////////////////////////////
// 🔧 HTTP HELPER
//////////////////////////////////////////////////////

func (k *KucoinBroker) doRequest(method, endpoint string, body map[string]interface{}) ([]byte, error) {

	var bodyStr string
	var bodyBytes []byte

	if body != nil {
		bodyBytes, _ = json.Marshal(body)
		bodyStr = string(bodyBytes)
	}

	ts := strconv.FormatInt(time.Now().UnixMilli(), 10)
	sign, pass := k.sign(ts, method, endpoint, bodyStr)

	req, _ := http.NewRequest(method, k.BaseURL+endpoint, bytes.NewBuffer(bodyBytes))

	req.Header.Set("KC-API-KEY", k.ApiKey)
	req.Header.Set("KC-API-SIGN", sign)
	req.Header.Set("KC-API-TIMESTAMP", ts)
	req.Header.Set("KC-API-PASSPHRASE", pass)
	req.Header.Set("KC-API-KEY-VERSION", "2")
	req.Header.Set("Content-Type", "application/json")

	resp, err := k.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

//////////////////////////////////////////////////////
// 🟢 MARKET BUY (quote)
//////////////////////////////////////////////////////

func (k *KucoinBroker) MarketBuy(symbol string, quoteQty float64) (string, error) {

	symbol = formatKucoinSymbol(symbol)

	body := map[string]interface{}{
		"symbol": symbol,
		"type":   "market",
		"side":   "buy",
		"size":   fmt.Sprintf("%.6f", quoteQty), // quote amount
	}

	respBytes, err := k.doRequest("POST", "/api/v1/orders", body)
	if err != nil {
		return "", err
	}

	var resp struct {
		Data struct {
			OrderID string `json:"orderId"`
		} `json:"data"`
	}

	json.Unmarshal(respBytes, &resp)

	return resp.Data.OrderID, nil
}

//////////////////////////////////////////////////////
// 🔴 MARKET SELL (base)
//////////////////////////////////////////////////////

func (k *KucoinBroker) MarketSell(symbol string, baseQty float64) (string, error) {

	symbol = formatKucoinSymbol(symbol)

	body := map[string]interface{}{
		"symbol": symbol,
		"type":   "market",
		"side":   "sell",
		"size":   fmt.Sprintf("%.6f", baseQty),
	}

	respBytes, err := k.doRequest("POST", "/api/v1/orders", body)
	if err != nil {
		return "", err
	}

	var resp struct {
		Data struct {
			OrderID string `json:"orderId"`
		} `json:"data"`
	}

	json.Unmarshal(respBytes, &resp)

	return resp.Data.OrderID, nil
}

//////////////////////////////////////////////////////
// 📊 ORDER INFO
//////////////////////////////////////////////////////

func (k *KucoinBroker) GetOrderInfo(symbol, orderId string) (*OrderInfo, error) {

	endpoint := "/api/v1/orders/" + orderId

	respBytes, err := k.doRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}

	var resp struct {
		Data struct {
			IsActive  bool   `json:"isActive"`
			DealSize  string `json:"dealSize"`
			DealFunds string `json:"dealFunds"`
		} `json:"data"`
	}

	json.Unmarshal(respBytes, &resp)

	qty, _ := strconv.ParseFloat(resp.Data.DealSize, 64)
	funds, _ := strconv.ParseFloat(resp.Data.DealFunds, 64)

	price := 0.0
	if qty > 0 {
		price = funds / qty
	}

	status := "NEW"
	if !resp.Data.IsActive {
		status = "FILLED"
	}

	return &OrderInfo{
		OrderID:   orderId,
		Status:    status,
		AvgPrice:  price,
		FilledQty: qty,
	}, nil
}

//////////////////////////////////////////////////////
// ❌ CANCEL ORDER
//////////////////////////////////////////////////////

func (k *KucoinBroker) CancelOrder(symbol, orderId string) error {

	endpoint := "/api/v1/orders/" + orderId
	_, err := k.doRequest("DELETE", endpoint, nil)
	return err
}

//////////////////////////////////////////////////////
// 💼 BALANCE
//////////////////////////////////////////////////////

func (k *KucoinBroker) GetBalance() (map[string]float64, error) {

	respBytes, err := k.doRequest("GET", "/api/v1/accounts", nil)
	if err != nil {
		return nil, err
	}

	var resp struct {
		Data []struct {
			Currency string `json:"currency"`
			Balance  string `json:"balance"`
			Type     string `json:"type"`
		} `json:"data"`
	}

	json.Unmarshal(respBytes, &resp)

	balances := make(map[string]float64)

	for _, b := range resp.Data {
		if b.Type != "trade" {
			continue
		}

		val, _ := strconv.ParseFloat(b.Balance, 64)
		if val > 0 {
			balances[b.Currency] = val
		}
	}

	return balances, nil
}

//////////////////////////////////////////////////////
// 🔧 SYMBOL FORMAT
//////////////////////////////////////////////////////

func formatKucoinSymbol(symbol string) string {
	if strings.Contains(symbol, "-") {
		return symbol
	}
	return symbol[:len(symbol)-4] + "-" + symbol[len(symbol)-4:]
}
