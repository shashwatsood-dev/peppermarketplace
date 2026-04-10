

# Implementation Plan — Platform Overhaul

This is a large set of changes spanning authentication, ATS, handover, Talent x Client, Studio Dashboard, and data cleanup. I'll break it into 7 work phases.

---

## Phase 1: Authentication & Role Overhaul

**Current state:** Client-side auth with hardcoded users, 3 roles (admin, pod_lead_recruiter, capability_lead_am).

**Changes:**
- Replace client-side auth with Lovable Cloud (Supabase Auth) for real email/password signup & login
- Add a signup page with email, password, and show/hide password toggle
- All new signups default to "admin" role (which now merges with pod_lead/recruiter view)
- Simplify roles to just 2: `admin` (combines current admin + pod_lead_recruiter) and `capability_lead_am`
- Create a `profiles` table (id, user_id, email, name, role, created_at) and a `user_roles` table
- On signup, auto-create profile and add the user's name to the recruiter list system-wide
- Settings page: show all registered users, allow admin to reset accounts, add/delete users, and change roles
- Auto-confirm email signups (since this is an internal tool)

**Database migrations:**
- `profiles` table with user_id FK to auth.users, email, name, created_at
- `user_roles` table with user_id, role enum
- RLS policies so users can read all profiles but only update their own

---

## Phase 2: Recruiter Auto-Registration

**Current state:** Recruiters are hardcoded in `taMetrics.recruiterPerformance` (Neha Gupta, Ravi Kumar).

**Changes:**
- Remove "Neha Gupta" and "Ravi Kumar" from hardcoded mock data
- Create a `recruiters` table in DB (or derive from profiles where role = admin)
- When a new admin signs up, auto-add them as a recruiter
- Dashboard, requisitions, handover pages all pull recruiter list from DB profiles
- Performance tracking auto-initializes for new recruiters

---

## Phase 3: Requisition & ATS Fixes

**Requisition form without login:**
- Create a public route `/requisitions/new-public` that doesn't require authentication
- The shareable link allows anyone to fill the form without signing in

**ATS fixes:**
- **Custom stages:** Add UI to create/reorder/delete pipeline stages per requisition, stored in a `custom_pipeline_stages` table or JSONB on the requisition
- **Candidate database flow:** Ensure all creators from the database flow into ATS candidate selection
- **Availability field:** Add "availability" to the new candidate form in ATS pipeline
- **Replicate add creator form:** Mirror the Candidates section's add form inside the ATS pipeline requisition view
- **Shared notes:** Make candidate notes within a requisition visible to all users (persist to DB)
- **Meeting link fix:** Ensure "Join Meeting" opens the URL in a new tab with proper `https://` prefix
- **Creator detail editing in overview:** Add edit button on candidate overview cards
- **Samples/Portfolio section:** Add an editable section for portfolio links; clicking opens in new tab
- **Interview scoring:** After interview, allow anyone to fill score and add interview notes
- **Screening notes section:** Add a dedicated screening notes area on the candidate detail view

---

## Phase 4: Handover Tab Fixes

**Current state:** Pulls from mock requisition data, not from DB.

**Changes:**
- Add POD selector → filters clients → filters deals (sourced from `pods/clients/deals` DB tables)
- Fix data flow so deals come from both requisitions and Talent x Client view
- Margin calculation: instead of pulling margin directly from requisition, use the role's associated pay rate from the requisition and calculate margin from `(client billing - finalized pay) / client billing`

---

## Phase 5: Talent x Client View Enhancements

**Changes:**
- **Deal notes:** Add a `deal_notes` table (id, deal_id, note, author, created_at) for historical notes per deal
- **Deal health color:** Add a `health_status` column to deals table (red/green/yellow), highlight the deal row with the selected color
- **Summary cards:** Add total red/green/yellow deal and client counts in the pod summary and overall summary
- **Creator engagement history:** Add a `creator_notes` table for historical capability lead/BOPM notes per creator, displayed as a timeline

---

## Phase 6: Studio Dashboard Fixes

**Changes:**
- **HRBP log visibility:** Fix the HRBP connect log display — ensure it fetches from DB and renders correctly
- **R/G/Y color coding:** Add health status color coding similar to Talent x Client view
- **Agreement upload:** Create a Supabase storage bucket (`agreements`, max 10MB PDF) and implement file upload/download for creator agreements

---

## Phase 7: Email Integration

**Changes:**
- This requires connecting Gmail for sending emails from the platform
- Gmail OAuth integration is not natively supported in Lovable Cloud
- I'll implement this using a connector or guide you through setting up Gmail API credentials
- Email sending will be wired into ATS (interview scheduling), handover (sharing), and Talent x Client (feedback emails)

---

## Data Cleanup

- Remove "Neha Gupta" and "Ravi Kumar" from all hardcoded recruiter references in `mock-data.ts`, `ats-store.ts`, and any seed data

---

## Technical Details

**New DB tables:**
- `profiles` — user profiles linked to auth.users
- `user_roles` — RBAC roles
- `deal_notes` — historical notes per deal
- `creator_engagement_notes` — BOPM/capability lead notes per creator
- `custom_pipeline_stages` — custom ATS stages per requisition

**New storage bucket:**
- `agreements` — PDF uploads up to 10MB

**Modified files (major):**
- `auth-context.tsx` → replaced with Supabase Auth
- `Login.tsx` → add signup flow with show/hide password
- `Settings.tsx` → user management with DB-backed users
- `AppLayout.tsx` → public route handling
- `App.tsx` → new routes
- `ATSPipeline.tsx` → custom stages, notes, scoring, portfolio, screening
- `ATSOverview.tsx` → creator edit
- `CreatorHandover.tsx` → POD→Client→Deal cascade, margin calc
- `DealMargins.tsx` → deal notes, health colors, summary counts, creator notes
- `StudioDashboard.tsx` → HRBP fix, R/G/Y, agreement upload
- `Dashboard.tsx` → dynamic recruiter list from DB
- `mock-data.ts` → remove hardcoded recruiters
- `NewRequisition.tsx` → public access variant

**Estimated scope:** ~15-20 file changes, 5 DB migrations, 1 storage bucket.

This is a significant overhaul. I recommend implementing it in the phases listed above, starting with authentication since many other features depend on it. Shall I proceed?

