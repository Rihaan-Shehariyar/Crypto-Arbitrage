package exchange

type Exchange interface {
	Name() string
	GetPrice(symbol string) (float64, float64, error)
}
