package kafka

import (
	"context"
	"encoding/json"
	"log"

	"github.com/segmentio/kafka-go"
)

type Producer struct {
	writer *kafka.Writer
}

func NewProducer(
	broker string,
) *Producer {

	w := &kafka.Writer{
		Addr: kafka.TCP(broker),

		Topic: "orderbooks",

		Balancer: &kafka.LeastBytes{},
	}

	return &Producer{
		writer: w,
	}
}

func (p *Producer) Publish(
	msg OrderBookMessage,
) error {

	data, err :=
		json.Marshal(msg)

	if err != nil {
		return err
	}

	err = p.writer.WriteMessages(
		context.Background(),
		kafka.Message{
			Value: data,
		},
	)

	if err != nil {
		return err
	}

	log.Printf(
		"[KAFKA] published %s %s",
		msg.Exchange,
		msg.Symbol,
	)

	return nil
}