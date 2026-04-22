package handler

import (
	"crypto-arbitrage/internal/websocket"

	"github.com/gin-gonic/gin"
)


func HandleWebSocket(ctx *gin.Context) {

	conn, err := websocket.Upgrade(ctx.Writer, ctx.Request)
	if err != nil {
		return
	}

	websocket.AddClient(conn)
}
