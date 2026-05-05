## DiskDiff Reader — Initial Scaffold

A clinical decision-support web app for reading Kirby-Bauer / EUCAST disk diffusion plates. This first build delivers the full app shell, navigation, role-aware dashboard, and placeholder pages for every module, ready to layer real workflows on later.

### Design direction

- Clinical Blue palette: white background `#ffffff`, surface `#f1f5f9`, navy `#1e3a5f`, accent `#3b82f6`.
- Clean sans-serif (Inter), tight spacing, table-first layouts, status badges, no decorative graphics.
- Persistent "DRAFT — NOT FOR CLINICAL RELEASE" banner across the app to enforce the supervised-use safety requirement.

### Auth & roles (mock)

- Header role switcher to preview the app as: Admin, Consultant Microbiologist, Medical Laboratory Scientist, Quality Officer, Viewer.
- Current role stored in localStorage; sidebar items and dashboard widgets adapt to it.
- No real login yet — a clear "Mock auth (dev)" badge in the header. Real Lovable Cloud auth + `user_roles` table can be added in a later step.

### App shell

- Left sidebar (collapsible, icon-mini variant) with grouped navigation.
- Top header: app name, role switcher, mock user menu, draft-mode banner.
- Routes (TanStack Start, separate route files):
  - `/` Dashboard
  - `/capture` Plate Capture
  - `/qc-plate` Plate QC
  - `/measure` Zone Measurement
  - `/interpret` EUCAST Interpretation
  - `/qc-strains` QC Strain Module
  - `/reports` Reports
  - `/audit` Audit Trail
  - `/settings` Settings

### Role-aware dashboard

Cards/widgets shown per role:

- **Admin** — user counts, system status, recent audit events, link to Settings.
- **Consultant Microbiologist** — reports awaiting authorisation, recently signed reports.
- **Medical Laboratory Scientist** — plates in progress, drafts to submit, today's QC status.
- **Quality Officer** — QC strain trends placeholder, out-of-range alerts, audit summary.
- **Viewer** — read-only list of recently authorised reports.

All widgets use placeholder/sample data wired to a small in-memory store so the screens look real.

### Module placeholder pages

Each page renders its title, a short description of intended workflow, and a realistic skeleton:

- **Plate Capture** — upload area (image file picker), patient/sample metadata form (sample ID, organism, plate size 90/150 mm, medium, incubation), "Save draft" button. No image processing yet.
- **Plate QC** — checklist (lawn confluence, disk spacing, contamination, plate integrity) with pass/fail toggles and notes.
- **Zone Measurement** — uploaded image preview placeholder + editable table of antibiotic disks with manual mm entry.
- **EUCAST Interpretation** — table reading from entered zones; shows "No breakpoints loaded — import in Settings" empty state (per your choice).
- **QC Strain Module** — list of QC strains (E. coli ATCC 25922, S. aureus ATCC 25923, P. aeruginosa ATCC 27853 as seeds) with empty trend area.
- **Reports** — table of draft / pending review / authorised reports with status badges; "Authorise" action visible only to Consultant role; never auto-releases.
- **Audit Trail** — filterable table of events (user, role, action, entity, timestamp) with seeded sample rows.
- **Settings** — tabs for Users (mock list), Breakpoints (CSV import placeholder + empty table), Lab info, Plate sizes.

### Safety guardrails baked in

- Global banner reminding users this is decision-support only.
- Reports page enforces Draft → Pending Review → Authorised state machine in the UI; only Consultant Microbiologist sees the Authorise button.
- All state-changing actions log to the in-memory audit trail.

### Technical notes

- TanStack Start file-based routing under `src/routes/`, one file per module.
- Sidebar via shadcn `Sidebar` with `collapsible="icon"`, active route highlighting via `useRouterState`.
- Shared layout in `__root.tsx` wraps `SidebarProvider`, header, and `<Outlet />`.
- Role context: small React context + localStorage, exposed via `useRole()` hook.
- In-memory stores (`src/lib/mock/*`) for plates, reports, audit events, QC strains — easy to swap for Lovable Cloud later.
- Tailwind theme tokens updated in `src/styles.css` to the Clinical Blue palette (oklch values).
- Each route defines its own `head()` with title + description.

### Out of scope for this step

- Real authentication, database, RLS.
- Actual computer-vision zone detection.
- Real EUCAST breakpoint dataset (table stays empty until admin import).
- PDF report export, e-signatures, LIS integration.

These are natural follow-up plans once the shell is approved.