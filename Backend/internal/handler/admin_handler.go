package handler

import (
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/db"
	"crypto-arbitrage/internal/paper"
	"crypto-arbitrage/internal/service"
	"crypto-arbitrage/internal/websocket"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AdminUserHandler(
	c *gin.Context,
) {

	id := c.Param("id")

	var user auth.User

	err := db.DB.
		Where(
			"id = ?",
			id,
		).
		First(&user).Error

	if err != nil {

		c.JSON(
			http.StatusNotFound,
			gin.H{
				"error": "user not found",
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		user,
	)
}

func AdminStatsHandler(
	c *gin.Context,
) {

	var userCount int64

	db.DB.
		Model(&auth.User{}).
		Count(&userCount)

	activeTraders, err :=
		service.GetActiveTraders()

	if err != nil {

		activeTraders =
			[]string{}
	}

	c.JSON(
		http.StatusOK,
		gin.H{

			"users": userCount,

			"active_traders": len(activeTraders),

			"engines": service.EngineCount(),

			"ws_clients": websocket.ClientCount(),

			"queue_depth": len(service.CrossJobs),
		},
	)
}

func AdminUsersHandler(
	c *gin.Context,
) {

	var users []auth.User

	err := db.DB.
		Find(&users).Error

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "failed to fetch users",
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"users": users,
		},
	)
}
func AdminActivateSubscriptionHandler(
	c *gin.Context,
) {

	id := c.Param("id")

	var user auth.User

	err := db.DB.
		Where(
			"id = ?",
			id,
		).
		First(&user).Error

	if err != nil {

		c.JSON(
			http.StatusNotFound,
			gin.H{
				"error": "user not found",
			},
		)

		return
	}

	err = db.DB.
		Model(&user).
		Update(
			"subscription_active",
			true,
		).Error

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "failed to activate subscription",
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"message": "subscription activated",
		},
	)
}
func AdminDeactivateSubscriptionHandler(
	c *gin.Context,
) {

	id := c.Param("id")

	var user auth.User

	err := db.DB.
		Where(
			"id = ?",
			id,
		).
		First(&user).Error

	if err != nil {

		c.JSON(
			http.StatusNotFound,
			gin.H{
				"error": "user not found",
			},
		)

		return
	}

	err = db.DB.
		Model(&user).
		Update(
			"subscription_active",
			false,
		).Error

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "failed to deactivate subscription",
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"message": "subscription deactivated",
		},
	)
}

func AdminSystemHandler(
	c *gin.Context,
) {

	activeTraders, err :=
		service.GetActiveTraders()

	if err != nil {

		activeTraders =
			[]string{}
	}

	c.JSON(
		http.StatusOK,
		gin.H{

			"queue_depth": len(service.CrossJobs),

			"active_traders": len(activeTraders),

			"engines": service.EngineCount(),

			"ws_clients": websocket.ClientCount(),

			"workers": 10,
		},
	)
}

func AdminUserTradesHandler(
	c *gin.Context,
) {

	userID :=
		c.Param("id")

	var user auth.User

	err := db.DB.
		Where(
			"id = ?",
			userID,
		).
		First(&user).Error

	if err != nil {

		c.JSON(
			http.StatusNotFound,
			gin.H{
				"error": "user not found",
			},
		)

		return
	}

	var trades []paper.Trade

	err = db.DB.
		Where(
			"user_id = ?",
			userID,
		).
		Order(
			"created_at DESC",
		).
		Find(&trades).Error

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "failed to fetch trades",
			},
		)

		return
	}

	var totalProfit float64

	for _, trade := range trades {

		totalProfit +=
			trade.ProfitUSDT
	}

	c.JSON(
		http.StatusOK,
		gin.H{

			"user": gin.H{

				"id": user.ID,

				"name": user.Name,

				"email": user.Email,
			},

			"stats": gin.H{

				"total_trades": len(trades),

				"total_profit": totalProfit,
			},

			"trades": trades,
		},
	)
}
