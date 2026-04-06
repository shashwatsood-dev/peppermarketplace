

## Why Data Isn't Saved

All data lives in a local JavaScript variable (`let pods: PodV2[]`). On every page refresh, it reinitializes from seed data. No database tables exist yet.

## Plan: Persist Data to Lovable Cloud

### Step 1: Create Database Tables

Create migrations for the following tables:

```text
pods         (id, name)
clients      (id, pod_id, client_name, vsd_name, principal_bopm, senior_bopm, junior_bopm)
deals        (id, client_id, deal_name, deal_type, status, currency, signing_entity, geography, is_content_studio, vsd_name)
creators     (id, deal_id, creator_name, role, source, pay_model, pay_rate, expected_volume, total_cost, client_billing, deal_status, capability_lead_rating, bopm_rating, capability_rating_reason, bopm_rating_reason, hrbp_name, start_date, city, ops_link, linkedin_id, currency)
hrbp_connects (id, creator_id, date, summary, outcome, hrbp_name)
monthly_payments (id, creator_id, month, amount, paid)
```

Enable RLS on all tables. Since auth exists, policies will allow authenticated users full CRUD.

### Step 2: Seed Initial Data

Write a one-time seed migration that inserts the current pod/client/deal/creator data from `pods-seed-data.ts` and `csv-creator-import.ts` into the new tables.

### Step 3: Refactor Store to Use Supabase

Replace the in-memory `talent-client-store.ts` with functions that read/write from the database using the Supabase client. Each mutation function (`addClientToPod`, `updateDeal`, `addCreatorToDeal`, etc.) becomes an async function calling `supabase.from('table').insert/update/delete`.

### Step 4: Update UI Components

- `DealMargins.tsx` — fetch pods/clients/deals via `useQuery` hooks instead of calling `getPods()`
- `CreatorDatabase.tsx` — query creators table directly
- `StudioDashboard.tsx` — same pattern
- Add loading states and error handling

### Step 5: Creator Database Auto-Sync

Add a database trigger or application-level logic so that inserting a creator into a deal also upserts them into a central `creator_profiles` table (the unified creator database).

### Technical Notes

- Computed fields (grossMargin, grossMarginPercent) will be calculated client-side or via database generated columns
- The CSV import functions will be updated to insert into the database instead of merging into the in-memory array
- All existing functionality (transfer/copy creators, move clients between pods, CSV export) will be preserved but backed by database operations

