package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func AdminMiddleware() gin.HandlerFunc {

	return func(c *gin.Context) {

		userValue, exists := c.Get("user")

		if !exists {

			c.JSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "unauthorized",
				},
			)

			c.Abort()

			return
		}

		user := userValue.(User)

		if user.Role != "admin" {

			c.JSON(
				http.StatusForbidden,
				gin.H{
					"error": "admin access required",
				},
			)

			c.Abort()

			return
		}

		c.Next()
	}
}
