package exchange

type WSExchange interface {
	Name() string

	Connect(symbols []string) error

	Subscribe() error

	ReadLoop() error

	Close() error
}
