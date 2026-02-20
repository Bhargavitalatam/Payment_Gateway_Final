# Database Schema Documentation

## Overview

The Payment Gateway uses PostgreSQL as its primary database. This document describes the database schema, relationships, and data flow.

## Entity Relationship Diagram

```mermaid
erDiagram
    MERCHANTS ||--o{ ORDERS : "creates"
    MERCHANTS ||--o{ PAYMENTS : "receives"
    ORDERS ||--o{ PAYMENTS : "has"
    
    MERCHANTS {
        uuid id PK "Auto-generated UUID"
        varchar(255) name "Merchant business name"
        varchar(255) email UK "Unique email address"
        varchar(64) api_key UK "Unique API key for auth"
        varchar(64) api_secret "Secret key for auth"
        text webhook_url "Optional callback URL"
        boolean is_active "Default: true"
        timestamp created_at "Auto-set on create"
        timestamp updated_at "Auto-updated"
    }
    
    ORDERS {
        varchar(64) id PK "Format: order_XXXXXXXXXXXXXXXX"
        uuid merchant_id FK "References merchants.id"
        integer amount "Amount in paise (min: 100)"
        varchar(3) currency "Default: INR"
        varchar(255) receipt "Optional receipt ID"
        jsonb notes "Optional metadata"
        varchar(20) status "created|paid"
        timestamp created_at "Auto-set on create"
        timestamp updated_at "Auto-updated"
    }
    
    PAYMENTS {
        varchar(64) id PK "Format: pay_XXXXXXXXXXXXXXXX"
        varchar(64) order_id FK "References orders.id"
        uuid merchant_id FK "References merchants.id"
        integer amount "Copied from order"
        varchar(3) currency "Copied from order"
        varchar(20) method "upi|card"
        varchar(20) status "processing|success|failed"
        varchar(255) vpa "For UPI payments"
        varchar(20) card_network "visa|mastercard|amex|rupay"
        varchar(4) card_last4 "Last 4 digits"
        varchar(50) error_code "On failure"
        text error_description "On failure"
        timestamp created_at "Auto-set on create"
        timestamp updated_at "Auto-updated"
    }
```

## Table Details

### Merchants Table

Stores merchant account information and API credentials.

```mermaid
classDiagram
    class Merchant {
        +UUID id
        +String name
        +String email
        +String api_key
        +String api_secret
        +String webhook_url
        +Boolean is_active
        +Timestamp created_at
        +Timestamp updated_at
        --
        +createOrder()
        +getOrders()
        +getPayments()
    }
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Business name |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Contact email |
| `api_key` | VARCHAR(64) | NOT NULL, UNIQUE | API authentication key |
| `api_secret` | VARCHAR(64) | NOT NULL | API secret for validation |
| `webhook_url` | TEXT | NULLABLE | Callback URL for events |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account status |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

### Orders Table

Stores payment order information created by merchants.

```mermaid
classDiagram
    class Order {
        +String id
        +UUID merchant_id
        +Integer amount
        +String currency
        +String receipt
        +JSON notes
        +String status
        +Timestamp created_at
        +Timestamp updated_at
        --
        +createPayment()
        +getPayments()
    }
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(64) | PRIMARY KEY | Format: `order_XXXXXXXXXXXXXXXX` |
| `merchant_id` | UUID | FOREIGN KEY (merchants.id) | Owner merchant |
| `amount` | INTEGER | NOT NULL, CHECK >= 100 | Amount in paise |
| `currency` | VARCHAR(3) | DEFAULT 'INR' | Currency code |
| `receipt` | VARCHAR(255) | NULLABLE | External reference |
| `notes` | JSONB | NULLABLE | Additional metadata |
| `status` | VARCHAR(20) | DEFAULT 'created' | `created` or `paid` |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

### Payments Table

Stores individual payment attempts against orders.

