package websocket

import "encoding/json"

// -----------------------------------
// PRIVATE BROADCAST
// -----------------------------------

func BroadcastToUser(

	userID string,

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

		if client.UserID != userID {
			continue
		}

		select {

		case client.Send <- data:

		default:

			close(client.Send)

			delete(Clients, client)

			client.Conn.Close()
		}
	}
}
