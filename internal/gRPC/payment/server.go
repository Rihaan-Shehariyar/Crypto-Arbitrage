package payment

import (
	"context"
	paymentpb "crypto-arbitrage/internal/grpc/payment/paymentpb"
	"log"
	"time"

	"github.com/google/uuid"
)

type Server struct {
	paymentpb.UnimplementedPaymentServiceServer
}

func (
	s *Server,
) ProcessPayment(

	ctx context.Context,

	req *paymentpb.PaymentRequest,

) (
	*paymentpb.PaymentResponse,
	error,
) {

	log.Printf(
		"💳 Processing payment for %s",
		req.UserId,
	)

	time.Sleep(
		2 * time.Second,
	)

	return &paymentpb.PaymentResponse{

			Success: true,

			TransactionId: uuid.NewString(),

			Message: "payment successful",
		},
		nil
}
