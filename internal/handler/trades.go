package handler

import (
	"net/http"

	"crypto-arbitrage/internal/service"

	"github.com/gin-gonic/gin"
)

func GetTrades(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"trades": service.GetTrades(),
		"total":  service.GetTotalPnL(),
	})
}
