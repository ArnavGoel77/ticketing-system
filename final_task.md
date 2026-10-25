# IT Service Desk: Comprehensive Implementation Tasks (Website Refactor)

> **Document:** `final_task.md` &bull; **Audience:** Arnav Goel & Shobit  
> **Purpose:** Detailed implementation blueprint addressing teacher feedback (Dedicated routes, persona-based login with role passwords, issue description field, engineer-controlled criticality, and live investigating engineer contact cards).  
> **Execution Strategy:** **Phase 1 (Shobit)** builds Auth and Admin $\rightarrow$ Commits & Merges to `main` $\rightarrow$ **Phase 2 (Arnav)** pulls `main` and builds Ticket Workflows, User Portal, and Engineer Workbench.

---

## 🎯 Architectural Context & Teacher Requirements

1. **Dedicated Pages / Routes:** Replace the single-page profile switcher with 4 distinct URLs:
   * `/login` &mdash; Single corporate login landing page.
   * `/user` &mdash; End-User Self-Service Portal.
   * `/engineer` &mdash; Support Engineer Incident Workbench.
   * `/admin` &mdash; System Administrator Governance Center.
2. **Persona-Based Login (No complex auth overhead):**
   * Users log in using their corporate email and a simple, role-based generic password:
     * **End Users (`USER`):** password = `user`
     * **Support Engineers (`TECHNICIAN`):** password = `engineer`
     * **System Admins (`ADMIN`):** password = `admin`
   * The app stores the authenticated employee in `localStorage` (`currentUser`).
   * When creating or resolving a ticket, the user's identity is **automatically locked** to the logged-in employee (no dropdown identity pickers!).
3. **Issue Explanation Field:**
   * End users can explain their problem in detail via a new `issue_description VARCHAR2(1000)` column in `TICKETS`.
4. **Engineers Decide Criticality (Not End Users):**
   * End users cannot choose priority (it defaults to `MEDIUM` on submission).
   * Engineers evaluate the technical impact on their workbench and set `priority_level` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
5. **Live Investigating Engineer Contact Card:**
   * When an engineer clicks **"Investigate"**, `TICKETS.assigned_to` stores that engineer's ID.
   * On the End User's portal, the ticket displays an **Investigation Card** showing the engineer's **Name, Corporate Email, and Office Building Location**.

---

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PHASE 1: SHOBIT (Estimated: Day 1)                   │
│   • Task S1: Backend Login API (/api/auth/login)                       │
│   • Task S2: Single Landing Page (/login) with Quick Demo Chips        │
│   • Task S3: System Admin Console (/admin) + Session Guarding          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                        git commit & push to origin/shobit
                        Merge PR into main on GitHub
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   PHASE 2: ARNAV (Estimated: Day 2)                    │
│   • Step 0:  Pull latest main into arnav branch                        │
│   • Task A1: Oracle DDL: Add issue_description & assigned_to to TICKETS│
│   • Task A2: Backend Ticket API Updates (/api/tickets routes)          │
│   • Task A3: End-User Portal (/user) with Description & Contact Cards  │
│   • Task A4: Engineer Workbench (/engineer) with Criticality Triage    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                        git commit & push to origin/arnav
                        Merge PR into main on GitHub
                                    ▼
                          PROJECT 100% COMPLETE
