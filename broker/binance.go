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
		BaseURL: "https://testnet.binance.vision",
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
// 🔧 HTTP REQUEST
//////////////////////////////////////////////////////

func (b *BinanceBroker) doRequest(method, endpoint, params string) ([]byte, error) {

	ts := strconv.FormatInt(time.Now().UnixMilli(), 10)

	if params != "" {
		params += "&timestamp=" + ts + "&recvWindow=5000"
	} else {
		params = "timestamp=" + ts + "&recvWindow=5000"
	}

	signature := b.sign(params)

	url := b.BaseURL + endpoint + "?" + params + "&signature=" + signature

	req, _ := http.NewRequest(method, url, bytes.NewBuffer(nil))
	req.Header.Set("X-MBX-APIKEY", b.ApiKey)

	resp, err := b.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	// 🔥 DEBUG (IMPORTANT)
	// fmt.Println("BINANCE RAW:", string(body))

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("http %d: %s", resp.StatusCode, string(body))
	}

	return body, nil
}

//////////////////////////////////////////////////////
// 🟢 MARKET BUY (USDT)
//////////////////////////////////////////////////////

func (b *BinanceBroker) MarketBuy(symbol string, quoteQty float64) (string, error) {

	params := fmt.Sprintf(
		"symbol=%s&side=BUY&type=MARKET&quoteOrderQty=%.6f",
		symbol,
		quoteQty,
	)

	body, err := b.doRequest("POST", "/api/v3/order", params)
	if err != nil {
		return "", err
	}

	// Handle Binance error response
	var errResp struct {
		Code int    `json:"code"`
		Msg  string `json:"msg"`
	}

	if json.Unmarshal(body, &errResp) == nil && errResp.Code != 0 {
		return "", fmt.Errorf("binance error: %s", errResp.Msg)
	}

	var resp struct {
		OrderID int64 `json:"orderId"`
	}

	if err := json.Unmarshal(body, &resp); err != nil {
		return "", err
	}

	if resp.OrderID == 0 {
		return "", fmt.Errorf("orderId is zero (request failed)")
	}

	return strconv.FormatInt(resp.OrderID, 10), nil
}

//////////////////////////////////////////////////////
// 🔴 MARKET SELL
//////////////////////////////////////////////////////

func (b *BinanceBroker) MarketSell(symbol string, qty float64) (string, error) {

	params := fmt.Sprintf(
		"symbol=%s&side=SELL&type=MARKET&quantity=%.6f",
		symbol,
		qty,
	)

	body, err := b.doRequest("POST", "/api/v3/order", params)
	if err != nil {
		return "", err
	}

	var errResp struct {
		Code int    `json:"code"`
		Msg  string `json:"msg"`
	}

	if json.Unmarshal(body, &errResp) == nil && errResp.Code != 0 {
		return "", fmt.Errorf("binance error: %s", errResp.Msg)
	}

	var resp struct {
		OrderID int64 `json:"orderId"`
	}

	if err := json.Unmarshal(body, &resp); err != nil {
		return "", err
	}

	if resp.OrderID == 0 {
		return "", fmt.Errorf("orderId is zero (request failed)")
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

	body, err := b.doRequest("GET", "/api/v3/order", params)
	if err != nil {
		return nil, err
	}

	var resp struct {
		Status              string `json:"status"`
		ExecutedQty         string `json:"executedQty"`
		CummulativeQuoteQty string `json:"cummulativeQuoteQty"`
	}

	if err := json.Unmarshal(body, &resp); err != nil {
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

	_, err := b.doRequest("DELETE", "/api/v3/order", params)
	return err
}

//////////////////////////////////////////////////////
// 💼 BALANCE
//////////////////////////////////////////////////////

func (b *BinanceBroker) GetBalance() (map[string]float64, error) {

	body, err := b.doRequest("GET", "/api/v3/account", "")
	if err != nil {
		return nil, err
	}

	var resp struct {
		Balances []struct {
			Asset string `json:"asset"`
			Free  string `json:"free"`
		} `json:"balances"`
	}

	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}

	result := make(map[string]float64)

	for _, b := range resp.Balances {
		val, _ := strconv.ParseFloat(b.Free, 64)
		if val > 0 {
			result[b.Asset] = val
		}
	}

	return result, nil
}
