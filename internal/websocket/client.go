package websocket

import (
	"log"

	"github.com/gorilla/websocket"
)

type Client struct {
	Conn *websocket.Conn

	Send chan []byte

	UserID string
}

// -----------------------------------
// WRITE PUMP
// -----------------------------------

func (c *Client) WritePump() {

	defer c.Conn.Close()

	for msg := range c.Send {

		err := c.Conn.WriteMessage(
			websocket.TextMessage,
			msg,
		)

		if err != nil {

			log.Println(
				"[WS] write error:",
				err,
			)

			return
		}
	}
}