```

---

# 👤 PHASE 1: SHOBIT'S TASKS (Start Here)

> **Module Responsibility:** Identity, Personnel Directory, Authentication & System Administration.

### Task S1: Backend Authentication Endpoint (`/api/auth/login`)
* **Files:**
  * Create: `server/routes/auth.js`
  * Modify: `server/server.js` (mount route: `app.use('/api/auth', require('./routes/auth'));`)
* **Detailed Instructions:**
  1. Create a `POST /login` route expecting JSON: `{ "email": "...", "password": "..." }`.
  2. Sanitize email using `.trim().toLowerCase()`.
  3. Query Oracle DB using `server/db.js`:
     ```sql
     SELECT 
         e.employee_id,
         e.department_id,
         e.full_name,
         e.email,
         e.role,
         d.department_name,
         d.location_building,
         'EMP-' || LPAD(TO_CHAR(e.employee_id), 4, '0') AS formatted_badge_id
     FROM EMPLOYEES e
     LEFT OUTER JOIN DEPARTMENTS d ON e.department_id = d.department_id
     WHERE LOWER(e.email) = :email
     ```
  4. If no user matches $\rightarrow$ return `401 Unauthorized`:
     `{ "success": false, "message": "No corporate account found with that email address." }`
  5. Validate generic password based on `role`:
     * If `role === 'USER'` and password !== `'user'` $\rightarrow$ return `401 Invalid password (use 'user')`.
     * If `role === 'TECHNICIAN'` and password !== `'engineer'` $\rightarrow$ return `401 Invalid password (use 'engineer')`.
     * If `role === 'ADMIN'` and password !== `'admin'` $\rightarrow$ return `401 Invalid password (use 'admin')`.
  6. On successful match, return `200 OK`:
     ```json
     {
       "success": true,
       "data": {
         "employee_id": 101,
         "full_name": "Aarav Sharma",
         "email": "aarav.sharma@company.com",
         "role": "USER",
         "department_name": "Engineering",
         "location_building": "Innovation Block",
         "formatted_badge_id": "EMP-0101"
       },
       "message": "Authentication successful"
     }
     ```

---

### Task S2: Frontend Landing Page (`/login`) & Session Management
* **Files:**
  * Modify: `client/src/App.jsx` (or extract `client/src/components/Login.jsx`)
  * Modify: `client/src/index.css`
* **Detailed Instructions:**
  1. Set up route/view routing in React:
     * Maintain state `currentRoute` (syncing with `window.location.pathname` or a simple clean path router).
     * If user is NOT logged in (`!localStorage.getItem('currentUser')`), all routes redirect to `/login`.
  2. Design the `/login` landing page:
     * Header with system title: **"IT Service Desk &bull; Enterprise Sign-In"**.
     * Form inputs: Corporate Email (`type="email"`) and Password (`type="password"`).
     * Add **Quick Demo Login Chips** below the form for 1-click viva demonstrations:
       * Chip 1: `[👤 Demo User: Aarav]` $\rightarrow$ auto-fills `aarav.sharma@company.com` and `user`.
       * Chip 2: `[🛠️ Demo Engineer: Vikram]` $\rightarrow$ auto-fills `vikram.malhotra@company.com` and `engineer`.
       * Chip 3: `[🛡️ Demo Admin: Suresh]` $\rightarrow$ auto-fills `suresh.menon@company.com` and `admin`.
  3. On submit, call `POST /api/auth/login`:
     * If successful:
       * Save session: `localStorage.setItem('currentUser', JSON.stringify(res.data))`.
       * Redirect according to role:
         * If `role === 'USER'` $\rightarrow$ navigate to `/user`
         * If `role === 'TECHNICIAN'` $\rightarrow$ navigate to `/engineer`
         * If `role === 'ADMIN'` $\rightarrow$ navigate to `/admin`
     * If failed: Show red error toast with server error message.

---

### Task S3: Frontend Admin Route (`/admin`) & Global Navbar
* **Files:**
  * Modify: `client/src/App.jsx`
* **Detailed Instructions:**
  1. Create the persistent **Global App Header** for authenticated pages:
     * Left side: System Logo & Portal Title.
     * Right side: User Profile Badge:
       * Avatar with initials (e.g. `SM`).
       * Label: `Suresh Menon (EMP-0301 • IT Support)`.
       * Pill badge: `System Admin`.
       * Red/Neutral `[Sign Out]` button: clears `localStorage.removeItem('currentUser')` and redirects to `/login`.
  2. Implement the dedicated `/admin` view:
     * Accessible **only** if `currentUser.role === 'ADMIN'`. (If a `USER` visits `/admin`, redirect them to `/user`).
     * Tab 1: **Staff & Organization Management** (Shobit's core module):
       * List departments and employees.
       * "Register Employee" modal form (`POST /api/employees`).
       * "Delete Employee" action with custom warning confirmation modal.
     * Tab 2: **System Incident Oversight**:
       * View all tickets across the campus.
       * Permanent "Delete Ticket" administrative action with confirmation modal.
     * Tab 3: **Analytical SQL Lab**:
       * Real-time query execution cards showing Oracle single-row and group function outputs.

---

### 🚀 Shobit's Git Sequence (When Phase 1 is Complete):
```bash
# 1. Switch to shobit branch
git checkout shobit

