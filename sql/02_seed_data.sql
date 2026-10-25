-- ============================================================================
-- DBMS Lab Project: IT Service Desk Incident & Ticketing System
-- Review 1: 02_seed_data.sql (ARNAV'S MODULE: Incident & Resolution DML)
-- Database Engine: Oracle Autonomous Database 26ai / 19c
-- ============================================================================
-- PREREQUISITE:
--   Shobit must insert his mock records into DEPARTMENTS and EMPLOYEES first,
--   so that user_id (101-106) and technician_id (201-203) exist.
-- ============================================================================

-- ============================================================================
-- 1. ARNAV'S MODULE: Incident & Resolution Seed Data
-- ============================================================================

-- 1.1 Insert 8 Realistic Incident Tickets
INSERT INTO TICKETS (ticket_id, user_id, assigned_to, issue_category, issue_description, priority_level, status, created_at)
VALUES (1001, 101, 201, 'NETWORK', 'Core gateway switch port 24 failing under heavy traffic load. Intermittent packet drops affecting 3rd-floor workstations.', 'CRITICAL', 'RESOLVED', SYSTIMESTAMP - INTERVAL '5' DAY);

INSERT INTO TICKETS (ticket_id, user_id, assigned_to, issue_category, issue_description, priority_level, status, created_at)
VALUES (1002, 102, 202, 'HARDWARE', 'ThinkPad workstation experiencing severe thermal throttling and loud grinding noise from the cooling fan under moderate load.', 'HIGH', 'RESOLVED', SYSTIMESTAMP - INTERVAL '4' DAY);

INSERT INTO TICKETS (ticket_id, user_id, assigned_to, issue_category, issue_description, priority_level, status, created_at)
VALUES (1003, 103, 203, 'SOFTWARE', 'Outlook desktop search catalog corrupted; cannot index or synchronize emails from the departmental exchange mailbox.', 'MEDIUM', 'RESOLVED', SYSTIMESTAMP - INTERVAL '3' DAY);

INSERT INTO TICKETS (ticket_id, user_id, assigned_to, issue_category, issue_description, priority_level, status, created_at)
VALUES (1004, 104, 201, 'ACCOUNT_ACCESS', 'Active Directory profile locked out after consecutive VPN password attempts. Need emergency MFA credential reset.', 'CRITICAL', 'RESOLVED', SYSTIMESTAMP - INTERVAL '2' DAY);

INSERT INTO TICKETS (ticket_id, user_id, assigned_to, issue_category, issue_description, priority_level, status, created_at)
VALUES (1005, 105, 201, 'NETWORK', 'GlobalProtect SSL VPN disconnects abruptly every 15 minutes while working remotely over home broadband.', 'HIGH', 'IN_PROGRESS', SYSTIMESTAMP - INTERVAL '1' DAY);

INSERT INTO TICKETS (ticket_id, user_id, assigned_to, issue_category, issue_description, priority_level, status, created_at)
VALUES (1006, 106, NULL, 'EMAIL', 'Department shared inbox receiving automated bounce-backs from corporate anti-spam gateway filters.', 'MEDIUM', 'OPEN', SYSTIMESTAMP - INTERVAL '14' HOUR);

INSERT INTO TICKETS (ticket_id, user_id, assigned_to, issue_category, issue_description, priority_level, status, created_at)
VALUES (1007, 101, NULL, 'SOFTWARE', 'IDE enterprise license key activation rejected with error 403 on development testbed server.', 'CRITICAL', 'OPEN', SYSTIMESTAMP - INTERVAL '6' HOUR);

INSERT INTO TICKETS (ticket_id, user_id, assigned_to, issue_category, issue_description, priority_level, status, created_at)
VALUES (1008, 103, NULL, 'HARDWARE', 'Dual-monitor workstation displays black screen on second DisplayPort after graphic driver patch.', 'LOW', 'OPEN', SYSTIMESTAMP - INTERVAL '2' HOUR);


-- 1.2 Insert 4 Incident Resolutions (1-to-1 links with resolved tickets)
INSERT INTO TICKET_RESOLUTIONS (resolution_id, ticket_id, technician_id, resolution_notes, resolved_at)
VALUES (
    5001, 
    1001, 
    201, 
    'Flushed corporate DNS cache, renewed DHCP lease on switch port 24, and re-authenticated SSL VPN gateway adapter.',
    SYSTIMESTAMP - INTERVAL '4' DAY - INTERVAL '20' HOUR
);

INSERT INTO TICKET_RESOLUTIONS (resolution_id, ticket_id, technician_id, resolution_notes, resolved_at)
VALUES (
    5002, 
    1002, 
    202, 
    'Diagnosed thermal throttling and replaced faulty cooling fan on ThinkPad workstation. Ran stress test with normal temps.',
    SYSTIMESTAMP - INTERVAL '3' DAY - INTERVAL '16' HOUR
);

INSERT INTO TICKET_RESOLUTIONS (resolution_id, ticket_id, technician_id, resolution_notes, resolved_at)
VALUES (
    5003, 
    1003, 
    203, 
    'Re-indexed local Outlook search catalog and patched software build to version 24.2. Verified email sync functionality.',
    SYSTIMESTAMP - INTERVAL '2' DAY - INTERVAL '21' HOUR
);

INSERT INTO TICKET_RESOLUTIONS (resolution_id, ticket_id, technician_id, resolution_notes, resolved_at)
VALUES (
    5004, 
    1004, 
    201, 
    'Unlocked corporate Active Directory profile, refreshed OAuth security token, and forced user MFA enrollment reset.',
    SYSTIMESTAMP - INTERVAL '1' DAY - INTERVAL '22' HOUR
);


-- ============================================================================
-- 2. STANDARD DML UPDATE OPERATIONS (Demonstrating operational status triage)
-- ============================================================================

-- Move newly submitted email ticket #1006 into active investigation
UPDATE TICKETS 
SET status = 'IN_PROGRESS' 
WHERE ticket_id = 1006;

-- Escalate low-priority hardware ticket #1008 to HIGH due to executive request
UPDATE TICKETS 
SET priority_level = 'HIGH' 
WHERE ticket_id = 1008;


-- ============================================================================
-- 3. STANDARD DML DELETE OPERATIONS (Demonstrating safe record teardown)
-- ============================================================================

-- Create a temporary test ticket to demonstrate clean deletion
INSERT INTO TICKETS (ticket_id, user_id, issue_category, priority_level, status, created_at)
VALUES (1099, 106, 'EMAIL', 'LOW', 'OPEN', CURRENT_TIMESTAMP);

-- Delete the temporary test ticket
DELETE FROM TICKETS 
WHERE ticket_id = 1099 
  AND status = 'OPEN';


-- ============================================================================
-- Final Transaction Commit
-- ============================================================================
COMMIT;

-- Verify seeded counts for Arnav's module:
-- SELECT 'TICKETS' AS entity, COUNT(*) AS total FROM TICKETS
-- UNION ALL
-- SELECT 'TICKET_RESOLUTIONS', COUNT(*) FROM TICKET_RESOLUTIONS;
