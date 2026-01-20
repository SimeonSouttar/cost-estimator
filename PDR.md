# Product Design Record (PDR)

## Completed Features

### 1. Role Management
- **Description**: Define and manage roles with detailed cost structures.
- **Key Capabilities**:
    - Create, edit, and delete roles.
    - Set `internal_rate` (cost to company) and `charge_out_rate` (price to client) for each role using a standardized interface.

### 2. Rate Cards
- **Description**: Manage standardized sets of rates to ensure consistency across different project estimates.
- **Key Capabilities**:
    - Create and maintain multiple rate cards.
    - Associate roles with specific rate definitions.

### 3. Estimate Creation Wizard
- **Description**: A guided, multi-step interface for creating comprehensive project cost estimates.
- **Key Capabilities**:
    - **Project Setup**: Input core details like Project Name, Client, Type, Start Date, Duration, and Currency.
    - **Role Selection**: seamless selection of roles required for the specific project from the available pool.
    - **Task Breakdown**: Define specific tasks and assign roles with day allocations.

### 4. Dynamic Cost Calculation
- **Description**: Real-time engine that calculates project financials.
- **Key Capabilities**:
    - Automatic calculation of Total Cost, Total Revenue, and Margin based on assigned days and rates.
    - Support for global currency configuration (default: GBP).

### 5. Margin Control
- **Description**: Tools to ensure project profitability aligns with business goals.
- **Key Capabilities**:
    - Global configuration for `target_margin_percent`.
    - Real-time visibility into estimated margins against the target.

### 6. Administration & Settings
- **Description**: System-wide configuration and maintenance.
- **Key Capabilities**:
    - **Settings**: Configure global parameters like Target Margin.
    - **Database Management**: Schema definitions and initialization handling (sqlite/turso).
