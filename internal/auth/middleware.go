package auth

import (
	"crypto-arbitrage/internal/db"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {

	return func(c *gin.Context) {
		authHeader := c.GetHeader(
			"Authorization",
		)

		if authHeader == "" {

			authHeader =
				c.Query("token")
		}

		if authHeader == "" {

			c.JSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "missing token",
				},
			)

			c.Abort()

			return
		}

		token := authHeader

		const bearer = "Bearer "

		if len(authHeader) > len(bearer) &&
			authHeader[:len(bearer)] == bearer {

			token =
				authHeader[len(bearer):]
		}

		userID, err := ValidateToken(
			token,
		)

		if err != nil {

			c.JSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "invalid token",
				},
			)

			c.Abort()

			return
		}

		var user User

		err = db.DB.
			Where("id = ?", userID).
			First(&user).Error

		if err != nil {

			c.JSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "user not found",
				},
			)

			c.Abort()

			return
		}

		c.Set("user", user)

		c.Next()
	}
}
