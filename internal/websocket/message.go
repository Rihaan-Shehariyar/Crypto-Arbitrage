package websocket

type PortfolioPayload struct {
	TotalProfitUSDT float64 `json:"total_profit_usdt"`

	TotalTrades int `json:"total_trades"`

	Balances map[string]map[string]float64 `json:"balances"`
}

type RiskPayload struct {
	CurrentExposure float64 `json:"current_exposure"`

	MaxExposure float64 `json:"max_exposure"`

	OpenPositions int `json:"open_positions"`

	DrawdownPercent float64 `json:"drawdown_percent"`

	BlockedTrades int `json:"blocked_trades"`

	CooldownActive bool `json:"cooldown_active"`
}
