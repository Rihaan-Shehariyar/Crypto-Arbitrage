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

		for name, b := range brokers {

			bal, err := b.GetBalance()

			if err != nil {
				log.Println("❌ Balance error:", name, err) // 🔥 ADD THIS
				continue
			}

			log.Println("✅ Balance OK:", name, bal) // 🔥 ADD THIS

			result[name] = bal
		}

		c.JSON(http.StatusOK, result)
	}
}
