package auth

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt"
)

var jwtKey = []byte(os.Getenv("JWT_SECRET"))

func GenerateToken(userID string) (string, error) {

	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString(jwtKey)

}

func ValidateToken(tokenString string) (string, error) {

	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		_, ok := t.Method.(*jwt.SigningMethodHMAC)
		if !ok {
			return nil, errors.New(
				"invalid token",
			)
		}

		return jwtKey, nil
	})

	if err != nil || token.Valid {
		return "", errors.New("Invalid Token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)

	if !ok {
		return "", errors.New("invalid claims")
	}

	userID, ok := claims["user_id"].(string)

	if !ok {

		return "", errors.New(
			"invalid user id",
		)
	}

	return userID, nil
}
