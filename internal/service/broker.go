package service

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"
)

type BybitBroker struct {
	ApiKey    string
	ApiSecret string
	BaseURL   string
	Client    *http.Client
}

func NewBybitBroker(key, secret string) *BybitBroker {
	return &BybitBroker{
		ApiKey:    key,
		ApiSecret: secret,
		BaseURL:   "https://api-testnet.bybit.com",
		Client:    &http.Client{Timeout: 10 * time.Second},
	}
}

// ---- helpers ----

func (b *BybitBroker) sign(payload string) (timestamp string, signature string) {
	ts := strconv.FormatInt(time.Now().UnixMilli(), 10)
	// v5 signature: sign = HMAC_SHA256(secret, timestamp + apiKey + recvWindow + payload)
	recvWindow := "5000"
	raw := ts + b.ApiKey + recvWindow + payload

	mac := hmac.New(sha256.New, []byte(b.ApiSecret))
	mac.Write([]byte(raw))
	sig := hex.EncodeToString(mac.Sum(nil))
	return ts, sig
}

func (b *BybitBroker) doPOST(path string, body any) ([]byte, error) {
	bts, _ := json.Marshal(body)
	payload := string(bts)

	ts, sig := b.sign(payload)
	req, err := http.NewRequest("POST", b.BaseURL+path, bytes.NewBuffer(bts))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-BAPI-API-KEY", b.ApiKey)
	req.Header.Set("X-BAPI-SIGN", sig)
	req.Header.Set("X-BAPI-TIMESTAMP", ts)
	req.Header.Set("X-BAPI-RECV-WINDOW", "5000")

	resp, err := b.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var out bytes.Buffer
	out.ReadFrom(resp.Body)
	return out.Bytes(), nil
}

type OrderResponse struct {
	Result struct {
		OrderId string `json:"orderId"`
	} `json:"result"`
}

func (b *BybitBroker) MarketBuy(symbol string, quoteQty float64) (string, error) {
	body := map[string]interface{}{
		"category":  "spot",
		"symbol":    symbol,
		"side":      "Buy",
		"orderType": "Market",
		"qty":       fmt.Sprintf("%.2f", quoteQty),
	}

	respBytes, err := b.doPOST("/v5/order/create", body)
	if err != nil {
		return "", err
	}

	var resp OrderResponse
	json.Unmarshal(respBytes, &resp)

	return resp.Result.OrderId, nil
}

func (b *BybitBroker) MarketSell(symbol string, baseQty float64) (string, error) {
	body := map[string]interface{}{
		"category":  "spot",
		"symbol":    symbol,
		"side":      "Sell",
		"orderType": "Market",
		"qty":       fmt.Sprintf("%.6f", baseQty),
	}

	respBytes, err := b.doPOST("/v5/order/create", body)
	if err != nil {
		return "", err
	}

	var resp OrderResponse
	json.Unmarshal(respBytes, &resp)

	return resp.Result.OrderId, nil
}
func (b *BybitBroker) GetOrderStatus(symbol, orderId string) (string, error) {
	params := fmt.Sprintf(
		"category=spot&symbol=%s&orderId=%s",
		symbol,
		orderId,
	)

	ts, sig := b.sign(params)

	req, _ := http.NewRequest(
		"GET",
		b.BaseURL+"/v5/order/realtime?"+params,
		nil,
	)

	req.Header.Set("X-BAPI-API-KEY", b.ApiKey)
	req.Header.Set("X-BAPI-SIGN", sig)
	req.Header.Set("X-BAPI-TIMESTAMP", ts)
	req.Header.Set("X-BAPI-RECV-WINDOW", "5000")

	resp, err := b.Client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result struct {
		Result struct {
			List []struct {
				OrderStatus string `json:"orderStatus"`
			} `json:"list"`
		} `json:"result"`
	}

	json.NewDecoder(resp.Body).Decode(&result)

	if len(result.Result.List) == 0 {
		return "", nil
	}

	return result.Result.List[0].OrderStatus, nil
}

func waitForFill(b *BybitBroker, symbol, orderId string) bool {
	timeout := time.After(5 * time.Second)
	ticker := time.NewTicker(300 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			log.Println("⏰ Order timeout:", orderId)
			return false

		case <-ticker.C:
			status, err := b.GetOrderStatus(symbol, orderId)
			if err != nil {
				continue
			}

			if status == "Filled" {
				return true
			}

			if status == "Cancelled" || status == "Rejected" {
				return false
			}
		}
	}
}
