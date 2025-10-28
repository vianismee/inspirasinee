# Referral & Points System Flow - Current Implementation

```mermaid
graph TD
    %% Referral Code Entry
    A[Customer During Order Process] --> B{Has Referral Code?}
    B -->|No| C[Continue Without Referral]
    B -->|Yes| D[Enter Referral Code]
    D --> E[Submit Referral Code]

    %% Referral Validation
    E --> F[Call /api/referral/validate]
    F --> G[Send Referral Code & Customer ID]
    G --> H[Server Validation Process]
    H --> I{Referral Code Valid?}
    I -->|No| J[Return Invalid Code Error]
    J --> K[Show Error Message]
    K --> D
    I -->|Yes| L[Return Validation Success]

    %% Referral Information Display
    L --> M[Display Referral Details]
    M --> N[Referrer Information]
    N --> O[Discount Amount Applied]
    O --> P[Points to be Awarded]
    P --> Q[Continue Order Process]

    %% Points Balance Check
    C --> R[Check Customer Points Balance]
    Q --> R
    R --> S[Call /api/points/balance]
    S --> T[Send Customer ID]
    T --> U[Retrieve Points Data]
    U --> V{Customer Has Points?}
    V -->|No| W[Display Zero Balance]
    V -->|Yes| X[Display Current Balance]
    W --> Y[Skip Points Option]
    X --> Z[Show Points Option]

    %% Points Redemption Decision
    Z --> AA{Customer Wants to Use Points?}
    AA -->|No| Y
    AA -->|Yes| BB[Enter Points to Redeem]
    BB --> CC[Validate Points Available]
    CC --> DD{Sufficient Points?}
    DD -->|No| EE[Show Insufficient Points Error]
    EE --> BB
    DD -->|Yes| FF[Apply Points Discount]

    %% Order Processing with Referral & Points
    Y --> GG[Apply Referral Discount Only]
    FF --> HH[Apply Referral + Points Discount]
    GG --> II[Calculate Final Order Total]
    HH --> II
    II --> JJ[Customer Confirms Order]
    JJ --> KK[Process Payment]
    KK --> LL{Payment Successful?}
    LL -->|No| MM[Payment Failed]
    LL -->|Yes| NN[Payment Confirmed]

    %% Referral Recording Process
    NN --> OO[Call /api/referral/record]
    OO --> PP[Send Order Data]
    PP --> QQ[Referral Code & Customer Details]
    QQ --> RR[Record Referral Usage]
    RR --> SS[Award Points to Referrer]
    SS --> TT[Update Referral Statistics]

    %% Points Deduction Process
    NN --> UU{Points Were Used?}
    UU -->|No| VV[Skip Points Deduction]
    UU -->|Yes| WW[Call /api/points/deduct]
    WW --> XX[Send Deduction Request]
    XX --> YY[Customer ID & Points Amount]
    YY --> ZZ[Validate Customer Balance]
    ZZ --> AAA[Deduct Points from Balance]
    AAA --> BBB[Update Points Transaction]
    BBB --> CCC[Return Deduction Result]

    %% Admin Referral Management
    DDD[Admin Referral Dashboard] --> EEE[Referral Settings]
    EEE --> FFF[Configure Discount Amount]
    FFF --> GGG[Configure Points Earned]
    GGG --> HHH[Set Redemption Rules]
    HHH --> III[Enable/Disable System]

    %% Referral Analytics
    DDD --> JJJ[Referral Analytics]
    JJJ --> KKK[Total Referrals Count]
    KKK --> LLL[Top Referrers List]
    LLL --> MMM[Referral Performance]
    MMM --> NNN[Export Referral Reports]

    %% Customer Points Management
    DDD --> OOO[Customer Points Management]
    OOO --> PPP[Customer Points List]
    PPP --> QQQ[Search Customer by ID/Name]
    QQQ --> RRR[View Customer Details]
    RRR --> SSS[Current Points Balance]
    SSS --> TTT[Points Transaction History]
    TTT --> UUU[Manual Points Adjustment]

    %% Points Adjustment Process
    UUU --> VVV[Adjust Customer Points]
    VVV --> WWW[Select Customer]
    WWW --> XXX[Enter Points Amount]
    XXX --> YYY[Adjustment Reason]
    YYY --> ZZZ[Update Customer Balance]
    ZZZ --> AAAA[Record Transaction]
    AAAA --> BBBB[Notify Customer]

    %% Database Operations
    subgraph "Referral Database"
        CCCC[referral_settings table]
        DDDD[referral_usage table]
        EEEE[customers table]
        FFFF[referral_code field]
    end

    subgraph "Points Database"
        GGGG[customer_points table]
        HHHH[points_transactions table]
        IIII[transaction_types table]
        JJJJ[balance_tracking]
    end

    H --> CCCC
    QQ --> DDDD
    GG --> FFFF
    S --> GGGG
    YY --> HHHH
    BB --> IIII

    %% Real-time Updates
    subgraph "Real-time Features"
        KKKKK[Supabase Subscriptions]
        LLLLL[Points Balance Updates]
        MMMMM[Referral Status Updates]
        NNNNN[Admin Dashboard Updates]
        OOOOO[Customer Notifications]
    end

    CCC --> KKKKK
    KKKKK --> LLLLL
    LLLLL --> MMMMM
    MMMMM --> NNNNN
    NNNNN --> OOOOO

    %% Referral Code Generation
    subgraph "Referral Code Generation"
        PPPPP[Customer Registration]
        QQQQQ[Unique Code Generation]
        RRRRR[Code Format: CUSTOMER_ID]
        SSSSS[Code Storage]
        TTTTT[Code Distribution]
    end

    DDD --> PPPPP
    PPPPP --> QQQQQ
    QQQQQ --> RRRRR
    RRRRR --> SSSSS
    SSSSS --> TTTTT

    %% Points Earning Rules
    subgraph "Points Earning"
        UUUUU[Referral Success]
        VVVVV[Award Points to Referrer]
        WWWWW[Points Based on Order Value]
        XXXXX[Minimum Order Requirement]
        YYYYY[Maximum Points Per Referral]
    end

    SS --> UUUUU
    UUUUU --> VVVVV
    VVVVV --> WWWWW
    WWWWW --> XXXXX
    XXXXX --> YYYYY

    %% Points Redemption Rules
    subgraph "Points Redemption"
        ZZZZZ[Points Redemption]
        AAAAA[Minimum Points Required]
        BBBBB[Points Value Conversion]
        CCCCC[Maximum Points Per Order]
        DDDDD[Eligible Orders Only]
    end

    FF --> ZZZZZ
    ZZZZZ --> AAAAA
    AAAAA --> BBBBB
    BBBBB --> CCCCC
    CCCCC --> DDDDD

    %% Error Handling
    subgraph "Error Handling"
        EEEEE[Invalid Referral Code]
        FFFFF[Insufficient Points]
        GGGGG[Database Error]
        HHHHH[API Error]
        IIIII[Network Error]
    end

    J --> EEEEE{Referral Error?}
    EEEEE -->|Yes| JJJJJ[Log Error & Return]
    EEEEE -->|No| KKKKK[Continue]
    JJJJJ --> K

    CC --> FFFFF{Points Error?}
    FFFFF -->|Yes| LLLLL[Log Error & Return]
    FFFFF -->|No| MMMMM[Continue]
    LLLLL --> M

    %% Styling
    classDef referral fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef points fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef validation fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef processing fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef database fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef realtime fill:#e0f2f1,stroke:#00695c,stroke-width:2px
    classDef admin fill:#f1f8e9,stroke:#689f38,stroke-width:2px
    classDef error fill:#ffebee,stroke:#c62828,stroke-width:2px

    class A,B,D,E,F,G,H,I,J,K,L,M,N,O,P,Q referral
    class R,S,T,U,V,W,X,Y,Z,AA,BB,CC,DD,EE,FF,GG,HH,II,JJ,KK,LL,MM,NN points
    class O,P,Q,R,S,T,U,V,W validation
    class PP,QQ,RR,SS,TT,UU,VV,WW,XX,YY,ZZ,AAA,BBB,CCC processing
    class CCCC,DDDD,EEEE,FFFF,GGGG,HHHH,III,JJJJ database
    class KKKKK,LLLL,MMMMM,NNNNN,OOOOO realtime
    class DDD,EEE,FFF,GGG,HHH,III admin
    class EEEEE,FFFFF,GGGGG,HHHHH,IIIII,JJJJJ error
```

