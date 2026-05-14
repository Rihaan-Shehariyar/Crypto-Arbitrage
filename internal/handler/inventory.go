package handler

import (
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/inventory"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func InventoryHandler(
	c *gin.Context,
) {

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

	data :=
		inventory.GetUserInventory(
			user.ID,
		)

	log.Println(
		inventory.GetUserInventory(
			user.ID,
		),
	)

	c.JSON(
		http.StatusOK,
		data,
	)

}
