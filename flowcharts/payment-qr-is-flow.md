# Payment & QRIS Flow - Current System

```mermaid
graph TD
    %% Payment Selection
    A[Order Confirmation Complete] --> B[Select Payment Method]
    B --> C{Payment Type Selection}
    C -->|QRIS| D[QRIS Payment Flow]
    C -->|Cash| E[Cash Payment Flow]
    C -->|Transfer| F[Bank Transfer Flow]
    C -->|Other| G[Other Payment Method]

    %% QRIS Payment Flow
    D --> H[Generate QRIS Code]
    H --> I[Create Payment Request]
    I --> J[Amount: Order Total]
    J --> K[Merchant Information]
    K --> L[Transaction ID]
    L --> M[Generate QR Image]
    M --> N[Display QR Code Interface]
    N --> O[Show Payment Instructions]
    O --> P[Display Amount Details]
    P --> Q[Show Merchant Details]
    Q --> R[Payment Waiting State]

    %% QRIS Payment Processing
    R --> S[Monitor Payment Status]
    S --> T{Payment Received?}
    T -->|No| U[Continue Monitoring]
    U --> V{Timeout Reached?}
    V -->|No| W[Check Status Again]
    V -->|Yes| X[Payment Timeout]
    W --> T
    T -->|Yes| Y[Payment Confirmed]

    %% Cash Payment Flow
    E --> Z[Mark Order as Paid]
    Z --> AA[Record Cash Payment]
    AA --> BB[Payment Date/Time]
    BB --> CC[Payment Amount]
    CC --> DD[Payment Notes]
    DD --> EE[Update Order Status]
    EE --> FF[Cash Payment Confirmed]

    %% Bank Transfer Flow
    F --> GG[Record Bank Transfer]
    GG --> HH[Transfer Details Form]
    HH --> II[Bank Name]
    II --> JJ[Account Number]
    JJ --> KK[Transfer Amount]
    KK --> LL[Transfer Date]
    LL --> MM[Upload Transfer Proof]
    MM --> NN[Update Order Status]
    NN --> OO[Transfer Recorded]

    %% Payment Confirmation
    Y --> PP[Validate Payment Amount]
    FF --> PP
    OO --> PP
    G --> PP
    PP --> QQ{Amount Matches Order?}
    QQ -->|No| RR[Show Amount Mismatch Error]
    RR --> SS[Contact Admin]
    QQ -->|Yes| TT[Payment Validation Success]

    %% Order Completion
    TT --> UU[Update Order Status to Paid]
    UU --> VV[Generate Order Receipt]
    VV --> WW[Create Payment Record]
    WW --> XX[Update Database]
    XX --> YY[Send Order Confirmation]
    YY --> ZZ[Display Order Success]

    %% QRIS Generation Details
    subgraph "QRIS Generation"
        AAA[Order Total Amount]
        BBB[Merchant Name]
        CCC[Merchant Account]
        DDD[Transaction Reference]
        EEE[QRIS Standard Format]
        FFF[Image Generation]
        GGG[QR Code Display]
    end

    H --> AAA
    AAA --> BBB
    BBB --> CCC
    CCC --> DDD
    DDD --> EEE
    EEE --> FFF
    FFF --> GGG

    %% Payment Monitoring
    subgraph "Payment Monitoring"
        HHH[Payment Status Polling]
        III[Manual Confirmation]
        JJJ[Automatic Detection]
        KKK[Timeout Handling]
        LLL[Error Recovery]
    end

    S --> HHH
    HHH --> III
    III --> JJJ
    JJJ --> KKK
    KKK --> LLL

    %% Database Operations
    subgraph "Database Updates"
        MMM[orders table]
        NNN[payments table]
        OOO[payment_status column]
        PPP[payment_details column]
        QQQ[receipt_data column]
    end

    XX --> MMM
    WW --> NNN
    YY --> OOO
    VV --> PPP
    YY --> QQQ

    %% Error Handling
    subgraph "Error Handling"
        RRR[QR Generation Error]
        SSS[Payment Timeout]
        TTT[Amount Mismatch]
        UUU[Database Error]
        VVV[Network Error]
    end

    M --> RRR{QR Generation Error?}
    RRR -->|Yes| WWW[Log Error & Show Message]
    RRR -->|No| XXX[Success]
    WWW --> H

    X --> SSS{Payment Timeout?}
    SSS -->|Yes| YYY[Log Timeout & Notify]
    SSS -->|No| ZZZ[Continue Processing]
    YYY --> AA

    %% Receipt Generation
    subgraph "Receipt Generation"
        AAAAA[Order Details]
        BBBBB[Customer Information]
        CCCCC[Payment Information]
        DDDDD[Discount Details]
        EEEEE[Points Details]
        FFFFF[Receipt Format]
    end

    VV --> AAAAA
    AAAAA --> BBBBB
    BBBBB --> CCCCC
    CCCCC --> DDDDD
    DDDDD --> EEEEE
    EEEEE --> FFFFF

    %% Payment Status Updates
    subgraph "Status Updates"
        GGGGG[Order Status: Pending Payment]
        HHHHH[Order Status: Payment Confirmed]
        IIIIII[Order Status: Processing]
        JJJJJJ[Order Status: Ready]
        KKKKKK[Order Status: Completed]
    end

    R --> GGGGG
    UU --> HHHHH
    YY --> IIIIII
    YY --> JJJJJJ
    YY --> KKKKKK

    %% Real-time Updates
    subgraph "Real-time Features"
        LLLLL[Supabase Real-time]
        MMMMM[Order Status Updates]
        NNNNN[Payment Status Notifications]
        OOOOO[Customer Notifications]
        PPPPP[Admin Dashboard Updates]
    end

    UU --> LLLLL
    LLLLL --> MMMMM
    MMMMM --> NNNNN
    NNNNN --> OOOOO
    OOOOO --> PPPPP

    %% Payment Methods Display
    subgraph "Payment Interface"
        QQQQQ[Payment Method Selection]
        RRRRR[QRIS Payment Option]
        SSSSS[Cash Payment Option]
        TTTTT[Bank Transfer Option]
        UUUUU[Other Methods]
    end

    B --> QQQQQ
    QQQQQ --> RRRRR
    QQQQQ --> SSSSS
    QQQQQ --> TTTTT
    QQQQQ --> UUUUU

    %% Styling
    classDef qris fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef payment fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef validation fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef processing fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef database fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef realtime fill:#e0f2f1,stroke:#00695c,stroke-width:2px
    classDef error fill:#ffebee,stroke:#c62828,stroke-width:2px

    class D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y payment
    class A,B,C,PP,QQ,RR,SS,TT validation
    class H,AA,BB,CC,DD,EE,FF,GG,HH,II,JJ,KK,LL,MM,NN,OO,PP,QQ,RR,SS,TT,UU,VV,WW,XX,YY,ZZ processing
    class XX,YY,ZZ,AAA,BBB,CCC,DDD,EEE,FFF,GGG,HHH,III,JJJ,KKK,LLL,MMM,NNN,OOO,PPP,QQQ database
    class LLLLL,MMMMM,NNNNN,OOOOO,PPPPP realtime
    class RRR,SSS,TTT,UUU,VVV,WWW,XXX,YYY,ZZZ error
```

