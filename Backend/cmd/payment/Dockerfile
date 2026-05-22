FROM golang:1.26.1

WORKDIR /app

COPY go.mod .
COPY go.sum .

RUN go mod download

COPY . .

RUN go build -o payment-service ./cmd/payment

EXPOSE 50051

CMD ["./payment-service"]