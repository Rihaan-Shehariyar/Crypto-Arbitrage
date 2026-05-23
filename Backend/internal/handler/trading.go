package handler

import (
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/db"
	"crypto-arbitrage/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

func StartTradingHandler(
	c *gin.Context,
) {

	userValue, exists := c.Get("user")

	if !exists {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"error": "unauthorized",
			},
		)

		return
	}

	// -----------------------------------
	// GET JWT USER
	// -----------------------------------

	jwtUser := userValue.(auth.User)

	// -----------------------------------
	// FETCH FRESH USER FROM DB
	// -----------------------------------

	var user auth.User

	err := db.DB.
		Where(
			"id = ?",
			jwtUser.ID,
		).
		First(&user).Error

	if err != nil {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"error": "user not found",
			},
		)

		return
	}

	// -----------------------------------
	// ENABLE TRADING
	// -----------------------------------

	user.TradingEnabled = true

	// -----------------------------------
	// REGISTER ACTIVE TRADER
	// -----------------------------------

	err = service.AddActiveTrader(
		user.ID,
	)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "failed to register active trader",
			},
		)

		return
	}

	// -----------------------------------
	// UPDATE DB
	// -----------------------------------

	err = db.DB.
		Model(&user).
		Update(
			"trading_enabled",
			true,
		).Error

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "failed to enable trading",
			},
		)

		return
	}

	// -----------------------------------
	// SUCCESS
	// -----------------------------------

	c.JSON(
		http.StatusOK,
		gin.H{
			"message": "trading started",
		},
	)
}

func StopTradingHandler(
	c *gin.Context,
) {

	userValue, exists := c.Get("user")

	if !exists {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"error": "unauthorized",
			},
		)

		return
	}

	// -----------------------------------
	// GET JWT USER
	// -----------------------------------

	jwtUser := userValue.(auth.User)

	// -----------------------------------
	// FETCH FRESH USER FROM DB
	// -----------------------------------

	var user auth.User

	err := db.DB.
		Where(
			"id = ?",
			jwtUser.ID,
		).
		First(&user).Error

	if err != nil {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"error": "user not found",
			},
		)

		return
	}

	// -----------------------------------
	// DISABLE TRADING
	// -----------------------------------

	user.TradingEnabled = false

	// -----------------------------------
	// REMOVE ACTIVE TRADER
	// -----------------------------------

	err = service.RemoveActiveTrader(
		user.ID,
	)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "failed to remove active trader",
			},
		)

		return
	}

	// -----------------------------------
	// UPDATE DB
	// -----------------------------------

	err = db.DB.
		Model(&user).
		Update(
			"trading_enabled",
			false,
		).Error

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "failed to stop trading",
			},
		)

		return
	}

	// -----------------------------------
	// SUCCESS
	// -----------------------------------

	c.JSON(
		http.StatusOK,
		gin.H{
			"message": "trading stopped",
		},
	)
}
