#  Arbitra - Real-Time Crypto Arbitrage Platform

A production-ready cryptocurrency arbitrage platform built with Golang, React, Kafka, Redis, PostgreSQL, and WebSockets.

Arbitra continuously monitors multiple cryptocurrency exchanges, detects profitable arbitrage opportunities in real time, streams market data through WebSockets, executes simulated trades, manages risk, tracks portfolio performance, and provides a modern dashboard for monitoring the entire trading lifecycle.

**Live Deployment:** https://arbitra.duckdns.org

---

#  Overview

Cryptocurrency prices often differ slightly across exchanges due to liquidity differences, market inefficiencies, and latency.

Arbitra was built to:

* Collect live market data from multiple exchanges
* Maintain real-time order books
* Detect cross-exchange arbitrage opportunities
* Simulate trade execution
* Calculate profit after fees
* Manage portfolio and risk
* Stream updates to users in real time

The project demonstrates backend engineering, concurrency, distributed systems concepts, real-time communication, event-driven architecture, cloud deployment, and DevOps practices.

---

#  Features

## Market Data Aggregation

The platform maintains real-time market feeds from multiple exchanges:

* Binance
* Bybit
* OKX
* Gate.io
* KuCoin (planned/improving)

Features:

* WebSocket market streams
* Live bid/ask updates
* Order book maintenance
* Exchange health monitoring
* Latency tracking

---

## Arbitrage Engine

The core engine continuously scans exchanges for profitable opportunities.

Implemented:

* Cross-exchange arbitrage detection
* Best buy exchange selection
* Best sell exchange selection
* Profit calculation
* Fee deduction
* Spread calculation
* Opportunity ranking
* Profit threshold filtering

Formula used:

Profit = Sell Price × (1 - Fee) - Buy Price × (1 + Fee)

The engine only broadcasts opportunities that satisfy configured profitability requirements.

---

## Trading Engine

Simulated trading execution layer.

Features:

* Buy simulation
* Sell simulation
* Trade lifecycle tracking
* Execution latency tracking
* Profit calculation
* Portfolio updates
* Trade history maintenance

Trade flow:

1. Opportunity detected
2. Buy order simulated
3. Execution confirmed
4. Sell order simulated
5. PnL calculated
6. Portfolio updated
7. Event published

---

## Risk Management System

Implemented controls:

* Exposure monitoring
* Daily PnL tracking
* Open trade limits
* Rejection reason tracking
* Risk status dashboard
* Trade validation

Risk metrics available through API and WebSocket updates.

---

## Portfolio Management

User portfolio system includes:

* Virtual balance
* Position tracking
* Profit/Loss tracking
* Trade statistics
* Portfolio analytics

Metrics:

* Current Balance
* Total Trades
* Total Profit
* Daily Profit
* Current Exposure

---

## Authentication & Authorization

Implemented using JWT.

Features:

* User registration
* User login
* JWT generation
* Protected routes
* Middleware authentication
* Role support
* Admin access control

Available routes:

* Register
* Login
* Profile
* Portfolio
* Transactions
* Risk Metrics

---

## Admin Dashboard

Administrative capabilities:

* User management
* User activity tracking
* Trade monitoring
* Platform analytics
* User trade history inspection

---

## Real-Time WebSocket System

Live updates are delivered through authenticated WebSocket connections.

Events include:

* PORTFOLIO_UPDATED
* TRADE_EXECUTED
* OPPORTUNITY_FOUND
* EXCHANGE_HEALTH
* METRIC_UPDATE
* RISK_UPDATED

Benefits:

* No page refresh required
* Low latency updates
* Real-time monitoring

---

## Event Driven Architecture

Kafka is used for internal event streaming.

Published events include:

* Order book updates
* Exchange price updates
* Arbitrage opportunities
* Trade executions

Benefits:

* Decoupled services
* Scalability
* Event replay capabilities
* Reliable processing

---

## Redis Integration