## Payment & QRIS Flow Description

### 1. **Payment Method Selection**
- **Multiple Options**: QRIS, Cash, Bank Transfer, and Other payment methods
- **Order Context**: Payment selection happens after order confirmation
- **Method Validation**: Each payment type has specific validation rules
- **User Interface**: Clear payment method selection interface

### 2. **QRIS Payment Process**
- **Dynamic Generation**: QR codes are generated for each specific order
- **Order Integration**: QR codes contain order-specific information
- **Amount Display**: Clear display of payment amount
- **Merchant Information**: Business details included in QR code

### 3. **QRIS Code Generation**
- **Order Total**: Exact order amount
- **Merchant Details**: Business name and account information
- **Transaction Reference**: Unique identifier for each payment
- **Standard Compliance**: Follows QRIS standard format
- **Image Generation**: Creates scannable QR code image

### 4. **Payment Monitoring**
- **Status Tracking**: Continuous monitoring of payment status
- **Timeout Handling**: Automatic timeout for unconfirmed payments
- **Manual Confirmation**: Admin can manually confirm payments
- **Error Recovery**: Handles payment errors gracefully

### 5. **Alternative Payment Methods**
- **Cash Payments**: Manual recording of cash transactions
- **Bank Transfers**: Support for bank transfer with proof upload
- **Other Methods**: Flexible payment method recording
- **Validation**: Amount validation for all payment types

### 6. **Payment Confirmation**
- **Amount Validation**: Confirms payment amount matches order total
- **Status Updates**: Updates order status to paid
- **Receipt Generation**: Creates payment receipt
- **Database Updates**: Records payment information in database

### 7. **Order Completion**
- **Status Progression**: Order moves through completion stages
- **Receipt Generation**: Detailed receipt with all payment information
- **Customer Notification**: Order confirmation sent to customer
- **Admin Notification**: Payment confirmation for admin records

### 8. **Real-time Updates**
- **Live Status**: Payment status updates in real-time
- **Dashboard Updates**: Admin dashboard reflects changes immediately
- **Customer Notifications**: Real-time payment confirmations
- **Error Handling**: Graceful handling of connection issues

## Key Technical Components

### Frontend Components
- **Payment Selection**: Payment method selection interface
- **QRIS Display**: QR code generation and display
- **Payment Monitoring**: Payment status tracking interface
- **Receipt Generation**: Receipt creation and display

### QRIS Generation
- **Order Integration**: QR codes linked to specific orders
- **Amount Validation**: Ensures correct payment amounts
- **Standard Compliance**: Follows QRIS technical standards
- **Image Generation**: High-quality QR code image creation

### Database Operations
- **Payment Records**: Complete payment transaction logging
- **Order Status**: Payment status updates in orders table
- **Receipt Data**: Receipt information storage
- **Transaction History**: Complete payment audit trail

### Real-time Features
- **Supabase Subscriptions**: Live payment status updates
- **Status Notifications**: Instant payment confirmations
- **Dashboard Integration**: Real-time admin updates
- **Error Recovery**: Handles connection issues automatically

### Security Features
- **Transaction Validation**: Verifies payment amounts
- **Reference Tracking**: Unique transaction identifiers
- **Audit Trail**: Complete payment history logging
- **Data Integrity**: Ensures payment data consistency

This flowchart represents the actual payment and QRIS system implemented in the codebase, showing how payments are processed, monitored, and confirmed through the various payment methods available in the system.