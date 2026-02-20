# API Documentation

## Overview

The Payment Gateway API provides RESTful endpoints for managing orders and payments. This document covers all available endpoints, authentication, and usage examples.

## API Architecture

```mermaid
graph LR
    subgraph "Client Applications"
        D[Dashboard]
        CH[Checkout]
        EXT[External Apps]
    end
    
    subgraph "API Layer"
        GW[API Gateway<br/>Port 8000]
    end
    
    subgraph "Controllers"
        HC[Health Controller]
        OC[Order Controller]
        PC[Payment Controller]
        MC[Merchant Controller]
        TC[Test Controller]
    end
    
    subgraph "Services"
        OS[Order Service]
        PS[Payment Service]
        VS[Validation Service]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
    end
    
    D --> GW
    CH --> GW
    EXT --> GW
    
    GW --> HC
    GW --> OC
    GW --> PC
    GW --> MC
    GW --> TC
    
    OC --> OS
    PC --> PS
    PS --> VS
    OS --> DB
    PS --> DB
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant M as Middleware
    participant API as API Handler
    participant DB as Database
    
    C->>M: Request + Headers
    Note right of C: X-Api-Key: xxx<br/>X-Api-Secret: xxx
    
    M->>M: Check Headers Present
    alt Missing Headers
        M-->>C: 401 Missing Credentials
    end
    
    M->>DB: Query Merchant by API Key
    alt Merchant Not Found
        M-->>C: 401 Invalid API Key
    end
    
    M->>M: Verify API Secret
    alt Invalid Secret
        M-->>C: 401 Invalid API Secret
    end
    
    M->>M: Check Merchant Active
    alt Merchant Inactive
        M-->>C: 401 Merchant Deactivated
    end
    
    M->>API: Forward Request
    API-->>C: Response
```

## Endpoint Overview

```mermaid
mindmap
  root((API v1))
    Health
      GET /health
    Orders
      POST /api/v1/orders
      GET /api/v1/orders/:id
      GET /api/v1/orders
      GET /api/v1/orders/:id/public
    Payments
      POST /api/v1/payments
      GET /api/v1/payments/:id
      GET /api/v1/payments
      POST /api/v1/payments/public
      GET /api/v1/payments/:id/public
    Test
      GET /api/v1/test/merchant
    Merchant
      GET /api/v1/merchant
```

## Endpoints Detail

### Health Check

```mermaid
flowchart LR
    A[GET /health] --> B{Database Connected?}
    B -->|Yes| C[200 Healthy]
    B -->|No| D[503 Unhealthy]
```

**Request:**
```http
GET /health
```

**Response (200):**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### Create Order

```mermaid
flowchart TD
    A[POST /api/v1/orders] --> B{Authenticated?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D{Valid Amount?}
    D -->|No| E[400 Bad Request]
    D -->|Yes| F[Generate Order ID]
    F --> G[Save to Database]
    G --> H[201 Created]
```

**Request:**
```http
POST /api/v1/orders
Content-Type: application/json
X-Api-Key: key_test_abc123
X-Api-Secret: secret_test_xyz789

{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_123",
  "notes": {
    "customer_name": "John Doe"
  }
}
```

**Response (201):**
```json
{
  "id": "order_NXhj67fGH2jk9mPq",
  "merchant_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_123",
  "status": "created",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### Create Payment

```mermaid
flowchart TD
    A[POST /api/v1/payments] --> B{Authenticated?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D{Order Exists?}
    D -->|No| E[404 Not Found]
    D -->|Yes| F{Order Paid?}
    F -->|Yes| G[400 Already Paid]
    F -->|No| H{Valid Method?}
    H -->|No| I[400 Invalid Method]
    H -->|upi| J[Validate VPA]
    H -->|card| K[Validate Card]
    
    J --> J1{Valid?}
    J1 -->|No| L[400 Invalid VPA]
    J1 -->|Yes| M[Create Payment]
    
    K --> K1{Luhn Valid?}
    K1 -->|No| N[400 Invalid Card]
    K1 -->|Yes| K2{Expiry Valid?}
    K2 -->|No| O[400 Expired Card]
    K2 -->|Yes| K3[Detect Network]
    K3 --> M
    
    M --> P[Process Async]
    P --> Q[201 Processing]
```

**UPI Payment Request:**
```http
POST /api/v1/payments
Content-Type: application/json
X-Api-Key: key_test_abc123
X-Api-Secret: secret_test_xyz789

{
  "order_id": "order_NXhj67fGH2jk9mPq",
  "method": "upi",
  "vpa": "user@paytm"
}
```

**Card Payment Request:**
```http
POST /api/v1/payments
Content-Type: application/json
X-Api-Key: key_test_abc123
X-Api-Secret: secret_test_xyz789

{
  "order_id": "order_NXhj67fGH2jk9mPq",
  "method": "card",
  "card": {
    "number": "4111111111111111",
    "expiry_month": "12",
    "expiry_year": "2027",
    "cvv": "123",
    "holder_name": "John Doe"
  }
}
```

**Response (201):**
```json
{
  "id": "pay_H8sK3jD9s2L1pQr",
  "order_id": "order_NXhj67fGH2jk9mPq",
  "amount": 50000,
  "currency": "INR",
  "method": "card",
  "card_network": "visa",
  "card_last4": "1111",
  "status": "processing",
  "created_at": "2024-01-15T10:31:00Z"
}
```

---

## Payment Status Flow

```mermaid
stateDiagram-v2
    [*] --> processing: Payment Created
    processing --> success: Bank Approved
    processing --> failed: Bank Declined
    success --> [*]
    failed --> [*]
    
    note right of processing
        Async processing
        5-10 seconds delay
    end note
```

## Error Response Format

```mermaid
classDiagram
    class ErrorResponse {
        +Object error
    }
    class ErrorDetail {
        +String code
        +String description
    }
    ErrorResponse --> ErrorDetail : contains
```

**Example Error Response:**
```json
{
  "error": {
    "code": "BAD_REQUEST_ERROR",
    "description": "Amount must be at least 100 paise"
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_ERROR` | 401 | Missing or invalid API credentials |
| `BAD_REQUEST_ERROR` | 400 | Validation error in request |
| `NOT_FOUND_ERROR` | 404 | Resource not found |
| `INVALID_VPA` | 400 | UPI VPA format is invalid |
| `INVALID_CARD` | 400 | Card number failed Luhn validation |
| `EXPIRED_CARD` | 400 | Card expiry date is in the past |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limits

```mermaid
pie title API Rate Limits (per minute)
    "Orders API" : 100
    "Payments API" : 50
    "Query APIs" : 200
```

> **Note:** Current implementation does not enforce rate limits. These are recommended limits for production deployment.
