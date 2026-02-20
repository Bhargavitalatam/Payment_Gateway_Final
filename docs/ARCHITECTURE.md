# Architecture Documentation

## System Architecture Overview

This document provides a comprehensive overview of the Payment Gateway architecture, including system components, data flow, and deployment structure.

## High-Level Architecture

```mermaid
graph TB
    subgraph "External Actors"
        M[🏪 Merchant<br/>API Consumer]
        C[👤 Customer<br/>End User]
    end
    
    subgraph "Load Balancer / Reverse Proxy"
        LB[📡 Nginx]
    end
    
    subgraph "Application Layer"
        direction TB
        subgraph "Frontend Services"
            DASH[💻 Dashboard<br/>React SPA]
            CHECK[🛒 Checkout<br/>React SPA]
        end
        
        subgraph "Backend Services"
            API[⚙️ API Server<br/>Node.js/Express]
        end
    end
    
    subgraph "Data Layer"
        DB[(🗄️ PostgreSQL<br/>Primary Database)]
    end
    
    M -->|HTTPS| LB
    C -->|HTTPS| LB
    LB -->|Port 3000| DASH
    LB -->|Port 3001| CHECK
    LB -->|Port 8000| API
    DASH -->|REST API| API
    CHECK -->|REST API| API
    API -->|SQL| DB
    
    style M fill:#ffd700
    style C fill:#90EE90
    style DASH fill:#61dafb
    style CHECK fill:#ff6b6b
    style API fill:#68a063
    style DB fill:#336791
```

## Component Architecture

### Backend API Architecture

```mermaid
graph TD
    subgraph "Express Application"
        MW[🔐 Middleware Layer]
        
        subgraph "Route Handlers"
            HR["/health"]
            OR["/api/v1/orders"]
            PR["/api/v1/payments"]
            MR["/api/v1/merchant"]
            TR["/api/v1/test"]
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
        
        subgraph "Data Access"
            DB[Database Pool]
        end
    end
    
    MW --> HR & OR & PR & MR & TR
    HR --> HC
    OR --> OC --> OS
    PR --> PC --> PS
    MR --> MC
    TR --> TC
    PS --> VS
    OS & PS --> DB
    
    style MW fill:#ffeb3b
    style VS fill:#e1bee7
```

### Frontend Dashboard Architecture

```mermaid
graph TD
    subgraph "React Application"
        APP[App.js<br/>Router Setup]
        
        subgraph "Pages"
            LP[Login Page]
            DP[Dashboard Page]
            TP[Transactions Page]
        end
        
        subgraph "State Management"
            LS[localStorage<br/>Auth State]
            RS[React State<br/>Component Data]
        end
        
        subgraph "API Client"
            AC[Fetch API<br/>REST Calls]
        end
    end
    
    APP --> LP & DP & TP
    LP --> LS
    DP & TP --> RS
    DP & TP --> AC
    AC --> EXT[External API]
    
    style APP fill:#61dafb
    style AC fill:#fff3e0
```

### Checkout Page Architecture

```mermaid
graph TD
    subgraph "Checkout Application"
        CA[App.js]
        
        subgraph "Checkout Page"
            LS[Loading State]
            MS[Method Selection]
            UF[UPI Form]
            CF[Card Form]
            PS[Processing State]
            SS[Success State]
            FS[Failure State]
        end
        
        subgraph "Validation"
            VV[VPA Validator]
            CV[Card Validator]
        end
    end
    
    CA --> LS
    LS --> MS
    MS --> UF & CF
    UF --> VV --> PS
    CF --> CV --> PS
    PS --> SS & FS
    FS --> MS
    
    style CA fill:#ff6b6b
```

## Request Flow Architecture

### Order Creation Flow

```mermaid
sequenceDiagram
    autonumber
    participant M as Merchant
    participant API as API Server
    participant Auth as Auth Middleware
    participant OC as Order Controller
    participant OS as Order Service
    participant DB as Database
    
    M->>API: POST /api/v1/orders
    API->>Auth: Validate Headers
    Auth->>DB: Query Merchant
    DB-->>Auth: Merchant Data
    Auth->>Auth: Verify Secret
    Auth->>OC: Forward Request
    OC->>OC: Validate Body
    OC->>OS: createOrder()
    OS->>OS: Generate order_id
    OS->>DB: INSERT order
    DB-->>OS: Order Record
    OS-->>OC: Order Data
    OC-->>M: 201 Created
```

### Payment Processing Flow

```mermaid
sequenceDiagram
    autonumber
    participant C as Customer
    participant CH as Checkout
    participant API as API Server
    participant PS as Payment Service
    participant VS as Validation Service
    participant DB as Database
    
    C->>CH: Submit Payment
    CH->>API: POST /api/v1/payments/public
    
    API->>PS: createPaymentPublic()
    PS->>DB: Fetch Order
    DB-->>PS: Order Data
    
    alt UPI Payment
        PS->>VS: validateVPA()
        VS-->>PS: Valid/Invalid
    else Card Payment
        PS->>VS: validateCard()
        VS->>VS: Luhn Check
        VS->>VS: Expiry Check
        VS->>VS: Detect Network
        VS-->>PS: Valid/Invalid + Network
    end
    
    PS->>DB: INSERT payment (processing)
    DB-->>PS: Payment Created
    PS-->>API: Payment Response
    API-->>CH: 201 Processing
    
    Note over PS,DB: Async Processing
    PS->>PS: Wait 5-10s
    PS->>PS: Determine Result
    
    alt Success
        PS->>DB: UPDATE payment (success)
        PS->>DB: UPDATE order (paid)
    else Failure
        PS->>DB: UPDATE payment (failed)
    end
    
    C->>CH: Poll Status
    CH->>API: GET /api/v1/payments/{id}/public
    API-->>CH: Final Status
    CH-->>C: Show Result
```