## Referral & Points System Flow Description

### 1. **Referral Code Entry & Validation**
- **Code Entry**: Customers can enter referral codes during order process
- **API Validation**: Codes are validated through `/api/referral/validate`
- **Error Handling**: Invalid codes show helpful error messages
- **Success Response**: Valid codes return referrer details and discount info

### 2. **Referral Discount Application**
- **Discount Amount**: Automatically applies configured discount
- **Referrer Info**: Displays referrer information
- **Points Award**: Shows points that will be awarded to referrer
- **Order Integration**: Seamlessly integrated into order flow

### 3. **Points Balance Management**
- **Balance Check**: Current points balance retrieved via `/api/points/balance`
- **Display Options**: Shows current balance when available
- **Zero Balance**: Handles customers with no points gracefully
- **Real-time Updates**: Balance updates in real-time

### 4. **Points Redemption**
- **Points Entry**: Customers can specify points to redeem
- **Validation**: System validates sufficient points availability
- **Discount Application**: Points converted to order discount
- **Rules Enforcement**: Follows redemption rules and limits

### 5. **Order Processing Integration**
- **Combined Discounts**: Both referral and points discounts can be applied
- **Final Calculation**: Accurate total calculation with all discounts
- **Payment Processing**: Normal payment flow continues
- **Order Confirmation**: Standard order confirmation process

