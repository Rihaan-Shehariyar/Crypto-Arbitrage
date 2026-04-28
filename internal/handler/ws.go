package handler

import (
	"log"

	"crypto-arbitrage/internal/websocket"

	"github.com/gin-gonic/gin"
)

func HandleWebSocket(c *gin.Context) {

	log.Println("📡 WS request received")

	conn, err := websocket.Upgrade(c.Writer, c.Request)
	if err != nil {
		log.Println("❌ Upgrade error:", err)
		return
	}

	log.Println("✅ WebSocket connected")

	websocket.AddClient(conn)
	log.Println("Clients:", len(websocket.Clients))
}
