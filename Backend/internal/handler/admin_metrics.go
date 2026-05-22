package handler

import (
	"crypto-arbitrage/internal/metrics"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AdminMetricsHandler(
	c *gin.Context,
) {

	c.JSON(
		http.StatusOK,
		gin.H{

			"reconnects": metrics.TotalReconnects,

			"ws_connections": metrics.TotalWSConnections,

			"stale_books": metrics.TotalStaleBooks,

			"engine_errors": metrics.TotalEngineErrors,
		},
	)
}
