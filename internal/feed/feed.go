package feed

type Price struct {
	Exchange string
	Symbol   string
	Ask      float64
	Bid      float64
}

type Feed struct {
	Stream chan Price
}

func NewFeed() *Feed {
	return &Feed{
		Stream: make(chan Price, 200),
	}
}
