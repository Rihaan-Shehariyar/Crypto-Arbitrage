package service

import (
	"crypto-arbitrage/internal/auth"
	"log"
	"sync"
	"time"
)

var userCacheMu sync.RWMutex

var cachedUsers []auth.User

// -----------------------------------
// START USER CACHE
// -----------------------------------

func StartUserCache() {

	RefreshUsers()

	go func() {

		ticker :=
			time.NewTicker(
				30 * time.Second,
			)

		defer ticker.Stop()

		for range ticker.C {

			RefreshUsers()
		}
	}()
}

// -----------------------------------
// REFRESH USERS
// -----------------------------------

func RefreshUsers() {

	users, err :=
		auth.GetAllUsers()

	if err != nil {

		log.Println(
			"[USER CACHE] refresh failed:",
			err,
		)

		return
	}

	userCacheMu.Lock()

	cachedUsers = users

	userCacheMu.Unlock()

	log.Printf(
		"[USER CACHE] refreshed (%d users)",
		len(users),
	)
}

// -----------------------------------
// GET USERS
// -----------------------------------

func GetCachedUsers() []auth.User {

	userCacheMu.RLock()
	defer userCacheMu.RUnlock()

	users :=
		make(
			[]auth.User,
			len(cachedUsers),
		)

	copy(
		users,
		cachedUsers,
	)

	return users
}
