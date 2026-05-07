package main

import (
	"context"
	"crypto-arbitrage/broker"
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/db"
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

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {

	godotenv.Load()

	db.Connect()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	//  CONFIG

	service.CurrentMode = service.Cross
	service.Simulate = true

	log.Println("Mode:", service.CurrentMode)
	log.Println("Simulation:", service.Simulate)

	//  FEED

	f := feed.NewFeed()

	binanceWS := exchange.BinanceWS{}
	binanceWS.Start(f, []string{
		"BTCUSDT",
		"ETHUSDT",
		"SOLUSDT",
		"ETHBTC",
		"SOLBTC",
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

	okxWS := exchange.OKXWS{}
	okxWS.Start(f, []string{
		"BTC-USDT",
		"ETH-USDT",
		"SOL-USDT",
	})

	gateWS := exchange.GateWS{}
	gateWS.Start(f, []string{
		"BTCUSDT",
		"ETHUSDT",
		"SOLUSDT",
	})

	// BROKER

	binanceBroker := broker.NewBinance(
		os.Getenv("BINANCE_KEY"),
		os.Getenv("BINANCE_SECRET"),
	)

	brokers := map[string]broker.Broker{
		"binance": binanceBroker,
	}

	log.Println("Brokers initialized")

	// TRIANGLES

	symbols, err := service.FetchBinanceSymbols()
	if err != nil {
		log.Fatal(err)
	}

	service.InitTriangles(symbols)
	log.Println("Triangles initialized")

	//  WAIT FOR DATA

	log.Println("Waiting for market data...")
	time.Sleep(2 * time.Second)

	// ENGINE
	service.SetBrokers(brokers)
	go service.StartBalanceWorker(brokers)
	go service.StartEngine(ctx, f, brokers)

	// API

	r := gin.Default()
	r.Use(cors.Default())

	r.GET("/ws", handler.HandleWebSocket)
	r.POST("/register", handler.RegisterHandler)
	r.POST("/login", handler.LoginHandler)

	// Protected routes
	authGroup := r.Group("/")
	authGroup.Use(auth.AuthMiddleware())

	authGroup.GET("/balance", handler.GetBalanceHandler(brokers))
	authGroup.GET("/paper/balance", handler.GetPaperBalance)
	authGroup.GET("/trades", handler.GetTrades)
	authGroup.POST(
		"/exchange-keys",
		handler.SaveExchangeKeyHandler,
	)

	authGroup.GET(
		"/exchange-keys",
		handler.GetExchangeKeysHandler,
	)

	srv := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	go func() {
		log.Println("Server running on :8080")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	//  SHUTDOWN

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	<-quit
	log.Println("Shutdown signal received")

	cancel()

	ctxTimeout, cancelTimeout := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelTimeout()

	srv.Shutdown(ctxTimeout)

	websocket.CloseAll()
	log.Println("Server exited")
}