### 6. **Referral Recording**
- **API Call**: Referral usage recorded via `/api/referral/record`
- **Database Update**: Referral usage saved to database
- **Points Awarding**: Referrer automatically receives points
- **Statistics Update**: Referral performance metrics updated

### 7. **Points Deduction**
- **Deduction API**: Points deducted via `/api/points/deduct`
- **Balance Validation**: Ensures sufficient points before deduction
- **Transaction Record**: Points transactions recorded
- **Real-time Updates**: Balance updates immediately

### 8. **Admin Management**
- **Settings Configuration**: Admin can configure system parameters
- **Customer Management**: View and adjust customer points
- **Analytics Dashboard**: Track referral performance
- **Manual Adjustments**: Admin can manually adjust points

### 9. **Referral Analytics**
- **Total Referrals**: Count of successful referrals
- **Top Referrers**: List of most successful referrers
- **Performance Metrics**: Detailed referral statistics
- **Export Reports**: Generate and export referral reports

### 10. **Customer Points Management**
- **Customer Search**: Find customers by ID or name
- **Balance Display**: Current points balance for each customer
- **Transaction History**: Complete points transaction history
- **Manual Adjustments**: Admin can add or subtract points

### 11. **Real-time Features**
- **Live Updates**: Points balance updates in real-time
- **Status Notifications**: Instant referral status updates
- **Dashboard Sync**: Admin dashboard updates immediately
- **Customer Notifications**: Real-time notifications to customers

## Key Technical Components

### Frontend Components
- **Referral Input**: Referral code entry and validation
- **Points Display**: Points balance and redemption interface
- **Admin Dashboard**: Complete referral and points management
- **Analytics Charts**: Visual representation of referral data

### API Endpoints
- **`/api/referral/validate`**: Referral code validation
- **`/api/referral/record`**: Referral usage recording
- **`/api/points/balance`**: Points balance retrieval
- **`/api/points/deduct`**: Points deduction

### Database Schema
- **referral_settings**: System configuration
- **referral_usage**: Referral tracking
- **customer_points**: Points balance management
- **points_transactions**: Transaction history

### State Management
- **Real-time Subscriptions**: Live data updates
- **Form State**: Referral and points form management
- **Admin State**: Dashboard state management

### Security Features
- **Code Validation**: Secure referral code validation
- **Transaction Safety**: Atomic points operations
- **Audit Trail**: Complete transaction logging
- **Rate Limiting**: Prevents abuse of system

This flowchart represents the actual referral and points system implemented in the codebase, showing how customers can use referral codes and points, and how admins manage the complete system through the dashboard interface.