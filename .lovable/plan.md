

# Marketplace Procurement Suite — Multi-Role Access, Dashboard Overhaul, and Feature Enhancements

This is a large set of changes spanning authentication, role-based views, dashboard consolidation, requisition improvements, currency expansion, and talent view enhancements. Here's the full plan.

---

## 1. Authentication and Role-Based Access

### Login Page
- Create a new `/login` page with email + password fields
- Store authenticated user info (name, email, role) in a lightweight auth context (`src/lib/auth-context.tsx`)
- Wrap `AppLayout` with an auth guard that redirects unauthenticated users to `/login`
- Since there's no Supabase connected, authentication will use an in-memory user store for now

### Three Role Versions

| Role | Sidebar Access | Restrictions |
|------|---------------|-------------|
| **Admin** (renamed from Founder) | All pages | Full access to everything |
| **Pod Lead / Recruiter** | Requisitions, Handover, Talent X Client, Studio Dashboard, Dashboard | Studio Dashboard hides overall financial summary (revenue/cost/margin cards). Deal-level data visible |
| **Capability Lead / Account Manager** | Requisitions (raise + own only), Talent X Client (own clients only) | No Dashboard, no Creator Database, no Studio Dashboard |

### Admin Role Switcher
- Add a dropdown in the sidebar footer (visible to Admin only) to toggle between the three role views for testing purposes
- The active role will be stored in React context and will filter sidebar items and page-level content accordingly

### User Management (Settings Page)
- Extend the Settings page with a "User Management" card
- Admin can add users by entering email and assigning a role
- New users get a "Set Password" flow on first login (simulated with a flag in the user store)

---

## 2. Dashboard Overhaul

### Merge Recruiter + Team Metrics
- Remove the separate "Recruiter" tab
- Keep three tabs: **Team Metrics** (with recruiter comparison table + pipeline charts), **HRBP**, **Creator Summary**
- The Team Metrics view will include the recruiter selector and per-recruiter drill-down that was previously in the Recruiter tab

### Time Range Options
- Replace the current "Last 365 / All" selector with: **Last 30, Last 60, Last 90, Last 180, Last 365, Overall**

### Clickable Metric Cards
- When clicking any stat card (e.g., "Total Requisitions", "Closed", "In Progress"), open a dialog or inline section showing the list of matching requisitions
- For "Avg Days to Close", show a list of deals that breached TAT
- Add a new card: "TAT Breached" showing count of requisitions where target closure date was exceeded, clickable to show the list

---

## 3. Requisition Form Changes

### Currency Duplication Fix
- In the deal-level financial section, remove the standalone currency selector next to each field and keep only the single currency selector next to MRR

### Urgency Scale
- Replace the 1-10 slider with a simple select: **Low, Medium, High, Critical** (already defined in `URGENCY_LEVELS`)

### Approval Queue View
- Add a new tab or section at the top of `RequisitionsAdvanced.tsx` called "Pending Approvals" visible to Admin role
- Shows all requisitions with status "RMG approval Pending" or `taEditedPendingApproval = true`
- Each row has quick Approve / Reject buttons for fast processing

### Status Filter in Requisitions
- Add a multi-select or chip-based filter bar allowing users to filter requisitions by one or more statuses simultaneously

### Currency Expansion
- Add more currencies to the `CURRENCIES` array: GBP, EUR, AED, SGD, AUD (with flags and symbols)
- The CurrencyInput and CurrencySelect components already iterate over the array, so they'll pick up new options automatically

---

## 4. Talent X Client View — City-Level Geography

### City Field on Creators
- Add a `city` field to `DeployedCreatorV2` interface
- Update mock data with sample cities (Mumbai, Bangalore, Delhi, New York, etc.)
- In the Studio Dashboard geography view, replace country-level grouping with city-level grouping
- Allow editing city when adding or editing a creator in the Studio Dashboard

---

## 5. Technical Details

### New Files
| File | Purpose |
|------|---------|
| `src/lib/auth-context.tsx` | React context for auth state, role management, user store |
| `src/pages/Login.tsx` | Login page with email/password |

### Modified Files
| File | Changes |
|------|---------|
| `src/App.tsx` | Add auth provider wrapper, login route, auth guard on AppLayout |
| `src/components/AppSidebar.tsx` | Role-based sidebar filtering, rename "Founder" to "Admin", add role switcher dropdown |
| `src/components/AppLayout.tsx` | Auth guard redirect logic |
| `src/pages/Settings.tsx` | Add User Management section for admin |
| `src/pages/Dashboard.tsx` | Merge recruiter+team tabs, add time range options, clickable metrics with drill-down dialogs, TAT breach view |
| `src/pages/RequisitionsAdvanced.tsx` | Add pending approvals queue, multi-status filter, role-based content filtering |
| `src/pages/NewRequisition.tsx` | Remove duplicate currency selector, switch urgency to Low/Med/High/Critical select |
| `src/pages/StudioDashboard.tsx` | Hide financial summary for Pod Lead/Recruiter role, city-based geography view |
| `src/pages/DealMargins.tsx` | Role-based client filtering for Capability Lead role |
| `src/lib/requisition-types.ts` | Expand CURRENCIES array with GBP, EUR, AED, SGD, AUD |
| `src/lib/talent-client-store.ts` | Add `city` field to `DeployedCreatorV2`, update mock data |
| `src/lib/auth-context.tsx` | New - auth state management |

### Key Architecture Decisions
- **No Supabase**: Auth will be simulated with in-memory state. The structure is designed so it can be swapped for real Supabase auth later
- **Role context**: A single `useAuth()` hook provides `currentRole`, `currentUser`, and `switchRole()` (admin only)
- **Sidebar filtering**: Each nav item gets a `roles` array; items not matching the current role are hidden
- **Page-level guards**: Pages check `currentRole` and conditionally hide sections (e.g., Studio financial summary)

