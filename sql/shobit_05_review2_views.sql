-- ============================================================================
-- REVIEW 2: VIEWS & ADVANCED SET OPERATIONS (SHOBIT - IDENTITY & ORGANIZATION)
-- Database: Oracle Autonomous Database 26ai / 19c (ticketdb)
-- Deliverables: Public Staff View (WITH READ ONLY), MINUS Query, INTERSECT Query
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SECURE PUBLIC DIRECTORY VIEW (WITH READ ONLY)
-- Hides internal employee IDs while exposing badge code, name, and building.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW V_PUBLIC_STAFF_DIRECTORY AS
SELECT 
    'EMP-' || LPAD(TO_CHAR(e.employee_id), 4, '0') AS corporate_badge_id,
    e.full_name,
    e.email,
    e.role,
    d.department_name,
    d.location_building
FROM EMPLOYEES e
JOIN DEPARTMENTS d ON e.department_id = d.department_id
WITH READ ONLY;

-- ----------------------------------------------------------------------------
-- 2. ADVANCED SET OPERATION 1: MINUS
-- Identifies departments that currently have ZERO support engineers assigned.
-- ----------------------------------------------------------------------------
SELECT department_id, department_name, location_building 
FROM DEPARTMENTS
MINUS
SELECT DISTINCT d.department_id, d.department_name, d.location_building
FROM DEPARTMENTS d
JOIN EMPLOYEES e ON d.department_id = e.department_id
WHERE e.role = 'TECHNICIAN';

-- ----------------------------------------------------------------------------
-- 3. ADVANCED SET OPERATION 2: INTERSECT
-- Identifies buildings that host BOTH Engineering/IT staff AND Administrative staff.
-- ----------------------------------------------------------------------------
SELECT location_building 
FROM DEPARTMENTS d
JOIN EMPLOYEES e ON d.department_id = e.department_id
WHERE e.role = 'TECHNICIAN'
INTERSECT
SELECT location_building 
FROM DEPARTMENTS d
JOIN EMPLOYEES e ON d.department_id = e.department_id
WHERE e.role = 'ADMIN';

-- ----------------------------------------------------------------------------
-- 4. VERIFICATION CALLS FOR VIVA DEMO
-- ----------------------------------------------------------------------------
-- Test 1: Verify employee audit trigger:
-- UPDATE EMPLOYEES SET role = 'ADMIN' WHERE employee_id = 101;
-- SELECT * FROM EMPLOYEE_AUDIT_LOGS ORDER BY modified_at DESC;

-- Test 2: Test Department Staff Ratio Report cursor:
-- SET SERVEROUTPUT ON;
-- EXEC SP_DEPT_STAFF_REPORT;

-- Test 3: Test Technician Workload Score function:
-- SELECT employee_id, full_name, FN_GET_TECH_WORKLOAD_SCORE(employee_id) AS workload_score 
-- FROM EMPLOYEES WHERE role = 'TECHNICIAN';
