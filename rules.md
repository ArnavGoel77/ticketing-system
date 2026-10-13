# DBMS Lab Project Blueprint: IT Service Desk Ticketing System

## 1. Project Context & Objectives
This project is developed to fulfill the 30-mark DBMS lab requirements at Vellore Institute of Technology. The application is an IT Service Desk Ticketing System that tracks user support requests, technician assignments, and resolution statuses. 

The system utilizes an Entity-Relationship model to map complex operational structures into a relational schema[cite: 2]. The backend strictly utilizes Oracle SQL for data persistence and transaction processing[cite: 3]. A minimalist frontend will bridge user inputs to the database via a REST API.

### Technical Stack
*   **Database:** Oracle Autonomous Database (Always Free Tier) or Oracle AI Database 26ai (Local Docker).
*   **API Bridge:** Node.js with Express and the `node-oracledb` driver.
*   **Frontend:** React with Tailwind CSS (Minimal UI to satisfy presentation requirements).

---

## 2. Database Schema & Division of Labor
To ensure equal technical contribution, the relational database design[cite: 2] and full-stack integration are divided by entity features between Arnav and Shobit.

### A. Arnav's Module (Ticket Management)
*   **Entity 1: `TICKETS`**
    *   *Attributes:* `ticket_id` (PK), `user_id` (FK), `issue_category`, `priority_level`, `status`, `created_at`.
    *   *Constraints:* `CHECK` (priority_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')), `DEFAULT` 'OPEN' for status.
*   **Entity 2: `TICKET_RESOLUTIONS`**
    *   *Attributes:* `resolution_id` (PK), `ticket_id` (FK, UNIQUE), `technician_id` (FK), `resolution_notes`, `resolved_at`.
    *   *Constraints:* `NOT NULL` for resolution_notes.

### B. Shobit's Module (Identity & Organization)
*   **Entity 3: `EMPLOYEES`**
    *   *Attributes:* `employee_id` (PK), `department_id` (FK), `full_name`, `email`, `role`.
    *   *Constraints:* `UNIQUE` for email, `CHECK` (role IN ('USER', 'TECHNICIAN', 'ADMIN')).
*   **Entity 4: `DEPARTMENTS`**
    *   *Attributes:* `department_id` (PK), `department_name`, `location_building`.
    *   *Constraints:* `NOT NULL` for department_name.

---

## 3. Review 1: Execution Plan (Basic SQL & Setup)
Antigravity must execute the following deliverables to satisfy the initial 10-mark Review 1 rubric. Do not implement advanced PL/SQL (Review 2) yet.

### Step 1: DDL Implementation[cite: 2]
*   Write `01_schema.sql` to execute all `CREATE TABLE` commands.
*   Ensure tables are created in the correct dependency order (Departments $\rightarrow$ Employees $\rightarrow$ Tickets $\rightarrow$ Resolutions).
*   Include at least one `ALTER TABLE` command (e.g., adding an `updated_at` column) and one `DROP TABLE` demonstration in a separate scratch file.

### Step 2: DML Operations & Mock Data
*   Write `02_seed_data.sql` to `INSERT` 5-10 rows of realistic mock data into every table.
*   Write standard `UPDATE` statements (e.g., changing a ticket status to 'CLOSED').
*   Write standard `DELETE` statements (e.g., removing a canceled ticket).

### Step 3: Analytical SQL Queries
Write `03_review1_queries.sql` containing:
*   **Single-Row Functions:** Use functions like `UPPER(full_name)`, `TO_CHAR(created_at, 'DD-MON-YYYY')`, or `NVL(resolution_notes, 'Pending')`.
*   **Operators & Group Functions:** Use `COUNT`, `AVG`, `GROUP BY`, and `HAVING`. Example: Count the number of unresolved tickets grouped by `priority_level` where the count is greater than 2.

### Step 4: Application Bridge (Node.js + React)
*   Initialize an Express server connecting to Oracle via `node-oracledb`.
*   Expose `GET`, `POST`, `PUT`, and `DELETE` REST endpoints executing the raw SQL strings from Steps 2 and 3.
*   Build a single-page React dashboard containing:
    1.  A form to submit a new ticket (triggers `INSERT`).
    2.  A data grid displaying active tickets (triggers `SELECT`).
    3.  A summary metrics row displaying the results of the Group Functions.

---

## 4. Review 2: Forward-Looking Architecture (Advanced SQL)
*Do not implement these during Review 1, but keep the architecture ready for them.*
*   **Triggers:** Automate timestamp updates or audit logs when a ticket changes status.
*   **Procedures:** Implement PL/SQL blocks for complex ticket assignment logic.
*   **Concurrency Control:** Implement lock-based protocols to prevent two technicians from picking up the same ticket simultaneously[cite: 3].
*   **Joins & Views:** Create materialized views for the frontend dashboard to rapidly query joined data across all 4 tables without writing complex joins in the Node.js layer[cite: 2].