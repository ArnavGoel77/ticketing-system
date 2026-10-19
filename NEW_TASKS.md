# 📋 Task Division: Profile Switching, RBAC & Employee Management

> Single source of truth for the upcoming iteration.  
> Tasks are strictly divided according to module ownership defined in [.agents/AGENTS.md](file:///c:/ticketing-system/.agents/AGENTS.md).

---

## 👥 Module Ownership Summary

| Person | Domain | Tables & APIs | Core Focus for this Iteration |
| :--- | :--- | :--- | :--- |
| **Shobit** | **Identity & Organization** | `DEPARTMENTS`, `EMPLOYEES`<br>`/api/departments`, `/api/employees` | Employee deletion API & UI, Department location auto-display |
| **Arnav** | **Ticket Management & Platform** | `TICKETS`, `TICKET_RESOLUTIONS`<br>`/api/tickets`, Main Dashboard | Role profiles (User / Engineer / Admin), Navbar cleanup, RBAC enforcement |

---

## 🛠️ Shobit's Task List (Identity & Organization Module)

### Task S1: Backend Employee Deletion Endpoint
* **File:** [`server/routes/employees.js`](file:///c:/ticketing-system/server/routes/employees.js)
* **Description:** Implement `DELETE /api/employees/:id` with Oracle FK constraint handling.
* **Requirements:**
  - [x] Execute `DELETE FROM EMPLOYEES WHERE employee_id = :id`.
  - [x] If employee is a regular user who created tickets: tickets are handled via `ON DELETE CASCADE`.
  - [x] If employee is a technician referenced in `TICKET_RESOLUTIONS`: catch `ORA-02292` and return a clean HTTP 409 response:
    ```json
    {
      "success": false,
      "message": "Cannot delete technician with existing ticket resolutions. Reassign or remove resolutions first."
    }
    ```
  - [x] Return HTTP 200 on successful deletion: `{ "success": true, "message": "Employee deleted successfully" }`.

### Task S2: Frontend Employee Delete Button
* **File:** [`client/src/App.jsx`](file:///c:/ticketing-system/client/src/App.jsx) (Organization View)
* **Description:** Add interactive deletion capability to the Personnel table.
* **Requirements:**
  - [x] Add an **Actions** column to the Personnel Table.
  - [x] Add a clean `Delete` button for each row.
  - [x] Trigger a confirmation dialog (`window.confirm("Are you sure you want to remove employee...?")`).
  - [x] Call `DELETE /api/employees/:id` and trigger `fetchData()` to refresh the live list.
  - [x] Only enable this action when the active role is **Admin** (handled via Arnav's RBAC state).

### Task S3: Department Building Location Display in Add Employee Modal
* **File:** [`client/src/App.jsx`](file:///c:/ticketing-system/client/src/App.jsx) (Register Employee Modal)
* **Description:** Show pre-defined building locations when assigning an employee to a department.
* **Requirements:**
  - [x] In the Department `<select>` dropdown, display both name and building location:
    - `#1 - IT Support (Tech Park A)`
    - `#2 - Engineering (Innovation Block)`
    - `#3 - Human Resources (Admin Wing)`
    - `#4 - Finance (Admin Wing)`
    - `#5 - Operations (Tech Park B)`
  - [x] Add a clean reactive info badge directly beneath the department dropdown:
    ```
    📍 Building Location: [Dynamic Building Name] (Pre-defined)
    ```
  - [x] Dynamically update the location badge whenever a different department is selected.

---

## 🎫 Arnav's Task List (Ticket Management & Core Platform Governance)

### Task A1: Clean Up Top Navigation Bar
* **File:** [`client/src/App.jsx`](file:///c:/ticketing-system/client/src/App.jsx) (Header)
* **Description:** Remove redundant status buttons from the global navbar.
* **Requirements:**
  - [ ] Remove `Needs Triage` and `Resolved` buttons from the top navigation bar.
  - [ ] Keep navbar clean with two primary view tabs:
    - **Incident Tickets**
    - **Organization & Staff** (conditional on role)
  *Note: Triage and Resolved filters remain fully accessible via the left sidebar and table filter dropdown.*

### Task A2: Google-Style Profile Switcher Component
* **File:** [`client/src/App.jsx`](file:///c:/ticketing-system/client/src/App.jsx) (Top Right Header)
* **Description:** Add an interactive multi-profile avatar and switch menu.
* **Requirements:**
  - [ ] Add an active profile state:
    ```javascript
    const PROFILES = {
      USER: { id: 101, name: 'Aarav Sharma', role: 'USER', dept: 'Engineering', email: 'aarav.sharma@company.com' },
      ENGINEER: { id: 201, name: 'Vikram Malhotra', role: 'TECHNICIAN', dept: 'IT Support', email: 'vikram.malhotra@company.com' },
      ADMIN: { id: 301, name: 'Suresh Menon', role: 'ADMIN', dept: 'System Admin', email: 'suresh.menon@company.com' }
    };
    ```
  - [ ] Display a circular profile avatar with the current user's initials in the top right.
  - [ ] Add a visual role indicator pill in the header:
    - `👤 User Mode` (Blue)
    - `🛠️ Engineer Mode` (Amber)
    - `🛡️ Admin Mode` (Purple)
  - [ ] Clicking the avatar toggles a clean dropdown card allowing 1-click switching between the 3 roles with zero password requirement (POC demo friendly).

### Task A3: Role-Based Access Control (RBAC) Enforcement
* **File:** [`client/src/App.jsx`](file:///c:/ticketing-system/client/src/App.jsx)
* **Description:** Dynamically restrict or expose capabilities based on active persona.
* **Requirements:**
  - [ ] **👤 User Mode (Aarav Sharma):**
    - Allowed to click `+ New Ticket` (locks Requester to Aarav Sharma #101).
    - Can view tickets in the registry.
    - **Hides** `Triage`, `Resolve`, and `Delete` ticket action buttons.
    - **Hides** the `Organization & Staff` navigation tab.
  - [ ] **🛠️ Engineer Mode (Vikram Malhotra):**
    - Highlights active triage and in-progress queues.
    - Allowed to click `Triage` (`OPEN` $\rightarrow$ `IN_PROGRESS`).
    - Allowed to click `Resolve` (auto-binds technician to Vikram Malhotra #201).
    - **Hides** ticket `Delete` button.
    - Organization tab is in **Read-Only** mode (cannot register or delete employees).
  - [ ] **🛡️ Admin Mode (Suresh Menon):**
    - Unrestricted superuser access.
    - Full ticket management (`Triage`, `Resolve`, `Delete`).
    - Full organization management (Register new employees, Delete employees via Shobit's actions).

---

## 🔒 Permission Matrix Reference

| Capability / Action | 👤 User (Submitter) | 🛠️ Engineer (Technician) | 🛡️ Admin (System Manager) | Owner |
| :--- | :---: | :---: | :---: | :--- |
| **View Ticket Registry** | ✅ Yes | ✅ Yes | ✅ Yes | Arnav |
| **Submit New Ticket** | ✅ Yes (Auto-assigned) | ❌ Disabled | ✅ Yes (Can pick any) | Arnav |
| **Triage Ticket** | ❌ Hidden | ✅ Yes | ✅ Yes | Arnav |
| **Resolve Ticket** | ❌ Hidden | ✅ Yes (Auto-assigned) | ✅ Yes | Arnav |
| **Delete Incident Ticket** | ❌ Hidden | ❌ Hidden | ✅ Yes | Arnav |
| **Access Organization Tab** | ❌ Hidden | 👁️ Read-Only | ✅ Full Access | Shobit |
| **Register New Employee** | ❌ Hidden | ❌ Hidden | ✅ Yes | Shobit |
| **Delete Employee** | ❌ Hidden | ❌ Hidden | ✅ Yes | Shobit |

---

## 🚀 Recommended Implementation Order
1. **Step 1 (Shobit):** Implement `DELETE /api/employees/:id` in `server/routes/employees.js`.
2. **Step 2 (Arnav):** Build the Google-style profile switcher and role state in `client/src/App.jsx`.
3. **Step 3 (Arnav):** Clean up the navbar and apply the role restriction logic to ticket actions.
4. **Step 4 (Shobit):** Add employee delete button and department building location display in `client/src/App.jsx`.
5. **Step 5 (Joint Test):** Test switching between User $\rightarrow$ Engineer $\rightarrow$ Admin to verify end-to-end functionality.
