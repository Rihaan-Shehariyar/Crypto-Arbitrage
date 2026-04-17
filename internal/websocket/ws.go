package websocket

import (
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var Clients = make(map[*websocket.Conn]bool)

func Upgrade(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	return upgrader.Upgrade(w, r, nil)
}

func AddClient(conn *websocket.Conn) {
	Clients[conn] = true
}

func Broadcast(data interface{}) {
	for client := range Clients {
		err := client.WriteJSON(data)
		if err != nil {
			client.Close()
			delete(Clients, client)
		}
	}
}
