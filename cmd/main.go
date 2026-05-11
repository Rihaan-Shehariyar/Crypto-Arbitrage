package main

import (
	"context"
	"crypto-arbitrage/broker"
	"crypto-arbitrage/internal/auth"
	"crypto-arbitrage/internal/db"
	"crypto-arbitrage/internal/exchange"
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/handler"
	"crypto-arbitrage/internal/paper"
	"crypto-arbitrage/internal/recovery"
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

	// -----------------------------------
	// ENV
	// -----------------------------------

	godotenv.Load()

	// -----------------------------------
	// DATABASE
	// -----------------------------------

	db.Connect()

	db.DB.AutoMigrate(
		&paper.Trade{},
		&auth.User{},
	)

	// -----------------------------------
	// RECOVERY
	// -----------------------------------

	recovery.RecoverTrades()

	// -----------------------------------
	// CONTEXT
	// -----------------------------------

	ctx, cancel :=
		context.WithCancel(
			context.Background(),
		)

	defer cancel()

	// -----------------------------------
	// ENGINE CONFIG
	// -----------------------------------

	service.CurrentMode =
		service.Cross

	service.Simulate = true

	log.Println(
		"Mode:",
		service.CurrentMode,
	)

	log.Println(
		"Simulation:",
		service.Simulate,
	)

	// -----------------------------------
	// FEED
	// -----------------------------------

	f := feed.NewFeed()

	_ = f

	// -----------------------------------
	// EXCHANGES
	// -----------------------------------

	symbols := []string{
		"BTCUSDT",
		"ETHUSDT",
		"SOLUSDT",
	}

	exchange.RunExchange(
		&exchange.BinanceWS{},
		symbols,
	)

	exchange.RunExchange(
		&exchange.BybitWS{},
		symbols,
	)

	exchange.RunExchange(
		&exchange.KucoinWS{},
		symbols,
	)

	exchange.RunExchange(
		&exchange.GateWS{},
		symbols,
	)

	exchange.RunExchange(
		&exchange.OKXWS{},
		symbols,
	)

	// -----------------------------------
	// BROKERS
	// -----------------------------------

	binanceBroker :=
		broker.NewBinance(
			os.Getenv("BINANCE_KEY"),
			os.Getenv("BINANCE_SECRET"),
		)

	brokers :=
		map[string]broker.Broker{

			"binance": binanceBroker,
		}

	service.SetBrokers(
		brokers,
	)

	log.Println(
		"Brokers initialized",
	)

	// -----------------------------------
	// TRIANGLES
	// -----------------------------------

	allSymbols, err :=
		service.FetchBinanceSymbols()

	if err != nil {
		log.Fatal(err)
	}

	service.InitTriangles(
		allSymbols,
	)

	log.Println(
		"Triangles initialized",
	)

	// -----------------------------------
	// WAIT FOR MARKET DATA
	// -----------------------------------

	log.Println(
		"Waiting for market data...",
	)

	time.Sleep(
		2 * time.Second,
	)

	// -----------------------------------
	// EVENT CONSUMER
	// -----------------------------------

	service.StartEventConsumer(ctx)

	// -----------------------------------
	// BALANCE WORKER
	// -----------------------------------

	go service.StartBalanceWorker(
		brokers,
	)

	// -----------------------------------
	// API
	// -----------------------------------

	r := gin.Default()

	r.Use(
		cors.Default(),
	)

	// PUBLIC

	r.GET(
		"/ws",
		handler.HandleWebSocket,
	)

	r.POST(
		"/register",
		handler.RegisterHandler,
	)

	r.POST(
		"/login",
		handler.LoginHandler,
	)

	// -----------------------------------
	// AUTH ROUTES
	// -----------------------------------

	authGroup := r.Group("/")

	authGroup.Use(
		auth.AuthMiddleware(),
	)

	authGroup.GET(
		"/balance",
		handler.GetBalanceHandler(
			brokers,
		),
	)

	authGroup.GET(
		"/paper/balance",
		handler.GetPaperBalance,
	)

	authGroup.GET(
		"/trades",
		handler.GetTrades,
	)

	authGroup.GET(
		"/user/metrics",
		handler.UserMetricsHandler,
	)

	authGroup.POST(
		"/exchange-keys",
		handler.SaveExchangeKeyHandler,
	)

	authGroup.GET(
		"/exchange-keys",
		handler.GetExchangeKeysHandler,
	)

	// -----------------------------------
	// ADMIN ROUTES
	// -----------------------------------

	r.GET(
		"/admin/metrics",
		handler.AdminMetricsHandler,
	)

	// -----------------------------------
	// SERVER
	// -----------------------------------

	srv := &http.Server{

		Addr: ":8080",

		Handler: r,
	}

	go func() {

		log.Println(
			"Server running on :8080",
		)

		if err := srv.ListenAndServe(); err != nil &&
			err != http.ErrServerClosed {

			log.Fatal(err)
		}
	}()

	// -----------------------------------
	// SHUTDOWN
	// -----------------------------------

	quit :=
		make(chan os.Signal, 1)

	signal.Notify(
		quit,
		os.Interrupt,
		syscall.SIGTERM,
	)

	<-quit

	log.Println(
		"Shutdown signal received",
	)

	cancel()

	ctxTimeout, cancelTimeout :=
		context.WithTimeout(
			context.Background(),
			5*time.Second,
		)

	defer cancelTimeout()

	srv.Shutdown(
		ctxTimeout,
	)

	websocket.CloseAll()

	log.Println(
		"Server exited",
	)
}
