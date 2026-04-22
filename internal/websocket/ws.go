package websocket

import (
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var (
	Clients = make(map[*websocket.Conn]bool)
	mu      sync.Mutex
)

func Upgrade(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	return upgrader.Upgrade(w, r, nil)
}

func AddClient(conn *websocket.Conn) {
	mu.Lock()
	Clients[conn] = true
	mu.Unlock()

	// Listen for disconnect
	go func() {
		defer func() {
			mu.Lock()
			delete(Clients, conn)
			mu.Unlock()
			conn.Close()
		}()

		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				return
			}
		}
	}()
}

func Broadcast(data interface{}) {
	mu.Lock()
	defer mu.Unlock()

	for client := range Clients {
		err := client.WriteJSON(data)
		if err != nil {
			client.Close()
			delete(Clients, client)
		}
	}
}

func CloseAll() {
	mu.Lock()
	defer mu.Unlock()

	for client := range Clients {
		client.Close()
		delete(Clients, client)
	}
}
