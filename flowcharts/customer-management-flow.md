# Customer Management Flow - Current System

```mermaid
graph TD
    %% Customer Search & Selection
    A[Admin Accesses Customer Management] --> B[Customer Search Interface]
    B --> C[Enter WhatsApp Number]
    C --> D[Search in customers Database]
    D --> E{Customer Found?}
    E -->|Yes| F[Display Customer Details]
    E -->|No| G[Create New Customer Option]
    G --> H[New Customer Creation Flow]

    %% New Customer Creation
    H --> I[Customer Creation Form]
    I --> J[Enter Customer Information]
    J --> K[Name Required]
    K --> L[WhatsApp Number Required]
    L --> M[Email Optional]
    M --> N[Address Details]
    N --> O[Phone Number Optional]
    O --> P[Validate Customer Data]
    P --> Q{Data Valid?}
    Q -->|No| R[Show Validation Errors]
    R --> I
    Q -->|Yes| S[Save Customer to Database]

    %% Customer Information Display
    F --> T[Display Customer Profile]
    S --> T
    T --> U[Customer Details Summary]
    U --> V[Customer Order History]
    V --> W[Total Spending Amount]
    W --> X[Customer Status]
    X --> Y[Referral Information]
    Y --> Z[Points Balance]

    %% Customer Order History
    V --> AA[Fetch Customer Orders]
    AA --> BB{Orders Found?}
    BB -->|Yes| CC[Display Order List]
    BB -->|No| DD[No Orders Message]
    CC --> EE[Order Summary Cards]
    EE --> FF[Order Date & Time]
    FF --> GG[Order Status]
    GG --> HH[Order Total]
    HH --> II[View Order Details]

    %% Customer Actions
    T --> JJ[Available Customer Actions]
    JJ --> KK[Edit Customer Information]
    JJ --> LL[View Order Details]
    JJ --> MM[Add to New Order]
    JJ --> NN[View Customer Points]
    JJ --> OO[View Referral History]

    %% Edit Customer Information
    KK --> PP[Edit Customer Form]
    PP --> QQ[Update Name]
    QQ --> RR[Update WhatsApp]
    RR --> SS[Update Email]
    SS --> TT[Update Address]
    TT --> UU[Update Phone]
    UU --> VV[Validate Updated Data]
    VV --> WW{Updates Valid?}
    WW -->|No| XX[Show Validation Errors]
    XX --> PP
    WW -->|Yes| YY[Save Changes to Database]

    %% Customer Points Management
    NN --> ZZ[Points Balance Display]
    ZZ --> AAA[Current Points Balance]
    AAA --> BBB[Points Earned Total]
    BBB --> CCC[Points Redeemed Total]
    CCC --> DDD[Points Transaction History]
    DDD --> EEE[View Transaction Details]
    EEE --> FFF[Transaction Date]
    FFF --> GGG[Transaction Type]
    GGG --> HHH[Points Amount]
    HHH --> III[Reference Information]

    %% Referral History
    OO --> JJJ[Referral Information]
    JJJ --> KKK[Customer's Referral Code]
    KKK --> LLL[Total Referrals Made]
    LLL --> MMM[Referral Bonus Earned]
    MMM --> NNN[Referred Customers List]
    NNN --> OOO[Referral Usage History]

    %% Add Customer to New Order
    MM --> PPP[Set as Active Customer]
    PPP --> QQQ[Navigate to Order Creation]
    QQQ --> RRR[Pre-fill Customer Information]
    RRR --> SSS[Start New Order Process]

    %% Database Operations
    subgraph "Database Operations"
        TTT[customers table]
        UUU[orders table]
        VVV[customer_points table]
        WWW[points_transactions table]
        XXX[referral_usage table]
        YYY[referral_settings table]
    end

    S --> TTT
    AA --> UUU
    ZZ --> VVV
    DDD --> WWW
    JJJ --> XXX

    %% Real-time Updates
    subgraph "Real-time Features"
        ZZZ[Supabase Subscriptions]
        AAAA[Customer List Updates]
        BBBB[Order Status Updates]
        CCCC[Points Balance Updates]
        DDDD[Referral Updates]
    end

    YY --> ZZZ
    ZZZ --> AAAA
    AAAA --> BBBB
    BBBB --> CCCC
    CCCC --> DDDD

    %% Error Handling
    subgraph "Error Handling"
        EEEE[Customer Creation Error]
        FFFF[Database Error]
        GGGG[Validation Error]
        HHHH[API Error]
        IIII[Real-time Sync Error]
    end

    S --> EEEE{Database Error?}
    EEEE -->|Yes| JJJJ[Log Error & Show Message]
    EEEE -->|No| KKKK[Success]
    JJJJ --> LLLL[Retry or Cancel]
    LLLL --> I

    %% Customer Analytics
    subgraph "Customer Analytics"
        MMMM[Total Customers Count]
        NNNN[New Customers This Month]
        OOOO[Customer Retention Rate]
        PPPP[Top Spending Customers]
        QQQQ[Customer Activity Trends]
    end

    U --> MMMM
    W --> NNNN
    X --> OOOO
    Y --> PPPP
    Z --> QQQQ

    %% Styling
    classDef creation fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef search fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef display fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef action fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef database fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef realtime fill:#e0f2f1,stroke:#00695c,stroke-width:2px
    classDef analytics fill:#f1f8e9,stroke:#689f38,stroke-width:2px

    class H,I,J,K,L,M,N,O,P,Q,R,S creation
    class A,B,C,D,E,F,G search
    class T,U,V,W,X,Y,Z,AA,BB,CC,DD,EE,FF,GG,HH,II display
    class JJ,KK,LL,MM,NN,OO,PP,QQ,RR,SS,TT,UU,VV,WW,XX,YY action
    class TTT,UUU,VVV,WWW,XXX,YYY database
    class ZZZ,AAAA,BBBB,CCCC,DDDD realtime
    class MMMM,NNNN,OOOO,PPPP,QQQQ analytics
```