```mermaid
classDiagram
    class Payment {
        +String id
        +String order_id
        +UUID merchant_id
        +Integer amount
        +String currency
        +String method
        +String status
        +String vpa
        +String card_network
        +String card_last4
        +String error_code
        +String error_description
        +Timestamp created_at
        +Timestamp updated_at
    }
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(64) | PRIMARY KEY | Format: `pay_XXXXXXXXXXXXXXXX` |
| `order_id` | VARCHAR(64) | FOREIGN KEY (orders.id) | Associated order |
| `merchant_id` | UUID | FOREIGN KEY (merchants.id) | Owner merchant |
| `amount` | INTEGER | NOT NULL | Payment amount in paise |
| `currency` | VARCHAR(3) | DEFAULT 'INR' | Currency code |
| `method` | VARCHAR(20) | NOT NULL | `upi` or `card` |
| `status` | VARCHAR(20) | NOT NULL | `processing`, `success`, `failed` |
| `vpa` | VARCHAR(255) | NULLABLE | UPI Virtual Payment Address |
| `card_network` | VARCHAR(20) | NULLABLE | `visa`, `mastercard`, `amex`, `rupay` |
| `card_last4` | VARCHAR(4) | NULLABLE | Last 4 card digits |
| `error_code` | VARCHAR(50) | NULLABLE | Error code on failure |
| `error_description` | TEXT | NULLABLE | Error message |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

## Data Flow

### Order Creation Flow

```mermaid
sequenceDiagram
    participant API as API Server
    participant DB as PostgreSQL
    
    API->>DB: Check merchant exists
    DB-->>API: Merchant record
    
    API->>API: Generate unique order_id
    API->>DB: Check order_id not exists
    DB-->>API: Not found (OK)
    
    API->>DB: INSERT INTO orders
    DB-->>API: Order created
    
    Note over API,DB: order_id format:<br/>order_ + 16 alphanumeric chars
```

### Payment Creation Flow

```mermaid
sequenceDiagram
    participant API as API Server
    participant DB as PostgreSQL
    
    API->>DB: Fetch order by ID
    DB-->>API: Order record
    
    API->>API: Validate order not paid
    API->>API: Generate unique pay_id
    
    API->>DB: INSERT INTO payments (status='processing')
    DB-->>API: Payment created
    
    Note over API,DB: Async processing begins
    
    API->>API: Wait 5-10 seconds
    API->>API: Determine success/fail
    
    alt Payment Success
        API->>DB: UPDATE payments SET status='success'
        API->>DB: UPDATE orders SET status='paid'
    else Payment Failed
        API->>DB: UPDATE payments SET status='failed', error_*
    end
```

## Status Transitions

### Order Status

```mermaid
stateDiagram-v2
    [*] --> created: Order Created
    created --> paid: Payment Successful
    created --> created: Payment Failed (can retry)
    paid --> [*]
    
    note right of created: Default state<br/>Allows payments
    note right of paid: Terminal state<br/>No more payments
```

### Payment Status

```mermaid
stateDiagram-v2
    [*] --> processing: Payment Initiated
    processing --> success: Bank Approved
    processing --> failed: Bank Declined
    success --> [*]
    failed --> [*]
    
    note right of processing
        Duration: 5-10s
        (1s in test mode)
    end note
    note left of success
        Order marked paid
    end note
    note left of failed
        Can create new payment
    end note
```

## Indexes

```mermaid
graph TD
    subgraph "Merchants"
        M_PK[PRIMARY KEY: id]
        M_UK1[UNIQUE: email]
        M_UK2[UNIQUE: api_key]
    end
    
    subgraph "Orders"
        O_PK[PRIMARY KEY: id]
        O_FK[FOREIGN KEY: merchant_id]
        O_IDX[INDEX: merchant_id, created_at]
    end
    
    subgraph "Payments"
        P_PK[PRIMARY KEY: id]
        P_FK1[FOREIGN KEY: order_id]
        P_FK2[FOREIGN KEY: merchant_id]
        P_IDX[INDEX: merchant_id, created_at]
    end
```

## Database Initialization

On startup, the database is automatically initialized with:

1. **Schema Creation** - All tables created if not exist
2. **Test Merchant Seeding** - Default test merchant created

### Test Merchant Data

```mermaid
classDiagram
    class TestMerchant {
        name: "Test Merchant"
        email: "test@example.com"
        api_key: "key_test_abc123"
        api_secret: "secret_test_xyz789"
        is_active: true
    }
```

## Connection Pool

```mermaid
graph LR
    subgraph "Application"
        A1[Request 1]
        A2[Request 2]
        A3[Request N]
    end
    
    subgraph "Connection Pool"
        C1[Conn 1]
        C2[Conn 2]
        C3[Conn M]
    end
    
    subgraph "PostgreSQL"
        DB[(Database)]
    end
    
    A1 --> C1
    A2 --> C2
    A3 --> C3
    C1 --> DB
    C2 --> DB
    C3 --> DB
```

> Pool Size: 20 connections (configurable via `DATABASE_POOL_SIZE`)
