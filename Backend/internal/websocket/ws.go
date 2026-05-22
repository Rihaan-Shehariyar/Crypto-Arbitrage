package websocket

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// -----------------------------------
// GLOBAL CLIENTS
// -----------------------------------

var (
	Clients = make(map[*Client]bool)

	mu sync.RWMutex
)

// -----------------------------------
// UPGRADE
// -----------------------------------

func Upgrade(
	w http.ResponseWriter,
	r *http.Request,
) (*websocket.Conn, error) {

	return upgrader.Upgrade(
		w,
		r,
		nil,
	)
}

// -----------------------------------
// ADD CLIENT
// -----------------------------------

func AddClient(

	conn *websocket.Conn,

	userID string,
) {

	client := &Client{

		Conn: conn,

		Send: make(chan []byte, 256),

		UserID: userID,
	}

	mu.Lock()

	Clients[client] = true

	mu.Unlock()

	// -----------------------------------
	// WRITE LOOP
	// -----------------------------------

	go client.WritePump()

	// -----------------------------------
	// READ LOOP
	// -----------------------------------

	go func() {

		defer func() {

			mu.Lock()

			delete(Clients, client)

			mu.Unlock()

			close(client.Send)

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

// -----------------------------------
// GLOBAL BROADCAST
// -----------------------------------

func Broadcast(

	eventType string,

	payload interface{},
) {

	message := Message{

		Type: eventType,

		Payload: payload,
	}

	data, err :=
		json.Marshal(message)

	if err != nil {
		return
	}

	mu.Lock()
	defer mu.Unlock()

	for client := range Clients {

		select {

		// -----------------------------------
		// NON-BLOCKING SEND
		// -----------------------------------

		case client.Send <- data:

		// -----------------------------------
		// CLIENT TOO SLOW
		// -----------------------------------

		default:

			close(client.Send)

			delete(Clients, client)

			client.Conn.Close()
		}
	}
}



// -----------------------------------
// CLIENT COUNT
// -----------------------------------

func ClientCount() int {

	mu.RLock()
	defer mu.RUnlock()

	return len(Clients)
}

// -----------------------------------
// CLOSE ALL
// -----------------------------------

func CloseAll() {

	mu.Lock()
	defer mu.Unlock()

	for client := range Clients {

		close(client.Send)

		client.Conn.Close()

		delete(Clients, client)
	}
}
