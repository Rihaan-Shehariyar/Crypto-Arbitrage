package auth

import (
	"context"
	"crypto-arbitrage/internal/db"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		token := c.GetHeader("Authorization")

		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			c.Abort()
			return
		}

		var user User

		err := db.DB.QueryRow(context.Background(),
			"SELECT id, email FROM users WHERE id=$1",
			token,
		).Scan(&user.ID, &user.Email)

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		c.Set("user", user)
		c.Next()
	}
}
