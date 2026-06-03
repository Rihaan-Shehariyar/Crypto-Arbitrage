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

	// -----------------------------------
	// COPY TARGET CLIENTS
	// -----------------------------------

	mu.RLock()

	clients :=
		make([]*Client, 0)

	for client := range Clients {

		if client.UserID != userID {
			continue
		}

		clients =
			append(
				clients,
				client,
			)
	}

	mu.RUnlock()

	// -----------------------------------
	// SEND OUTSIDE LOCK
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