## Customer Management Flow Description

### 1. **Customer Search & Selection**
- **WhatsApp Search**: Primary method for finding existing customers
- **Database Query**: Searches customers table by WhatsApp number
- **Customer Display**: Shows detailed customer information when found
- **New Customer Option**: Provides option to create new customer if not found

### 2. **New Customer Creation**
- **Required Fields**: Name and WhatsApp number are mandatory
- **Optional Fields**: Email, address, and additional phone numbers
- **Data Validation**: Real-time validation of customer information
- **Database Insert**: New customer records are saved to customers table

### 3. **Customer Information Display**
- **Profile Summary**: Complete customer profile with all details
- **Order History**: List of all customer orders with status
- **Financial Summary**: Total spending and order statistics
- **System Integration**: Shows referral and points information

### 4. **Customer Order History**
- **Order List**: Chronological list of customer orders
- **Order Details**: Detailed view of each order
- **Status Tracking**: Current status of each order
- **Financial Data**: Order totals and payment information

### 5. **Customer Actions**
- **Edit Information**: Update customer details
- **View Orders**: Access detailed order information
- **New Order**: Start new order with pre-filled customer data
- **Points Management**: View points balance and history
- **Referral Info**: Access referral system information

### 6. **Points System Integration**
- **Balance Display**: Current points balance
- **Transaction History**: Complete record of points transactions
- **Points Details**: Transaction types, amounts, and references
- **Real-time Updates**: Points balance updates automatically

### 7. **Referral System**
- **Referral Code**: Customer's unique referral code
- **Referral Statistics**: Total referrals and bonuses earned
- **Referred Customers**: List of customers referred
- **Usage History**: Track of referral code usage

### 8. **Real-time Features**
- **Live Updates**: Customer information updates in real-time
- **Database Sync**: Automatic synchronization with database
- **Status Changes**: Instant status updates
- **Error Handling**: Graceful handling of sync errors

## Key Technical Components

### Frontend Components
- **Customer Management Interface**: Search and display components
- **Customer Forms**: Creation and editing forms
- **Order History Components**: Display customer orders
- **Points Display**: Points balance and history components
- **Referral Components**: Referral information display

### State Management
- **customerStore.ts**: Customer data management
- **orderStore.ts**: Customer order history
- **Real-time Subscriptions**: Live data updates
- **Form State**: Customer form state management

### API Integration
- **Customer APIs**: CRUD operations for customers
- **Order APIs**: Customer order data
- **Points APIs**: Points balance and history
- **Referral APIs**: Referral information access

### Database Schema
- **customers table**: Customer personal information
- **orders table**: Customer order records
- **customer_points table**: Points balance tracking
- **points_transactions table**: Points transaction history
- **referral_usage table**: Referral system data

### Real-time Features
- **Supabase Subscriptions**: Live data updates
- **Automatic Refresh**: Customer data updates automatically
- **Status Notifications**: Real-time status changes
- **Error Recovery**: Handles connection issues gracefully

This flowchart represents the actual customer management system implemented in the codebase, showing how customers are created, managed, and integrated with the order, points, and referral systems.