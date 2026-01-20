# Cost Estimator - Project Context

## Overview
Cost Estimator is a web application designed to help create and manage project cost estimates. It allows users to define roles with rates, create estimates for projects, assign roles to tasks, and calculate costs and margins.

For a detailed breakdown of developed features, please refer to the [Product Design Record (PDR)](./PDR.md).

## Tech Stack
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Frontend Library**: [React 19](https://react.dev/)
- **Database**: SQLite (via [Turso](https://turso.tech/) or local file)
- **Database Client**: `@libsql/client`
- **Styling**: CSS Modules / Global CSS (inferred)

## Project Structure
- **`app/`**: Application routes and pages (App Router).
  - **`api/`**: Backend API endpoints.
    - `estimates/`: CRUD for estimates.
    - `rate-cards/`: Management of rate cards.
    - `roles/`: Role management.
    - `settings/`: Application settings.
- **`components/`**: Reusable React components.
- **`lib/`**: Shared libraries and utilities.
  - `db.js`: Database client initialization and schema definitions.
- **`scripts/`**: Utility scripts (e.g., `verify-turso.js`).

## Database Schema
The application uses a SQLite database with the following schema (defined in `lib/db.js`):

### `roles`
Stores reusable role definitions with standard rates.
- `id`: INTEGER PRIMARY KEY
- `name`: TEXT UNIQUE
- `internal_rate`: REAL
- `charge_out_rate`: REAL

### `estimates`
Stores the high-level details of a cost estimate.
- `id`: INTEGER PRIMARY KEY
- `project_name`: TEXT
- `client_name`: TEXT
- `type`: TEXT
- `start_date`: TEXT
- `duration`: INTEGER
- `duration_unit`: TEXT (default: 'weeks')
- `currency`: TEXT (default: 'GBP')
- `created_at`: TEXT

### `estimate_roles`
associates specific roles to an estimate, capturing the rates at the time of estimation.
- `id`: INTEGER PRIMARY KEY
- `estimate_id`: INTEGER (FK -> estimates.id)
- `role_id`: INTEGER (FK -> roles.id)
- `internal_role_id`: INTEGER (FK -> roles.id)

### `estimate_tasks`
Breakdown of work items within an estimate.
- `id`: INTEGER PRIMARY KEY
- `estimate_id`: INTEGER (FK -> estimates.id)
- `description`: TEXT
- `days`: REAL

### `estimate_task_roles`
Assignment of roles to specific tasks.
- `id`: INTEGER PRIMARY KEY
- `task_id`: INTEGER (FK -> estimate_tasks.id)
- `estimate_role_id`: INTEGER (FK -> estimate_roles.id)

### `settings`
Key-value store for global application settings.
- `key`: TEXT PRIMARY KEY
- `value`: TEXT
- *Default*: `target_margin_percent` = '30'

## Environment Variables
The application relies on the following environment variables (defined in `.env`):
- `TURSO_DATABASE_URL`: Connection string for the database (e.g., `libsql://...` or `file:estimates.db`).
- `TURSO_AUTH_TOKEN`: Authentication token for Turso.
- `NODE_ENV`: 'development' or 'production'.

## Key Features
- **Rate Cards**: Manage standard rates for different roles.
- **Estimate Creation**: Wizard-style interface for creating new estimates.
- **Margins**: Configurable target margin percentage.
- **Dynamic Calculation**: Costs are calculated based on role rates and assigned time.

## Source Control
- **Repository**: [https://github.com/SimeonSouttar/cost-estimator](https://github.com/SimeonSouttar/cost-estimator)

### Development Workflow
When making code changes, follow this standard git process:

1. **Sync with Remote**: Ensure you are on the latest `main` branch.
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create a Feature Branch**: Create a new branch for your specific task.
   ```bash
   git checkout -b feature/your-descriptive-branch-name
   ```

3. **Make Changes & Commit**: Commit often with clear messages.
   ```bash
   git add .
   git commit -m "feat: added new rate card feature"
   ```

4. **Verify**: Run any necessary scripts or tests.
   ```bash
   npm run build
   # or specific verification scripts
   node scripts/verify-turso.js
   ```

5. **Push Updates**:
   ```bash
   git push origin feature/your-descriptive-branch-name
   ```
