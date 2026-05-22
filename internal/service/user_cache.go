package service

import (
	"crypto-arbitrage/internal/redis"
	"log"
)

func AddActiveTrader(
	userID string,
) error {
	log.Printf(
		"[REDIS] added trader %s",
		userID,
	)
	return redis.Client.SAdd(

		redis.Ctx,

		"active_traders",

		userID,
	).Err()
}

func RemoveActiveTrader(
	userID string,
) error {

	return redis.Client.SRem(

		redis.Ctx,

		"active_traders",

		userID,
	).Err()
}
func GetActiveTraders() (
	[]string,
	error,
) {

	return redis.Client.SMembers(

		redis.Ctx,

		"active_traders",
	).Result()
}
