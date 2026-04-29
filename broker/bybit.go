package broker

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"
)

type BybitBroker struct {
	ApiKey  string
	Secret  string
	BaseURL string
	Client  *http.Client
}

func NewBybit(apiKey, secret string) *BybitBroker {
	return &BybitBroker{
		ApiKey:  apiKey,
		Secret:  secret,
		BaseURL: "https://api-testnet.bybit.com",
		Client:  &http.Client{},
	}
}

func (b *BybitBroker) Name() string {
	return "bybit"
}

//////////////////////////////////////////////////////
// 🔐 SIGNING
//////////////////////////////////////////////////////

func (b *BybitBroker) sign(payload string, ts string) string {
	message := ts + b.ApiKey + "5000" + payload

	h := hmac.New(sha256.New, []byte(b.Secret))
	h.Write([]byte(message))

	return hex.EncodeToString(h.Sum(nil))
}

//////////////////////////////////////////////////////
// 🔧 HTTP HELPER
//////////////////////////////////////////////////////

func (b *BybitBroker) doPOST(endpoint string, body map[string]interface{}) ([]byte, error) {

	payloadBytes, _ := json.Marshal(body)
	payload := string(payloadBytes)

	ts := strconv.FormatInt(time.Now().UnixMilli(), 10)
	signature := b.sign(payload, ts)

	req, _ := http.NewRequest("POST", b.BaseURL+endpoint, bytes.NewBuffer(payloadBytes))

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-BAPI-API-KEY", b.ApiKey)
	req.Header.Set("X-BAPI-SIGN", signature)
	req.Header.Set("X-BAPI-TIMESTAMP", ts)
	req.Header.Set("X-BAPI-RECV-WINDOW", "5000")

	resp, err := b.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

//////////////////////////////////////////////////////
// 🟢 MARKET BUY
//////////////////////////////////////////////////////

func (b *BybitBroker) MarketBuy(symbol string, quoteQty float64) (string, error) {

	body := map[string]interface{}{
		"category":    "spot",
		"symbol":      symbol,
		"side":        "Buy",
		"type":        "Market",
		"qty":         fmt.Sprintf("%.6f", quoteQty),
		"orderType":   "Market",
		"timeInForce": "IOC",
		"marketUnit":  "quoteCoin",
	}

	respBytes, err := b.doPOST("/v5/order/create", body)
	if err != nil {
		return "", err
	}

	var resp struct {
		Result struct {
			OrderID string `json:"orderId"`
		} `json:"result"`
	}

	if err := json.Unmarshal(respBytes, &resp); err != nil {
		return "", err
	}

	return resp.Result.OrderID, nil
}

//////////////////////////////////////////////////////
// 🔴 MARKET SELL
//////////////////////////////////////////////////////

func (b *BybitBroker) MarketSell(symbol string, baseQty float64) (string, error) {

	body := map[string]interface{}{
		"category":    "spot",
		"symbol":      symbol,
		"side":        "Sell",
		"type":        "Market",
		"qty":         fmt.Sprintf("%.6f", baseQty),
		"timeInForce": "IOC",
	}

	respBytes, err := b.doPOST("/v5/order/create", body)
	if err != nil {
		return "", err
	}

	var resp struct {
		Result struct {
			OrderID string `json:"orderId"`
		} `json:"result"`
	}

	if err := json.Unmarshal(respBytes, &resp); err != nil {
		return "", err
	}

	return resp.Result.OrderID, nil
}

//////////////////////////////////////////////////////
// 📊 ORDER INFO
//////////////////////////////////////////////////////

func (b *BybitBroker) GetOrderInfo(symbol, orderId string) (*OrderInfo, error) {

	query := fmt.Sprintf("category=spot&symbol=%s&orderId=%s", symbol, orderId)

	ts := strconv.FormatInt(time.Now().UnixMilli(), 10)
	signature := b.sign(query, ts)

	req, _ := http.NewRequest("GET", b.BaseURL+"/v5/order/realtime?"+query, nil)

	req.Header.Set("X-BAPI-API-KEY", b.ApiKey)
	req.Header.Set("X-BAPI-SIGN", signature)
	req.Header.Set("X-BAPI-TIMESTAMP", ts)
	req.Header.Set("X-BAPI-RECV-WINDOW", "5000")

	resp, err := b.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Result struct {
			List []struct {
				OrderStatus string `json:"orderStatus"`
				AvgPrice    string `json:"avgPrice"`
				CumExecQty  string `json:"cumExecQty"`
			} `json:"list"`
		} `json:"result"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if len(result.Result.List) == 0 {
		return nil, nil
	}

	o := result.Result.List[0]

	price, _ := strconv.ParseFloat(o.AvgPrice, 64)
	qty, _ := strconv.ParseFloat(o.CumExecQty, 64)

	return &OrderInfo{
		OrderID:   orderId,
		Status:    o.OrderStatus,
		AvgPrice:  price,
		FilledQty: qty,
	}, nil
}

//////////////////////////////////////////////////////
// ❌ CANCEL ORDER
//////////////////////////////////////////////////////

func (b *BybitBroker) CancelOrder(symbol, orderId string) error {

	body := map[string]interface{}{
		"category": "spot",
		"symbol":   symbol,
		"orderId":  orderId,
	}

	_, err := b.doPOST("/v5/order/cancel", body)
	return err
}

//////////////////////////////////////////////////////
// 💼 BALANCE
//////////////////////////////////////////////////////

func (b *BybitBroker) GetBalance() (map[string]float64, error) {

	query := "accountType=UNIFIED"
	ts := strconv.FormatInt(time.Now().UnixMilli(), 10)
	signature := b.sign(query, ts)

	req, _ := http.NewRequest("GET", b.BaseURL+"/v5/account/wallet-balance?"+query, nil)

	req.Header.Set("X-BAPI-API-KEY", b.ApiKey)
	req.Header.Set("X-BAPI-SIGN", signature)
	req.Header.Set("X-BAPI-TIMESTAMP", ts)
	req.Header.Set("X-BAPI-RECV-WINDOW", "5000")

	resp, err := b.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	log.Println("BYBIT BALANCE RAW:", string(body))

	var result struct {
		Result struct {
			List []struct {
				Coin []struct {
					Coin          string `json:"coin"`
					WalletBalance string `json:"walletBalance"`
				} `json:"coin"`
			} `json:"list"`
		} `json:"result"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	balances := make(map[string]float64)

	if len(result.Result.List) == 0 {
		return balances, nil
	}

	for _, c := range result.Result.List[0].Coin {
		val, _ := strconv.ParseFloat(c.WalletBalance, 64)
		balances[c.Coin] = val
	}

	return balances, nil
}
