

## Plan: Talent X Client View Enhancements

### 1. Edit Creator Dialog
Add an "Edit" button (pencil icon) next to each creator's status column in the deal table. Clicking opens an `EditCreatorDialog` with all fields pre-populated: name, role, source, pay model, currency, pay rate, cost, billing, ops link, LinkedIn, city, expected volume. Uses `dbUpdateCreator` to persist. Layout: 2-column grid for a clean summary view.

**Files:** `DealMargins.tsx` — new `EditCreatorDialog` component + edit button in creator table row.

### 2. Show All Three BOPM Names in Collapsed Client View
Update the collapsed `ClientCard` subtitle (line 585) from showing only `principalBOPM` to showing all three: Principal, Senior, and Junior BOPM names inline.

**Files:** `DealMargins.tsx` — `ClientCard` collapsed view.

### 3. Enhanced Deal Creation Form
Add new fields to the `AddDealDialog` and `EditDealDialog`: Deal ID (auto-generated, shown read-only), MRR, contract duration, contract start date, contract end date. Requires a database migration to add columns: `mrr`, `contract_duration`, `contract_start_date`, `contract_end_date` to the `deals` table. Update `db-store.ts` for the new fields, and `DealV2` type in `talent-client-types.ts`.

**Files:** `talent-client-types.ts`, `DealMargins.tsx`, `db-store.ts` + DB migration.

### 4. Capability Tagging on Deals
Add a multi-select for capabilities (SEO, Content, Creative) and a text field for capability leader on each deal. Requires DB migration to add `capabilities` (text array) and `capability_leader` (text) columns to the `deals` table. Show capability tags as badges on the deal row header. Update types, store, and both Add/Edit deal dialogs.

**Files:** `talent-client-types.ts`, `DealMargins.tsx`, `db-store.ts` + DB migration.

### 5. Improved Creator Add Form Layout
Redesign `BulkAddCreatorDialog` from a single cramped row to a 2-3 row card-based layout per creator. Rename "Unit Rate" → "Creator Unit Rate", "Billing" → "Client Unit Price". Conditionally hide "City" when source is "Freelancer". Larger input fields for readability.

**Files:** `DealMargins.tsx` — `BulkAddCreatorDialog` layout refactor.

### Database Migration
Single migration adding to `deals` table:
- `mrr numeric NOT NULL DEFAULT 0`
- `contract_duration text NOT NULL DEFAULT ''`
- `contract_start_date text NOT NULL DEFAULT ''`
- `contract_end_date text NOT NULL DEFAULT ''`
- `capabilities text[] NOT NULL DEFAULT '{}'`
- `capability_leader text NOT NULL DEFAULT ''`

