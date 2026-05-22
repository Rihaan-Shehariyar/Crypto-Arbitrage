package risk

var LastRejectReason string

type Metrics struct {
	CurrentExposure float64 `json:"current_exposure"`

	OpenTrades int `json:"open_trades"`

	DailyPnL float64 `json:"daily_pnl"`

	LastRejectReason string `json:"last_reject_reason"`
}
