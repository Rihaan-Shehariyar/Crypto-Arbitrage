package auth

import (
	"crypto-arbitrage/internal/db"
	"errors"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func Register(
	email string,
	password string,
) error {

	var existing User

	err := db.DB.
		Where("email = ?", email).
		First(&existing).Error

	// user already exists
	if err == nil {
		return errors.New(
			"user already exists",
		)
	}

	hash, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)

	if err != nil {
		return err
	}

	user := User{

		ID: uuid.NewString(),

		Email: email,

		Password: string(hash),
	}

	return db.DB.Create(&user).Error
}

func Login(
	email string,
	password string,
) (string, error) {

	var user User

	err := db.DB.
		Where("email = ?", email).
		First(&user).Error

	if err != nil {

		return "",
			errors.New(
				"invalid credentials",
			)
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(user.Password),
		[]byte(password),
	)

	if err != nil {

		return "",
			errors.New(
				"invalid credentials",
			)
	}

	token, err := GenerateToken(user.ID)
	if err != nil {
		return "", err
	}

	return token, nil
}

func GetAllUsers() ([]User, error) {

	var users []User

	err := db.DB.
		Where(
			"trading_enabled = ?",
			true,
		).
		Find(&users).Error

	return users, err
}
