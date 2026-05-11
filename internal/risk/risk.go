package risk

import "errors"

type TradeRequest struct {
	Symbol string

	BuyExchange  string
	SellExchange string

	BuyPrice  float64
	SellPrice float64

	Quantity float64

	Spread float64

	Capital float64
}

const (
	MaxCapital = 100.0

	MaxSpread = 5.0

	MinSpread = 0.1
)

func ValidateTrade(
	req TradeRequest,
) error {

	if req.Capital > MaxCapital {

		return errors.New(
			"capital exceeded",
		)
	}

	if req.Spread < MinSpread {

		return errors.New(
			"spread too low",
		)
	}

	if req.Spread > MaxSpread {

		return errors.New(
			"spread anomaly",
		)
	}

	return nil
}
