package service

import (
	"log"
	"strings"
)

type Triangle struct {
	Base  string
	Alt   string
	Quote string
}

var triangles []Triangle

func normalize(s string) string {
	return strings.ToUpper(strings.ReplaceAll(s, "-", ""))
}

func InitTriangles(symbols []string) {

	pairs := make(map[string]bool)
	usdtAssets := make(map[string]bool)

	// 🔥 allowed base assets (important)
	allowedBases := map[string]bool{
		"BTC": true,
		"ETH": true,
		"BNB": true,
	}

	for _, s := range symbols {
		s = normalize(s)

		pairs[s] = true

		if strings.HasSuffix(s, "USDT") {
			base := strings.TrimSuffix(s, "USDT")
			usdtAssets[base] = true
		}
	}

	for base := range usdtAssets {

		if !allowedBases[base] {
			continue
		}

		for alt := range usdtAssets {

			if base == alt {
				continue
			}

			p1 := base + "USDT"
			p2 := alt + base
			p3 := alt + "USDT"

			if pairs[p1] && pairs[p2] && pairs[p3] {

				triangles = append(triangles, Triangle{
					Base:  base,
					Alt:   alt,
					Quote: "USDT",
				})
			}
		}
	}

	log.Println("Triangles count:", len(triangles))

	for i := 0; i < len(triangles) && i < 5; i++ {
		t := triangles[i]
		log.Printf("Triangle: %s-%s-%s", t.Base, t.Alt, t.Quote)
	}
}
