# Referral System Flowchart

```mermaid
graph TD
    %% Customer Registration & Referral Code Entry
    A[Customer Starts Order] --> B{Has Referral Code?}
    B -->|No| C[Process Order Normally]
    B -->|Yes| D[Enter Referral Code]

    %% Referral Validation Process
    D --> E[Validate Referral Code]
    E --> F{Code Valid?}
    F -->|No| G[Show Error Message]
    G --> H[Remove Referral Code]
    H --> C
    F -->|Yes| I[Check Referrer Details]

    %% Points System Integration
    I --> J[Get Customer Points Balance]
    J --> K[Display Available Points]
    K --> L{Customer Wants to Use Points?}
    L -->|No| M[Apply Referral Discount Only]
    L -->|Yes| N[Enter Points to Use]
    N --> O[Validate Points Available]
    O --> P{Points Valid?}
    P -->|No| Q[Show Error Message]
    Q --> N
    P -->|Yes| R[Calculate Total Discount]

    %% Discount Calculation
    R --> S[Apply Referral Discount]
    S --> T[Apply Points Discount]
    T --> U[Calculate Final Total]
    U --> V[Display Order Summary]

    %% Order Processing
    V --> W[Customer Confirms Order]
    W --> X[Process Payment]
    X --> Y{Payment Successful?}
    Y -->|No| Z[Show Payment Error]
    Z --> W
    Y -->|Yes| AA[Create Order Record]

    %% Backend Processing - Referral System
    AA --> BB[Record Referral Usage]
    BB --> CC[Award Points to Referrer]
    CC --> DD[Create Customer Points Record]
    DD --> EE[Deduct Points from Customer]
    EE --> FF[Generate Receipt]

    %% Database Operations
    BB --> GG[Update referral_usage Table]
    CC --> HH[Update customer_points Table]
    DD --> II[Insert into customer_points Table]
    EE --> JJ[Update points_transactions Table]

    %% Order Completion
    FF --> KK[Send Order Confirmation]
    KK --> LL[Display Order Success]
    LL --> MM[End]

    %% Error Handling
    subgraph "Error Handling"
        NN[Database Error]
        OO[API Error]
        PP[Validation Error]
        QQ[Payment Error]
    end

    GG --> NN{Database Error?}
    NN -->|Yes| RR[Log Error]
    RR --> SS[Continue with Warning]
    NN -->|No| TT[Success]

    HH --> OO{API Error?}
    OO -->|Yes| UU[Log Error]
    UU --> VV[Continue with Warning]
    OO -->|No| WW[Success]

    %% Admin Management Flow
    subgraph "Admin Dashboard"
        XX[Admin Login]
        YY[Referral Settings]
        ZZ[Customer Points Management]
        AAA[Analytics & Reports]
        BBB[Referral Usage History]
    end

    XX --> YY
    YY --> ZZ
    ZZ --> AAA
    AAA --> BBB

    %% Settings Configuration
    YY --> CCC[Referral Discount Amount]
    CCC --> DDD[Referrer Points Earned]
    DDD --> EEE[Points Redemption Minimum]
    EEE --> FFF[Points Redemption Value]
    FFF --> GGG[Enable/Disable System]

    %% Points Management
    ZZ --> HHH[View Customer Points]
    HHH --> III[Adjust Customer Points]
    III --> JJJ[Add Points Bonus]
    JJJ --> KKK[Deduct Points]

    %% Analytics & Reports
    AAA --> LLL[Total Referrals Count]
    LLL --> MMM[Total Points Awarded]
    MMM --> NNN[Total Points Redeemed]
    NNN --> OOO[Top Referrers]
    OOO --> PPP[Export Reports]

    %% Styling
    classDef process fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef validation fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef success fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef error fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef admin fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    classDef database fill:#fce4ec,stroke:#ad1457,stroke-width:2px

    class A,B,C,D,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,AA,FF,KK,LL,MM process
    class E,F,P validation
    class I,AA,BB,CC,DD,EE,GG,HH,II,JJ,TT,WW success
    class G,NN,OO,PP,QQ,RR,UU,VV error
    class XX,YY,ZZ,AAA,BBB,CCC,DDD,EEE,FFF,GGG,HHH,III,JJJ,KKK,LLL,MMM,NNN,OOO,PPP admin
```

## Flowchart Description

### 1. **Customer Journey**
- **Order Initiation**: Customer starts the ordering process
- **Referral Code Entry**: Option to enter referral code for discounts
- **Points Usage**: Option to use accumulated points for additional discounts
- **Order Confirmation**: Final order review and payment processing

### 2. **Validation Processes**
- **Referral Code Validation**: Checks if the referral code exists and is valid
- **Points Validation**: Ensures customer has sufficient points balance
- **Payment Validation**: Verifies payment processing success

### 3. **Backend Processing**
- **Referral Usage Recording**: Tracks when referral codes are used
- **Points Management**: Awards points to referrers and deducts from users
- **Database Updates**: Maintains all referral and points transactions
- **Error Handling**: Manages database and API errors gracefully

### 4. **Admin Management**
- **Settings Configuration**: Admin can configure referral parameters
- **Customer Points Management**: View and adjust customer point balances
- **Analytics & Reporting**: Track referral performance and generate reports

### 5. **Database Operations**
- **referral_usage table**: Records referral code usage
- **customer_points table**: Tracks customer point balances
- **points_transactions table**: Logs all point transactions
- **referral_settings table**: Stores system configuration

## Key Components

### Frontend Components
- **Referral Input Form**: Code validation and error display
- **Points Redemption UI**: Balance display and usage interface
- **Order Summary**: Shows applied discounts and final totals
- **Admin Dashboard**: Settings and management interfaces

### Backend Services
- **Referral Validation API**: Code validation logic
- **Points Management API**: Balance queries and updates
- **Order Processing**: Integration with existing order system
- **Analytics API**: Data aggregation for reports

### Database Schema
- **Customers**: Basic customer information
- **Referral Usage**: Tracking referral code applications
- **Customer Points**: Point balance management
- **Points Transactions**: Transaction history
- **Referral Settings**: System configuration

## Error Handling Strategies

1. **Invalid Referral Codes**: Clear error messages with suggestions
2. **Insufficient Points**: Real-time validation with helpful feedback
3. **Database Errors**: Graceful degradation with logging
4. **Payment Failures**: Retry mechanisms and error recovery
5. **API Failures**: Fallback behaviors and user notifications

## Security Considerations

1. **Referral Code Generation**: Unique, non-guessable codes
2. **Points Validation**: Server-side verification
3. **Transaction Integrity**: Atomic operations for points updates
4. **Rate Limiting**: Prevent abuse of referral system
5. **Audit Trail**: Complete logging of all transactions

## Performance Optimizations

1. **Caching**: Points balance and referral validation results
2. **Database Indexing**: Optimized queries for referral and points data
3. **Batch Processing**: Efficient handling of multiple transactions
4. **Async Operations**: Non-blocking points processing
5. **Background Jobs**: Periodic maintenance and cleanup tasks