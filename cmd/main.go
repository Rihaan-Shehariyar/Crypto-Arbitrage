package main

import (
	"context"
	"crypto-arbitrage/broker"
	"crypto-arbitrage/internal/exchange"
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/handler"
	"crypto-arbitrage/internal/service"
	"crypto-arbitrage/internal/websocket"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {

	godotenv.Load()

	// -----------------------------
	// 🧠 Context (for shutdown)
	// -----------------------------
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// -----------------------------
	// 📡 Feed (shared stream)
	// -----------------------------
	f := feed.NewFeed()

	// -----------------------------
	// 🔌 WebSocket feeds (market data)
	// -----------------------------
	binanceWS := exchange.BinanceWS{}
	binanceWS.Start(f, []string{
		"BTCUSDT",
		"ETHUSDT",
		"SOLUSDT",
	})

	bybitWS := exchange.BybitWS{}
	bybitWS.Start(f, []string{
		"BTCUSDT",
		"ETHUSDT",
		"SOLUSDT",
	})

	kucoinWS := exchange.KucoinWS{}
	kucoinWS.Start(f, []string{
		"BTC-USDT",
		"ETH-USDT",
		"SOL-USDT",
	})

	// -----------------------------
	// 🏦 Brokers (trading layer)
	// -----------------------------
	bybitBroker := broker.NewBybit(
		os.Getenv("BYBIT_KEY"),
		os.Getenv("BYBIT_SECRET"),
	)

	binanceBroker := broker.NewBinance(
		os.Getenv("BINANCE_KEY"),
		os.Getenv("BINANCE_SECRET"),
	)

	kucoinBroker := broker.NewKucoin(
		os.Getenv("KUCOIN_KEY"),
		os.Getenv("KUCOIN_SECRET"),
		os.Getenv("KUCOIN_PASSPHRASE"),
	)

	// // =======================
	// // 🧪 TEST BLOCK (REMOVE LATER)
	// // =======================

	// log.Println("🧪 Testing Binance Market Buy...")

	// buyOrderId, err := binanceBroker.MarketBuy("BTCUSDT", 10)
	// if err != nil {
	// 	log.Println("BUY error:", err)
	// } else {
	// 	log.Println("BUY order placed:", buyOrderId)
	// }

	// // ⏳ small delay to ensure fill
	// time.Sleep(500 * time.Millisecond)

	// // 🔍 fetch filled info
	// buyInfo, err := binanceBroker.GetOrderInfo("BTCUSDT", buyOrderId)
	// if err != nil {
	// 	log.Println("BUY info error:", err)
	// } else {
	// 	log.Printf("BUY FILLED: qty=%.6f avgPrice=%.2f",
	// 		buyInfo.FilledQty,
	// 		buyInfo.AvgPrice,
	// 	)
	// }

	// // =======================
	// // 🔴 SELL TEST
	// // =======================

	// log.Println("🧪 Testing SELL...")

	// sellOrderId, err := binanceBroker.MarketSell("BTCUSDT", buyInfo.FilledQty)
	// if err != nil {
	// 	log.Println("SELL error:", err)
	// } else {
	// 	log.Println("SELL order placed:", sellOrderId)
	// }

	// // check final balance
	// balance, _ := binanceBroker.GetBalance()
	// log.Println("BALANCE AFTER SELL:", balance)

	// =======================
	// END TEST BLOCK
	// =======================

	// -----------------------------
	// 🧩 Broker map (IMPORTANT)
	// -----------------------------
	brokers := map[string]broker.Broker{
		"bybit":   bybitBroker,
		"binance": binanceBroker,
		"kucoin":  kucoinBroker,
	}

	// -----------------------------
	// ⚙️ Start Engine
	// -----------------------------
	service.StartEngine(ctx, f, brokers)

	// -----------------------------
	// 🌐 HTTP + WebSocket Server
	// -----------------------------
	r := gin.Default()

	r.GET("/ws", handler.HandleWebSocket)

	srv := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	go func() {
		log.Println("🚀 Server running on :8080")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %s\n", err)
		}

	}()

	// -----------------------------
	// 🛑 Graceful Shutdown
	// -----------------------------
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	<-quit
	log.Println("🛑 Shutdown signal received")

	cancel() // stop engine

	ctxTimeout, cancelTimeout := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelTimeout()

	if err := srv.Shutdown(ctxTimeout); err != nil {
		log.Fatal("Server forced shutdown:", err)
	}

	log.Println("🔌 Closing WebSocket connections...")
	websocket.CloseAll()

	log.Println("✅ Server exited gracefully")
}
