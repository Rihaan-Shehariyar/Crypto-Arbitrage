package handler

import (
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/inventory"
	"net/http"

	"github.com/gin-gonic/gin"
)

type DepositRequest struct {
	Exchange string  `json:"exchange"`
	Asset    string  `json:"asset"`
	Amount   float64 `json:"amount"`
}

func DepositHandler(
	c *gin.Context,
) {

	// -----------------------------------
	// GET AUTH USER
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
	// REQUEST
	// -----------------------------------

	var req DepositRequest

	if err := c.ShouldBindJSON(&req); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": err.Error(),
			},
		)

		return
	}

	// -----------------------------------
	// UPDATE INVENTORY
	// -----------------------------------

	inventory.AddInventory(
		user.ID,
		req.Exchange,
		req.Asset,
		req.Amount,
	)

	// -----------------------------------
	// RESPONSE
	// -----------------------------------

	c.JSON(
		http.StatusOK,
		gin.H{
			"message": "deposit successful",
		},
	)
}
