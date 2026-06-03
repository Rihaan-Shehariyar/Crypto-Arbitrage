package websocket

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {

		origin :=
			r.Header.Get("Origin")

		return origin ==
			"http://localhost:5173"
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
	conn.SetReadDeadline(
		time.Now().Add(
			pongWait,
		),
	)

	conn.SetPongHandler(
		func(string) error {

			conn.SetReadDeadline(
				time.Now().Add(
					pongWait,
				),
			)

			return nil
		},
	)

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

			client.Close()

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

	// -----------------------------------
	// COPY CLIENTS
	// -----------------------------------

	mu.RLock()

	clients :=
		make(
			[]*Client,
			0,
			len(Clients),
		)

	for client := range Clients {

		clients =
			append(
				clients,
				client,
			)
	}

	mu.RUnlock()

	// -----------------------------------
	// BROADCAST OUTSIDE LOCK
	// -----------------------------------

	for _, client := range clients {

		select {

		case client.Send <- data:

		default:

			mu.Lock()

			delete(
				Clients,
				client,
			)

			mu.Unlock()

			client.Close()
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

		client.Close()
		delete(Clients, client)
	}
}
