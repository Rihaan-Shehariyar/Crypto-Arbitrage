package auth

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt"
)

func getJWTKey() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return []byte("super-secret-key")
	}
	return []byte(secret)
}

func GenerateToken(userID string) (string, error) {

	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(30 * time.Minute).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString(getJWTKey())

}

func ValidateToken(tokenString string) (string, error) {

	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		_, ok := t.Method.(*jwt.SigningMethodHMAC)
		if !ok {
			return nil, errors.New(
				"invalid token",
			)
		}

		return getJWTKey(), nil
	})

	if err != nil || !token.Valid {
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