# 2. Stage changes
git add server/routes/auth.js server/server.js client/

# 3. Check status
git status

# 4. Commit and push
git commit -m "feat(shobit): implement auth API, /login landing page, and /admin governance console"
git push origin shobit

# 5. Open Pull Request on GitHub from 'shobit' into 'main' and merge it.
```

---

# 👤 PHASE 2: ARNAV'S TASKS (After Shobit Pushes)

> **Module Responsibility:** Ticket Management, Issue Descriptions, Engineer Criticality Triage, and Investigation Tracking.

### Step 0: Pull Shobit's Work from Main
```bash
git checkout arnav
git pull origin main
```

---

### Task A1: Database Schema & Seed Updates (`TICKETS`)
* **Files:**
  * Modify: `sql/01_schema.sql`
  * Modify: `sql/02_seed_data.sql`
  * Modify: `server/seed.js`
* **Detailed Instructions:**
  1. Execute the schema alteration in your Oracle Cloud SQL worksheet:
     ```sql
     -- 1. Add issue description column
     ALTER TABLE TICKETS ADD issue_description VARCHAR2(1000);

     -- 2. Add assigned investigating engineer foreign key
     ALTER TABLE TICKETS ADD assigned_to NUMBER REFERENCES EMPLOYEES(employee_id);
     ```
  2. Update `sql/01_schema.sql` so the permanent `CREATE TABLE TICKETS` definition includes:
     ```sql
     CREATE TABLE TICKETS (
         ticket_id         NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
         user_id           NUMBER NOT NULL REFERENCES EMPLOYEES(employee_id) ON DELETE CASCADE,
         assigned_to       NUMBER REFERENCES EMPLOYEES(employee_id),
         issue_category    VARCHAR2(50) NOT NULL,
         issue_description VARCHAR2(1000),
         priority_level    VARCHAR2(20) DEFAULT 'MEDIUM' NOT NULL 
                           CHECK (priority_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
         status            VARCHAR2(20) DEFAULT 'OPEN' NOT NULL 
                           CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
         created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
     );
     ```
  3. Update `sql/02_seed_data.sql` and `server/seed.js` with realistic descriptions and assignments:
     * Ticket `1001`: `issue_description = 'Core gateway switch port 24 failing under heavy traffic load'`, `assigned_to = 201`.
     * Ticket `1002`: `issue_description = 'Workstation experiencing severe thermal throttling and loud fan noise'`, `assigned_to = 202`.
     * Ticket `1003`: `issue_description = 'Outlook search index corrupt; cannot sync departmental mailbox'`, `assigned_to = 203`.
     * Ticket `1004`: `issue_description = 'Active Directory profile locked out after consecutive password attempts'`, `assigned_to = 201`.
     * Ticket `1005`: `issue_description = 'VPN connection drops intermittently every 15 minutes'`, `assigned_to = 201`.
     * Ticket `1006`: `issue_description = 'Department shared mailbox receiving spam filter bouncebacks'`, `assigned_to = NULL`.
     * Ticket `1007`: `issue_description = 'IDE license key activation rejected on development server'`, `assigned_to = NULL`.
     * Ticket `1008`: `issue_description = 'Dual monitor setup displays black screen on second DisplayPort'`, `assigned_to = NULL`.
  4. Run `node seed.js` in `server/` to verify clean reseeding.

---

### Task A2: Backend Ticket API Updates (`server/routes/tickets.js`)
* **Files:**
  * Modify: `server/routes/tickets.js`
* **Detailed Instructions:**
  1. Update `GET /api/tickets`:
     * Expand query to join assigned engineer and their department building:
       ```sql
       SELECT 
           t.ticket_id,
           t.user_id,
           NVL(e.full_name, 'User #' || t.user_id) AS reporter_name,
           NVL(e.email, 'N/A') AS reporter_email,
           t.issue_category,
           t.issue_description,
           t.priority_level,
           t.status,
           TO_CHAR(t.created_at, 'DD-Mon-YYYY HH24:MI:SS') AS formatted_created_at,
           -- Assigned Investigating Engineer Details:
           t.assigned_to,
           assignee.full_name        AS assigned_engineer_name,
           assignee.email            AS assigned_engineer_email,
           assignee_dept.department_name AS assigned_engineer_dept,
           assignee_dept.location_building AS assigned_engineer_location,
           -- Resolution Details:
           r.resolution_id,
           NVL(r.resolution_notes, 'Pending Assignment / Active Triage') AS resolution_notes,
           TO_CHAR(r.resolved_at, 'DD-Mon-YYYY HH24:MI:SS') AS formatted_resolved_at,
           tech.full_name AS technician_name
       FROM TICKETS t
       LEFT OUTER JOIN EMPLOYEES e ON t.user_id = e.employee_id
       LEFT OUTER JOIN EMPLOYEES assignee ON t.assigned_to = assignee.employee_id
       LEFT OUTER JOIN DEPARTMENTS assignee_dept ON assignee.department_id = assignee_dept.department_id
       LEFT OUTER JOIN TICKET_RESOLUTIONS r ON t.ticket_id = r.ticket_id
       LEFT OUTER JOIN EMPLOYEES tech ON r.technician_id = tech.employee_id
       ORDER BY t.ticket_id DESC;
       ```
  2. Update `POST /api/tickets`:
     * Accept `issue_description` in `req.body`.
     * Validate `issue_description`: Must not be empty.
     * Force `priority_level` to default to `'MEDIUM'` if not provided by caller.
     * Insert:
       ```sql
       INSERT INTO TICKETS (user_id, issue_category, issue_description, priority_level, status)
       VALUES (:user_id, :issue_category, :issue_description, 'MEDIUM', 'OPEN')
       ```
  3. Update `PUT /api/tickets/:id`:
     * Support updating `assigned_to` and `priority_level`.
     * When an engineer clicks "Investigate", the request sends `{ status: 'IN_PROGRESS', assigned_to: 201 }`.
     * When an engineer changes priority, the request sends `{ priority_level: 'CRITICAL' }`.

---

### Task A3: Frontend End-User Portal (`/user`)
* **Files:**
  * Modify: `client/src/App.jsx`
* **Detailed Instructions:**
  1. Dedicated `/user` view (accessible when `currentUser.role === 'USER'`):
     * Header shows: `Logged in as: Aarav Sharma (EMP-0101 • Engineering)` + `[Logout]`.
  2. **Refactor "Create Ticket" Modal:**
     * **Requester:** Locked to `currentUser.full_name` (display badge, no dropdown).
     * **Category:** Dropdown (`NETWORK`, `HARDWARE`, `SOFTWARE`, etc.).
     * **Issue Explanation Textarea:**
       * Label: *"Describe the issue in detail"*.
       * Placeholder: *"Explain symptoms, error messages, and when the issue started..."*.
       * Required field.
     * **Priority Selector:** **Removed completely** (as requested by teacher).
  3. **Ticket Grid & Contact Cards:**
     * Filter table to show tickets submitted by this logged-in user (`t.USER_ID === currentUser.employee_id`).
     * For each ticket that is `IN_PROGRESS` or `RESOLVED` with an assigned engineer, display the **Live Investigating Engineer Contact Card**:
       ```text
       ┌────────────────────────────────────────────────────────────┐
       │ 🔍 Assigned Engineer: Vikram Malhotra (IT Support)        │
       │ 📧 Email: vikram.malhotra@company.com                      │
       │ 🏢 Office Location: Tech Park A                            │
       └────────────────────────────────────────────────────────────┘
       ```
     * For resolved tickets, show the full resolution diagnosis notes and completion timestamp.

---

### Task A4: Frontend Support Engineer Workbench (`/engineer`)
* **Files:**
  * Modify: `client/src/App.jsx`
* **Detailed Instructions:**
  1. Dedicated `/engineer` view (accessible when `currentUser.role === 'TECHNICIAN'`):
     * Header shows: `Logged in as: Vikram Malhotra (EMP-0201 • IT Support)` + `[Logout]`.
     * Left sidebar with Category filtering (`NETWORK`, `HARDWARE`, etc.).
  2. **Criticality / Priority Triage Feature:**
     * On each ticket row/card, add an **inline Priority Selector**:
       * Dropdown values: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
       * When the engineer changes priority, trigger `PUT /api/tickets/:id` with `{ priority_level: newPriority }` and show success toast: `"Ticket #1005 priority updated to HIGH"`.
  3. **"Start Investigation" Action:**
     * When ticket is `OPEN`, show an **"Investigate"** button.
     * On click, automatically call `PUT /api/tickets/:id` with:
       ```json
       {
         "status": "IN_PROGRESS",
         "assigned_to": currentUser.employee_id
       }
       ```
     * Ticket status immediately flips to `IN_PROGRESS`, and the engineer is locked as the investigator.
  4. **"Resolve Incident" Workflow:**
     * In the Resolve modal:
       * Resolving engineer is **locked to `currentUser.full_name`** (no dropdown).
       * Engineer inputs technical notes and submits.
       * Calls `POST /api/tickets/:id/resolve` with `{ technician_id: currentUser.employee_id, resolution_notes }`.

---

### 🚀 Arnav's Git Sequence (When Phase 2 is Complete):
```bash
# 1. Ensure you are on arnav branch
git checkout arnav

# 2. Stage all deliverables
git add sql/ server/routes/tickets.js server/seed.js client/

# 3. Check status
git status

# 4. Commit and push
git commit -m "feat(arnav): implement issue descriptions, engineer investigation cards, and priority triage"
git push origin arnav

# 5. Open Pull Request on GitHub from 'arnav' into 'main' and merge it.
```

---

## 🎬 End-to-End Demo Walkthrough for Your Professor

Once both phases are complete, here is the exact script to demonstrate your system to your teacher:

1. **Open `http://localhost:3000/`:**
   * Browser immediately redirects to `/login`.
   * Point out the corporate branding and explain: *"Instead of an ad-hoc in-page switcher, we implemented a centralized Single Sign-On gateway."*
2. **Click `[Demo User: Aarav]` $\rightarrow$ Click Sign In:**
   * System validates role password `user` and routes to `/user`.
   * Click **"New Ticket"**:
     * Show that the requester is locked to *Aarav Sharma*.
     * Point out that **Priority is hidden** because the user shouldn't arbitrarily set criticality.
     * Enter Category: `NETWORK` and Description: *"Wi-Fi drops every 5 minutes in Innovation Block floor 3"*.
     * Submit ticket (created with default `MEDIUM` priority).
3. **Log Out $\rightarrow$ Click `[Demo Engineer: Vikram]` $\rightarrow$ Click Sign In:**
   * System validates role password `engineer` and routes to `/engineer`.
   * Find Aarav's new ticket.
   * **Demonstrate Criticality Evaluation:** Select the priority dropdown and escalate it to `HIGH` based on technical assessment.
   * **Demonstrate Investigation:** Click **"Investigate"**. The ticket moves to `IN_PROGRESS` and assigns *Vikram Malhotra*.
4. **Log Out $\rightarrow$ Log back in as `Aarav` (`/user`):**
   * Show Aarav's ticket: It now displays the **Assigned Engineer Card**:
     * *Lead Engineer: Vikram Malhotra*
     * *Email: vikram.malhotra@company.com*
     * *Office: Tech Park A*
5. **Log back in as `Vikram` (`/engineer`):**
   * Click **"Resolve"**:
     * Show that the technician is locked to *Vikram Malhotra*.
     * Enter diagnosis: *"Re-routed access point AP-04 to backup channel 36"*.
     * Submit resolution.
6. **Log in as `Admin` (`/admin`):**
   * Show administrative staff directory, employee registration, ticket deletion with confirmation modal, and live SQL metrics.

---
*End of Task Document.*
