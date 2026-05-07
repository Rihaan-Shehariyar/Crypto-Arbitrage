package service

import (
	"crypto-arbitrage/broker"
	"log"
	"time"
)

func StartBalanceWorker(brokers map[string]broker.Broker) {

	go func() {
		for {
			for name, b := range brokers {

				bal, err := b.GetBalance()
				if err != nil {
					log.Println("balance error:", name, err)
					continue
				}

				UpdateInventory(name, bal)

				log.Println("BALANCE UPDATE:", name, bal)
			}

			time.Sleep(5 * time.Second)
		}
	}()
}