Redis is used for:

* Fast data access
* Event caching
* Market state storage
* Temporary data management

Benefits:

* Reduced database load
* Faster reads
* Real-time responsiveness

---

## PostgreSQL Integration

Persistent storage layer.

Stores:

* Users
* Trades
* Portfolios
* Transaction history
* Risk information

Features:

* Relational design
* Foreign keys
* Indexing
* Transaction support

---

#  System Architecture

```text
                        ┌────────────────────┐
                        │      React UI      │
                        └─────────┬──────────┘
                                  │
                                  ▼
                        ┌────────────────────┐
                        │   Nginx + HTTPS    │
                        └─────────┬──────────┘
                                  │
                                  ▼
                        ┌────────────────────┐
                        │    Go Backend      │
                        │       Gin          │
                        └─────────┬──────────┘
                                  │
         ┌──────────────┬─────────┼──────────┬─────────────┐
         ▼              ▼         ▼          ▼             ▼

   PostgreSQL       Redis      Kafka    WebSockets     JWT Auth

                                  │
                                  ▼

             Binance   Bybit   OKX   Gate   KuCoin
```

---

#  Application Flow

### Authentication Flow

1. User registers
2. User logs in
3. JWT generated
4. JWT stored client side
5. Protected APIs accessed
6. WebSocket authenticated using token

---

### Arbitrage Flow

1. Exchange stream receives market data
2. Feed layer updates order book
3. Arbitrage engine scans prices
4. Opportunity identified
5. Risk validation performed
6. Trade simulated
7. Portfolio updated
8. Event published through Kafka
9. Dashboard updated through WebSocket

---

#  Concurrency

The platform heavily uses Go concurrency:

* Goroutines
* Channels
* WaitGroups
* Concurrent exchange scanning
* Concurrent feed processing
* Parallel opportunity evaluation

Benefits:

* High throughput
* Low latency
* Efficient resource usage

---

#  REST API

Core endpoints:

## Authentication

POST /register

POST /login

GET /me

---

## Portfolio

GET /portfolio

GET /balance

GET /inventory

---

## Trading

POST /trading/start

POST /trading/stop

GET /trades

---

## Risk

GET /risk

---

## WebSocket

GET /ws

---

#  Dockerized Infrastructure

All services run through Docker Compose.

Containers:

* Backend
* Frontend
* PostgreSQL
* Redis
* Kafka
* Zookeeper
* Prometheus
* Grafana

---

#  AWS Deployment

Production deployment includes:

* AWS EC2
* Elastic IP
* Docker Compose
* Nginx Reverse Proxy
* Let's Encrypt SSL
* DuckDNS Domain

Deployment URL:

https://arbitra.duckdns.org

---

#  Monitoring

Monitoring stack:

## Prometheus

Collects:

* Service metrics
* Application metrics
* Health metrics

## Grafana

Visualizes:

* Trading activity
* Exchange health
* Latency
* System performance

---

#  Security

Implemented:

* HTTPS
* JWT Authentication
* Protected Routes
* WebSocket Authentication
* Nginx Reverse Proxy
* SSL Certificates

---

#  Future Improvements

* Real trade execution
* Triangular arbitrage
* Cross-chain arbitrage
* Multi-region deployment
* Kubernetes deployment
* Advanced analytics
* AI opportunity ranking
* Multi-user portfolio management
* Mobile application

---

#  Tech Stack

## Backend

* Golang
* Gin
* PostgreSQL
* Redis
* Kafka
* JWT
* Gorilla WebSocket

## Frontend

* React
* TypeScript
* Tailwind CSS
* React Query
* Zustand
* Recharts

## Infrastructure

* Docker
* Docker Compose
* AWS EC2
* Nginx
* Let's Encrypt
* DuckDNS

---

#  Author

Rihaan Shehariyar

Backend Developer | Golang Developer

Focused on backend systems, distributed systems, concurrency, real-time applications, and cloud-native architectures.
