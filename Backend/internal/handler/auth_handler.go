package handler

import (
	"context"
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/db"
	"crypto-arbitrage/internal/grpc/payment"
	"os"

	"google.golang.org/api/idtoken"

	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RegisterHandler(c *gin.Context) {
	log.Println("REGISTER HIT")

	var body struct {
		Name            string `json:"name" binding:"required"`
		Email           string `json:"email" binding:"required,email"`
		Password        string `json:"password" binding:"required,min=6"`
		ConfirmPassword string `json:"confirm_password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	if body.Password !=
		body.ConfirmPassword {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": "passwords do not match",
			},
		)

		return
	}

	err := auth.Register(body.Name, body.Email, body.Password)
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

			"user": gin.H{
				"id":                  user.ID,
				"name":                user.Name,
				"email":               user.Email,
				"role":                user.Role,
				"subscription_active": user.SubscriptionActive,
				"trading_enabled":     user.TradingEnabled,
			},
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

		log.Println(
			"SUBSCRIPTION ERROR:",
			err,
		)
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": err,
			},
		)

		return
	}

	if resp.Success {

		user.SubscriptionActive = true
		log.Println(
			"USER ID:",
			user.ID,
		)

		log.Println(
			"SUB BEFORE:",
			user.SubscriptionActive,
		)
		if err := db.DB.
			Save(&user).Error; err != nil {

			log.Println(
				"DB SAVE ERROR:",
				err,
			)
		}
		log.Println(
			"SUB AFTER:",
			user.SubscriptionActive,
		)
	}

	c.JSON(
		http.StatusOK,
		gin.H{

			"success": true,

			"message": "subscription activated",

			"transaction_id": resp.TransactionId,

			"subscription_active": true,
		},
	)
}

func GoogleRegister(
	c *gin.Context,
) {

	type GoogleAuthRequest struct {
		Token string `json:"token"`
	}

	var req GoogleAuthRequest

	if err := c.ShouldBindJSON(&req); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": "invalid request",
			},
		)

		return
	}

	// -----------------------------------
	// VALIDATE GOOGLE TOKEN
	// -----------------------------------

	payload, err := idtoken.Validate(

		context.Background(),

		req.Token,

		os.Getenv("GOOGLE_CLIENT_ID"),
	)

	if err != nil {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"error": "invalid google token",
			},
		)

		return
	}

	email :=
		payload.Claims["email"].(string)

	name :=
		payload.Claims["name"].(string)

	// -----------------------------------
	// CHECK IF USER EXISTS
	// -----------------------------------

	var existing auth.User

	err = db.DB.
		Where(
			"email = ?",
			email,
		).
		First(&existing).Error

	if err == nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": "user already exists",
			},
		)

		return
	}

	// -----------------------------------
	// CREATE USER
	// -----------------------------------

	user := auth.User{

		ID: uuid.NewString(),

		Name: name,

		Email: email,

		SubscriptionActive: false,

		TradingEnabled: false,
	}

	if err := db.DB.
		Create(&user).Error; err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "failed to create user",
			},
		)

		return
	}

	// -----------------------------------
	// GENERATE JWT
	// -----------------------------------

	token, err := auth.GenerateToken(
		user.ID,
	)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "failed to generate token",
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

			"token": token,

			"subscription_active": user.SubscriptionActive,

			"user": gin.H{

				"id": user.ID,

				"name": user.Name,

				"email": user.Email,
			},
		},
	)
}
func GoogleLogin(
	c *gin.Context,
) {

	type GoogleAuthRequest struct {
		Token string `json:"token"`
	}

	var req GoogleAuthRequest

	if err := c.ShouldBindJSON(&req); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": "invalid request",
			},
		)

		return
	}

	payload, err := idtoken.Validate(
		context.Background(),
		req.Token,
		os.Getenv("GOOGLE_CLIENT_ID"),
	)

	if err != nil {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"error": "invalid google token",
			},
		)

		return
	}

	email :=
		payload.Claims["email"].(string)

	name :=
		payload.Claims["name"].(string)

	log.Println(
		"google login:",
		email,
		name,
	)

	// -----------------------------------
	// FIND EXISTING USER
	// -----------------------------------

	var user auth.User

	err = db.DB.
		Where(
			"email = ?",
			email,
		).
		First(&user).Error

	if err != nil {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"error": "user not registered",
			},
		)

		return
	}
	// -----------------------------------
	// GENERATE JWT
	// -----------------------------------

	token, _, err :=
		auth.LoginGoogle(
			user,
		)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "failed to generate token",
			},
		)

		return
	}

	// -----------------------------------
	// SUCCESS RESPONSE
	// -----------------------------------

	c.JSON(
		http.StatusOK,
		gin.H{
			"token": token,

			"user": gin.H{
				"id":                  user.ID,
				"name":                user.Name,
				"email":               user.Email,
				"role":                user.Role,
				"subscription_active": user.SubscriptionActive,
				"trading_enabled":     user.TradingEnabled,
			},
		},
	)
}
