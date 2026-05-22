package main

import (
	"log"
	"net"

	paymentgrpc "crypto-arbitrage/internal/grpc/payment"

	paymentpb "crypto-arbitrage/internal/grpc/payment/paymentpb"

	"google.golang.org/grpc"
)

func main() {

	lis, err :=
		net.Listen(
			"tcp",
			":50051",
		)

	if err != nil {

		log.Fatal(err)
	}

	grpcServer :=
		grpc.NewServer()

	paymentpb.RegisterPaymentServiceServer(

		grpcServer,

		&paymentgrpc.Server{},
	)

	log.Println(
		"💳 Payment gRPC Server running on :50051",
	)

	if err := grpcServer.Serve(lis); err != nil {

		log.Fatal(err)
	}
}
