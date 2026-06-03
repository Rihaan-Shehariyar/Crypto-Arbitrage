package websocket

import (
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait = 10 * time.Second

	pongWait = 60 * time.Second

	pingPeriod = (pongWait * 9) / 10
)

type Client struct {
	Conn *websocket.Conn

	Send chan []byte

	UserID string

	once sync.Once
}

func (c *Client) Close() {

	c.once.Do(func() {

		close(c.Send)

		c.Conn.Close()
	})
}

// -----------------------------------
// WRITE PUMP
// -----------------------------------
func (c *Client) WritePump() {

	ticker :=
		time.NewTicker(
			pingPeriod,
		)

	defer func() {

		ticker.Stop()

		c.Close()
	}()

	for {

		select {

		// -----------------------------------
		// SEND MESSAGE
		// -----------------------------------

		case msg, ok :=
			<-c.Send:

			c.Conn.SetWriteDeadline(
				time.Now().Add(
					writeWait,
				),
			)

			if !ok {

				c.Conn.WriteMessage(
					websocket.CloseMessage,
					[]byte{},
				)

				return
			}

			err :=
				c.Conn.WriteMessage(
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

		// -----------------------------------
		// HEARTBEAT PING
		// -----------------------------------

		case <-ticker.C:

			c.Conn.SetWriteDeadline(
				time.Now().Add(
					writeWait,
				),
			)

			err :=
				c.Conn.WriteMessage(
					websocket.PingMessage,
					nil,
				)

			if err != nil {

				log.Println(
					"[WS] ping failed:",
					err,
				)

				return
			}
		}
	}
}
