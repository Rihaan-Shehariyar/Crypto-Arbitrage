package handler

import (
	"crypto-arbitrage/internal/paper"

	"github.com/gin-gonic/gin"
)

func GetPaperBalance(c *gin.Context) {

	c.JSON(
		200,
		gin.H{
			"balances": paper.Balances,
		},
	)
}
