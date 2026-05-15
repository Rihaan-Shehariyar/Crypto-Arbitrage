package handler

import (
	"log"

	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/websocket"

	"github.com/gin-gonic/gin"
)

func HandleWebSocket(c *gin.Context) {

	log.Println(" WS request received")

	token :=
		c.Query("token")

	if token == "" {

		c.JSON(
			401,
			gin.H{
				"error": "missing token",
			},
		)

		return
	}

	userID, err :=
		auth.ValidateToken(token)

	if err != nil {

		c.JSON(
			401,
			gin.H{
				"error": "invalid token",
			},
		)

		return
	}

	conn, err := websocket.Upgrade(c.Writer, c.Request)
	if err != nil {
		log.Println(" Upgrade error:", err)
		return
	}

	log.Println(" WebSocket connected")

	websocket.AddClient(conn, userID)
	log.Println("Clients:", len(websocket.Clients))
}
