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
func Broadcast(
	eventType string,
	payload interface{},
) {

	message := Message{

		Type: eventType,

		Payload: payload,
	}

	mu.Lock()
	defer mu.Unlock()

	for client := range Clients {

		err := client.WriteJSON(message)

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
func ClientCount() int {

	mu.Lock()
	defer mu.Unlock()

	return len(Clients)
}
