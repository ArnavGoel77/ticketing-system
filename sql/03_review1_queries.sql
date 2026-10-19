-- ============================================================================
-- DBMS Lab Project: IT Service Desk Incident & Ticketing System
-- Review 1: 03_review1_queries.sql (ARNAV'S MODULE: Analytical SQL Queries)
-- Database Engine: Oracle Autonomous Database 26ai / 19c
-- ============================================================================
-- Academic Focus (Ticket Management Module):
--   1. Single-Row Functions: Date/Time (TO_CHAR), Character (UPPER), NULL Handling (NVL), Numeric (ROUND)
--   2. Group & Aggregate Functions: COUNT, AVG, MIN, MAX, GROUP BY, HAVING
-- ============================================================================

-- ============================================================================
-- PART 1: SINGLE-ROW FUNCTIONS (Arnav's Scope)
-- ============================================================================

-- Query 1.1: Date & Timestamp Formatting (TO_CHAR)
-- Purpose: Convert raw Oracle timestamps into human-readable corporate date/time formats
SELECT 
    ticket_id,
    UPPER(issue_category) AS standardized_category,
    priority_level,
    TO_CHAR(created_at, 'DD-Mon-YYYY HH24:MI:SS') AS formatted_submission_time,
    TO_CHAR(created_at, 'Day') AS day_of_week
FROM TICKETS
ORDER BY created_at DESC;


-- Query 1.2: NULL Value Handling via NVL() & Outer Join
-- Purpose: Join tickets with resolutions and replace NULL notes for unresolved tickets
SELECT 
    t.ticket_id,
    t.issue_category,
    t.status,
    t.priority_level,
    NVL(r.resolution_notes, 'Pending Assignment / Active Triage') AS ticket_resolution_status,
    NVL(TO_CHAR(r.resolved_at, 'DD-Mon-YYYY HH24:MI'), 'Unresolved') AS formatted_resolved_date
FROM TICKETS t
LEFT OUTER JOIN TICKET_RESOLUTIONS r ON t.ticket_id = r.ticket_id
ORDER BY t.ticket_id;


-- Query 1.3: Numeric / Math Single-Row Function (ROUND & Date Arithmetic)
-- Purpose: Compute resolution turnaround duration in hours rounded to 2 decimal places
SELECT 
    r.resolution_id,
    r.ticket_id,
    t.issue_category,
    ROUND((CAST(r.resolved_at AS DATE) - CAST(t.created_at AS DATE)) * 24, 2) AS turnaround_hours
FROM TICKET_RESOLUTIONS r
JOIN TICKETS t ON r.ticket_id = t.ticket_id
ORDER BY turnaround_hours DESC;


-- ============================================================================
-- PART 2: OPERATORS & GROUP (AGGREGATE) FUNCTIONS (Arnav's Scope)
-- ============================================================================

-- Query 2.1: Priority Queue Aggregation with HAVING Filter (Syllabus Core)
-- Purpose: Count active tickets grouped by priority level where open ticket volume is >= 2
SELECT 
    priority_level,
    COUNT(*) AS total_tickets_in_queue
FROM TICKETS
WHERE status IN ('OPEN', 'IN_PROGRESS')
GROUP BY priority_level
HAVING COUNT(*) >= 2
ORDER BY total_tickets_in_queue DESC;


-- Query 2.2: Ticket Distribution by Operational Status
-- Purpose: Provide high-level volume metrics for dashboard KPI summary cards
SELECT 
    status,
    COUNT(*) AS count_by_status,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM TICKETS), 1) AS percentage_of_total
FROM TICKETS
GROUP BY status
ORDER BY count_by_status DESC;


-- Query 2.3: Incident Breakdown by Category
-- Purpose: Identify the most frequent technical problem areas across campus
SELECT 
    issue_category,
    COUNT(*) AS incident_frequency
FROM TICKETS
GROUP BY issue_category
ORDER BY incident_frequency DESC;


-- Query 2.4: Average Resolution Turnaround Time (Aggregate AVG, MIN, MAX)
-- Purpose: Calculate overall average, fastest, and longest resolution times across completed incidents
SELECT 
    COUNT(*) AS resolved_incident_count,
    ROUND(AVG((CAST(r.resolved_at AS DATE) - CAST(t.created_at AS DATE)) * 24), 2) AS overall_avg_resolution_hours,
    ROUND(MIN((CAST(r.resolved_at AS DATE) - CAST(t.created_at AS DATE)) * 24), 2) AS fastest_resolution_hours,
    ROUND(MAX((CAST(r.resolved_at AS DATE) - CAST(t.created_at AS DATE)) * 24), 2) AS longest_resolution_hours
FROM TICKET_RESOLUTIONS r
JOIN TICKETS t ON r.ticket_id = t.ticket_id;
