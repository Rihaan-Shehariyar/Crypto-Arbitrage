package broker

type OrderInfo struct {
	OrderID   string
	Status    string
	AvgPrice  float64
	FilledQty float64
}

type Broker interface {
	Name() string

	MarketBuy(symbol string, quoteQty float64) (string, error)
	MarketSell(symbol string, baseQty float64) (string, error)

	GetOrderInfo(symbol, orderId string) (*OrderInfo, error)

	GetBalance() (map[string]float64, error)

	CancelOrder(symbol, orderId string) error
}