package handler

import (
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/db"
	"crypto-arbitrage/internal/gRPC/payment"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func RegisterHandler(c *gin.Context) {
	log.Println("REGISTER HIT")

	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	err := auth.Register(body.Email, body.Password)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "registered"})
}

func LoginHandler(c *gin.Context) {

	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	token, user, err := auth.Login(body.Email, body.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{

			"token": token,

			"subscription_active": user.SubscriptionActive,
		},
	)
}

func ActivateSubscriptionHandler(
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

	resp, err :=
		payment.ProcessPayment(

			user.ID,

			49,
		)
	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "payment failed",
			},
		)

		return
	}

	if resp.Success {

		user.SubscriptionActive = true

		db.DB.Save(&user)
	}

	user.SubscriptionActive = true

	db.DB.Save(&user)

	c.JSON(
		http.StatusOK,
		gin.H{

			"message": "subscription activated",

			"transaction_id": resp.TransactionId,
		},
	)
}
