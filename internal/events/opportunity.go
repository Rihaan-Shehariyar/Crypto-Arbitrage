package events

type OpportunityEvent struct {
	Symbol string
	BuyExchange  string
	SellExchange string
	BuyPrice  float64
	SellPrice float64

	Spread float64

	ProfitUSDT float64

	Time int64
}
