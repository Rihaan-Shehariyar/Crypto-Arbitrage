package handler

import (
	"crypto-arbitrage/broker"
	"crypto-arbitrage/internal/auth"
	"net/http"

	"github.com/gin-gonic/gin"
)

// -------------------------
// SAVE EXCHANGE KEYS
// -------------------------

func SaveExchangeKeyHandler(c *gin.Context) {

	userAny, exists := c.Get("user")
	if !exists {

		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized",
		})

		return
	}

	user := userAny.(auth.User)

	var body struct {
		Exchange string `json:"exchange"`
		APIKey   string `json:"api_key"`
		Secret   string `json:"api_secret"`
	}

	if err := c.BindJSON(&body); err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid input",
		})

		return
	}

	switch body.Exchange {

	case "binance":

		b := broker.NewBinance(
			body.APIKey,
			body.Secret,
		)

		err := b.ValidateAPIKeys()

		if err != nil {

			c.JSON(http.StatusBadRequest, gin.H{
				"error": "invalid binance api keys",
			})

			return
		}
	}

	err := auth.SaveExchangeKey(
		user.ID,
		body.Exchange,
		body.APIKey,
		body.Secret,
	)

	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "exchange keys saved",
	})
}

// -------------------------
// GET USER EXCHANGE KEYS
// -------------------------

func GetExchangeKeysHandler(c *gin.Context) {

	userAny, exists := c.Get("user")
	if !exists {

		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized",
		})

		return
	}

	user := userAny.(auth.User)

	keys, err := auth.GetUserKeys(user.ID)
	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	// ⚠️ NEVER expose secrets in production
	// temporary for development

	c.JSON(http.StatusOK, gin.H{
		"keys": keys,
	})
}
