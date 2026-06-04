package seeder

import (
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/db"
	"log"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func SeedAdmin() {

	var existing auth.User

	err := db.DB.
		Where(
			"email = ?",
			"admin@arbitra.com",
		).
		First(&existing).Error

	if err == nil {

		log.Println(
			"[SEEDER] admin already exists",
		)

		return
	}

	hash, _ :=
		bcrypt.GenerateFromPassword(
			[]byte("Admin@123"),
			bcrypt.DefaultCost,
		)

	admin := auth.User{
		ID: uuid.NewString(),

		Name: "Administrator",

		Email: "admin@arbitra.com",

		Password: string(hash),

		Role: "admin",

		SubscriptionActive: true,
	}

	err = db.DB.
		Create(&admin).Error

	if err != nil {

		log.Println(
			"[SEEDER] failed:",
			err,
		)

		return
	}

	log.Println(
		"[SEEDER] admin created",
	)
}
