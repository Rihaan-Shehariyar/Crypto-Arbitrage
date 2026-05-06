package account

import (
	"crypto-arbitrage/broker"
	"crypto-arbitrage/internal/auth"
	"log"
)

// CreateUserBrokers creates exchange brokers
// dynamically from user exchange keys.
func CreateUserBrokers(
	keys []auth.ExchangeKey,
) map[string]broker.Broker {

	result := make(map[string]broker.Broker)

	for _, k := range keys {

		switch k.Exchange {

		case "binance":

			log.Println("[BROKER] initializing binance")

			result["binance"] = broker.NewBinance(
				k.APIKey,
				k.APISecret,
			)

		// -------------------------
		// FUTURE EXCHANGES
		// -------------------------

		case "bybit":

			log.Println("[BROKER] bybit not implemented yet")

		case "okx":

			log.Println("[BROKER] okx not implemented yet")

		case "gate":

			log.Println("[BROKER] gate not implemented yet")

		default:

			log.Println(
				"[BROKER] unsupported exchange:",
				k.Exchange,
			)
		}
	}

	return result
}
