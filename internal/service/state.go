package service

import "crypto-arbitrage/broker"

var Brokers map[string]broker.Broker

func SetBrokers(b map[string]broker.Broker) {
	Brokers = b
}