## Deployment Architecture

### Docker Compose Setup

```mermaid
graph TB
    subgraph "Docker Host"
        subgraph "docker-compose network: gateway_network"
            direction LR
            
            subgraph "pg_gateway"
                PG[PostgreSQL 15<br/>Port: 5432]
                VOL[(pg_data volume)]
                PG --- VOL
            end
            
            subgraph "gateway_api"
                API[Node.js API<br/>Port: 8000]
            end
            
            subgraph "gateway_dashboard"
                DASH[Nginx + React<br/>Port: 3000]
            end
            
            subgraph "gateway_checkout"
                CHECK[Nginx + React<br/>Port: 3001]
            end
        end
    end
    
    API -->|DATABASE_URL| PG
    DASH -->|proxy /api| API
    CHECK -->|proxy /api| API
    
    EXT[External Traffic] -->|3000| DASH
    EXT -->|3001| CHECK
    EXT -->|8000| API
```

### Container Dependencies

```mermaid
graph LR
    subgraph "Startup Order"
        PG[1️⃣ PostgreSQL]
        API[2️⃣ API Server]
        DASH[3️⃣ Dashboard]
        CHECK[3️⃣ Checkout]
    end
    
    PG -->|healthy| API
    API -->|started| DASH
    API -->|started| CHECK
```

### Build Pipeline

```mermaid
flowchart TD
    subgraph "Build Stage"
        B1[npm install]
        B2[npm run build]
    end
    
    subgraph "Production Stage"
        P1[nginx:alpine]
        P2[Copy build artifacts]
        P3[Copy nginx config]
    end
    
    B1 --> B2
    B2 --> P2
    P1 --> P2 --> P3
```

## Security Architecture

### Authentication Flow

```mermaid
flowchart TD
    A[API Request] --> B{Has Auth Headers?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D[Extract Credentials]
    D --> E{Valid API Key?}
    E -->|No| F[401 Invalid Key]
    E -->|Yes| G{Valid Secret?}
    G -->|No| H[401 Invalid Secret]
    G -->|Yes| I{Merchant Active?}
    I -->|No| J[401 Deactivated]
    I -->|Yes| K[✅ Proceed]
    
    style C fill:#ffcdd2
    style F fill:#ffcdd2
    style H fill:#ffcdd2
    style J fill:#ffcdd2
    style K fill:#c8e6c9
```

### Data Security

```mermaid
graph TD
    subgraph "Sensitive Data Handling"
        CARD[Card Number] -->|Never Stored| X1[❌]
        CVV[CVV] -->|Never Stored| X2[❌]
        SECRET[API Secret] -->|Stored Hashed| DB[(Database)]
        LAST4[Card Last 4] -->|Stored| DB
        VPA[VPA] -->|Stored| DB
    end
    
    style X1 fill:#ffcdd2
    style X2 fill:#ffcdd2
    style DB fill:#336791
```

## Scalability Considerations

### Horizontal Scaling

```mermaid
graph TB
    LB[Load Balancer]
    
    subgraph "API Cluster"
        API1[API Instance 1]
        API2[API Instance 2]
        API3[API Instance N]
    end
    
    subgraph "Database"
        PG_PRIMARY[(Primary)]
        PG_REPLICA[(Read Replica)]
    end
    
    LB --> API1 & API2 & API3
    API1 & API2 & API3 --> PG_PRIMARY
    API1 & API2 & API3 -.->|Read| PG_REPLICA
    PG_PRIMARY -->|Replication| PG_REPLICA
```

### Caching Strategy (Future)

```mermaid
flowchart LR
    API[API Server]
    REDIS[(Redis Cache)]
    DB[(PostgreSQL)]
    
    API -->|Check Cache| REDIS
    REDIS -->|Hit| API
    REDIS -->|Miss| DB
    DB -->|Result| REDIS
    REDIS -->|Result| API
```

## Monitoring Points

```mermaid
graph TD
    subgraph "Health Checks"
        H1["/health endpoint"]
        H2[Database connectivity]
        H3[Container status]
    end
    
    subgraph "Metrics"
        M1[Request latency]
        M2[Error rates]
        M3[Payment success rate]
        M4[Database query time]
    end
    
    subgraph "Logging"
        L1[API request logs]
        L2[Payment events]
        L3[Error stack traces]
    end
    
    H1 & H2 & H3 --> ALERT[Alerting System]
    M1 & M2 & M3 & M4 --> DASH[Monitoring Dashboard]
    L1 & L2 & L3 --> LOG[Log Aggregation]
```

## Technology Stack Summary

```mermaid
mindmap
    root((Payment Gateway))
        Backend
            Node.js 18
            Express.js
            pg driver
        Frontend
            React 18
            React Router v6
            Fetch API
        Database
            PostgreSQL 15
        DevOps
            Docker
            Docker Compose
            Nginx
        Security
            API Key Auth
            CORS
            Helmet.js
```
