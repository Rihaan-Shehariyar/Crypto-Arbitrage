package payment

import (
	"context"
	"os"

	paymentpb "crypto-arbitrage/internal/grpc/payment/paymentpb"

	"google.golang.org/grpc"

	"google.golang.org/grpc/credentials/insecure"
)

func ProcessPayment(

	userID string,

	amount float64,

) (
	*paymentpb.PaymentResponse,
	error,
) {

	conn, err := grpc.Dial(
		os.Getenv("PAYMENT_GRPC_ADDR"),
		grpc.WithTransportCredentials(
			insecure.NewCredentials(),
		),
	)

	if err != nil {

		return nil, err
	}

	defer conn.Close()

	client :=
		paymentpb.NewPaymentServiceClient(
			conn,
		)

	return client.ProcessPayment(

		context.Background(),

		&paymentpb.PaymentRequest{

			UserId: userID,

			Amount: amount,
		},
	)
}
