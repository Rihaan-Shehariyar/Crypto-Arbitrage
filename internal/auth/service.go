package auth

import (
	"context"
	"crypto-arbitrage/internal/db"
	"errors"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func Register(email, password string) error {

	var exists bool

	err := db.DB.QueryRow(context.Background(),
		"SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)", email,
	).Scan(&exists)

	if err != nil {
		return err
	}

	if exists {
		return errors.New("user already exists")
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	id := uuid.NewString()

	_, err = db.DB.Exec(context.Background(),
		"INSERT INTO users (id, email, password) VALUES ($1, $2, $3)",
		id, email, string(hash),
	)

	return err
}

func Login(email, password string) (string, error) {

	var user User

	err := db.DB.QueryRow(context.Background(),
		"SELECT id, email, password FROM users WHERE email=$1",
		email,
	).Scan(&user.ID, &user.Email, &user.Password)

	if err != nil {
		return "", errors.New("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return "", errors.New("invalid credentials")
	}

	return user.ID, nil 
}
