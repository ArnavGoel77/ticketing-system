-- ============================================================================
-- REVIEW 2: VIEWS, CONCURRENCY & VERIFICATION (ARNAV GOEL - TICKET MANAGEMENT)
-- Database: Oracle Autonomous Database 26ai / 19c (ticketdb)
-- Deliverables: Lifecycle Summary View, SLA Materialized Query, Concurrency Locking
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DATABASE VIEW: V_INCIDENT_LIFECYCLE_SUMMARY
-- Denormalized reporting view joining Ticket, Requester, Resolver, and Turnaround.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW V_INCIDENT_LIFECYCLE_SUMMARY AS
SELECT 
    t.ticket_id,
    t.issue_category,
    t.issue_description,
    t.priority_level,
    t.status,
    TO_CHAR(t.created_at, 'DD-Mon-YYYY HH24:MI:SS') AS date_submitted,
    -- Requester Details
    req.employee_id      AS requester_id,
    req.full_name        AS requester_name,
    req.email            AS requester_email,
    req_dept.department_name AS requester_department,
    -- Assigned Engineer Details
    t.assigned_to        AS assigned_engineer_id,
    eng.full_name        AS assigned_engineer_name,
    eng_dept.location_building AS assigned_engineer_location,
    -- Resolution & SLA Metrics
    r.resolution_id,
    r.resolution_notes,
    TO_CHAR(r.resolved_at, 'DD-Mon-YYYY HH24:MI:SS') AS date_resolved,
    tech.full_name       AS resolving_technician_name,
    FN_CALCULATE_RESOLUTION_TIME(t.ticket_id) AS turnaround_hours
FROM TICKETS t
JOIN EMPLOYEES req ON t.user_id = req.employee_id
LEFT JOIN DEPARTMENTS req_dept ON req.department_id = req_dept.department_id
LEFT JOIN EMPLOYEES eng ON t.assigned_to = eng.employee_id
LEFT JOIN DEPARTMENTS eng_dept ON eng.department_id = eng_dept.department_id
LEFT JOIN TICKET_RESOLUTIONS r ON t.ticket_id = r.ticket_id
LEFT JOIN EMPLOYEES tech ON r.technician_id = tech.employee_id;

-- ----------------------------------------------------------------------------
-- 2. SLA PERFORMANCE AGGREGATE VIEW: V_TICKET_SLA_METRICS
-- Pre-aggregated view calculating average turnaround by Category & Priority.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW V_TICKET_SLA_METRICS AS
SELECT 
    t.issue_category,
    t.priority_level,
    COUNT(*) AS total_tickets,
    SUM(CASE WHEN t.status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolved_count,
    SUM(CASE WHEN t.status IN ('OPEN', 'IN_PROGRESS') THEN 1 ELSE 0 END) AS active_backlog_count,
    ROUND(AVG(FN_CALCULATE_RESOLUTION_TIME(t.ticket_id)), 2) AS avg_turnaround_hours
FROM TICKETS t
GROUP BY t.issue_category, t.priority_level;

-- ----------------------------------------------------------------------------
-- 3. CONCURRENCY CONTROL & ROW LOCKING DEMONSTRATION
-- Uses SELECT ... FOR UPDATE NOWAIT to prevent race conditions when two
-- technicians attempt to investigate the same ticket simultaneously.
-- ----------------------------------------------------------------------------
-- Test Block A: Acquire Lock (Technician 1)
-- SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
-- SELECT ticket_id, status, assigned_to 
-- FROM TICKETS 
-- WHERE ticket_id = 1005 
-- FOR UPDATE NOWAIT;

-- Test Block B: Concurrent Attempt (Technician 2 in another session)
-- SELECT ticket_id, status, assigned_to 
-- FROM TICKETS 
-- WHERE ticket_id = 1005 
-- FOR UPDATE NOWAIT;
-- Returns: ORA-00054: resource busy and acquire with NOWAIT specified

-- ----------------------------------------------------------------------------
-- 4. VERIFICATION CALLS FOR VIVA DEMO
-- ----------------------------------------------------------------------------
-- Test 1: Verify Audit Trail Trigger by changing priority:
-- UPDATE TICKETS SET priority_level = 'CRITICAL' WHERE ticket_id = 1008;
-- SELECT * FROM TICKET_AUDIT_LOGS ORDER BY changed_at DESC;

-- Test 2: Test Stored Function for Ticket 1001:
-- SELECT ticket_id, FN_CALCULATE_RESOLUTION_TIME(ticket_id) AS hours_taken FROM TICKETS WHERE status = 'RESOLVED';

-- Test 3: Test Lifecycle Summary View:
-- SELECT ticket_id, requester_name, assigned_engineer_name, status, turnaround_hours FROM V_INCIDENT_LIFECYCLE_SUMMARY ORDER BY ticket_id DESC;
