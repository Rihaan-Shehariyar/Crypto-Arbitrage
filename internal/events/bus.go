package events

type Event struct {
	Type string

	Data interface{}
}

var Bus = make(
	chan Event,
	1000,
)
