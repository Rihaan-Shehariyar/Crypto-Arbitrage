package handler

import (
	"log"
	"net/http"

	"crypto-arbitrage/broker"

	"github.com/gin-gonic/gin"
)

func GetBalanceHandler(brokers map[string]broker.Broker) gin.HandlerFunc {
	return func(c *gin.Context) {

		result := make(map[string]map[string]float64)

		log.Println("Fetching balances...")

		for name, b := range brokers {

			log.Println(" Checking:", name)

			bal, err := b.GetBalance()

			
			if err != nil {
				log.Println(" ERROR:", name, err)

				result[name] = map[string]float64{}
				continue
			}

			if bal == nil {
				log.Println(" NIL balance:", name)
				result[name] = map[string]float64{}
				continue
			}

			//  Log actual balance
			log.Println("BALANCE:", name, bal)

			result[name] = bal
		}

		log.Println("FINAL RESPONSE:", result)

		c.JSON(http.StatusOK, result)
	}
}
