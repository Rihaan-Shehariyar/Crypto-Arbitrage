package handler

import (
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/db"
	"crypto-arbitrage/internal/paper"
	"net/http"

	"github.com/gin-gonic/gin"
)

func TradesHandler(
	c *gin.Context,
) {

	// -----------------------------------
	// AUTH USER
	// -----------------------------------

	userValue, exists :=
		c.Get("user")

	if !exists {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"error": "unauthorized",
			},
		)

		return
	}

	user :=
		userValue.(auth.User)

	// -----------------------------------
	// FETCH TRADES
	// -----------------------------------

	var trades []paper.Trade

	err := db.DB.
		Where(
			"user_id = ?",
			user.ID,
		).
		Order("created_at DESC").
		Find(&trades).Error

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": err.Error(),
			},
		)

		return
	}

	// -----------------------------------
	// RESPONSE
	// -----------------------------------

	c.JSON(
		http.StatusOK,
		trades,
	)
}
