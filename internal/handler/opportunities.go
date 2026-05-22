package handler

import (
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/db"
	"crypto-arbitrage/internal/opportunity"
	"net/http"

	"github.com/gin-gonic/gin"
)

func OpportunitiesHandler(
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

	var opportunities []opportunity.Opportunity

	err := db.DB.
		Where(
			"user_id = ?",
			user.ID,
		).
		Order("created_at DESC").
		Limit(100).
		Find(&opportunities).Error

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		opportunities,
	)
}
