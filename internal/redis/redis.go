package redis

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"
)

var Ctx =
	context.Background()

var Client *redis.Client

func InitRedis() {
log.Println(
	"[REDIS] connected")
	Client =
		redis.NewClient(

			&redis.Options{

				Addr:
					"localhost:6379",
			},
		)
}