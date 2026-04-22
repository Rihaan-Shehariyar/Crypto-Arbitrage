package main

import (
	"context"
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
)

func main() {
	r := gin.Default()

	ctx, cancel := context.WithCancel(context.Background())

	service.StartScanner(ctx)

	r.GET("/ws", handler.HandleWebSocket)

	srv := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	go func() {
		log.Println("Server Started running on :8080")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen : %s\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	<-quit
	log.Println("🛑 Shutdown signal received")

	cancel()

	//  time for cleanup
	ctxTimeout, cancelTimeout := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelTimeout()

	if err := srv.Shutdown(ctxTimeout); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("🔌 Closing WebSocket connections...")
	websocket.CloseAll()


	log.Println(" Server exited gracefully")

}
