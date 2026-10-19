-- ============================================================================
-- DBMS Lab Project: IT Service Desk Incident & Ticketing System
-- Review 1: shobit_03_queries.sql (SHOBIT'S MODULE: Analytical SQL Queries)
-- Database Engine: Oracle Autonomous Database 26ai / 19c
-- ============================================================================
-- Academic Focus (Identity & Organization Module):
--   1. Single-Row Character & String Functions: UPPER, LOWER, LENGTH, INITCAP, SUBSTR
--   2. Group & Aggregate Functions: COUNT, GROUP BY, HAVING, Percentage Computations
-- ============================================================================

-- ============================================================================
-- PART 1: SINGLE-ROW FUNCTIONS (Shobit's Scope)
-- ============================================================================

-- Query 1.1: Employee Data Standardization (UPPER, LOWER, LENGTH)
-- Purpose: Cleanse and format identity fields for directory listing, ensuring consistent casing
--          and auditing name character lengths for display truncation limits.
SELECT 
    employee_id,
    UPPER(full_name) AS uppercase_name,
    LOWER(email) AS sanitized_email,
    LENGTH(full_name) AS name_char_count,
    role
FROM EMPLOYEES
ORDER BY employee_id;


-- Query 1.2: Capitalization Formatting on Building Locations (INITCAP)
-- Purpose: Standardize facility location strings using INITCAP to guarantee proper noun casing
--          regardless of manual data-entry variations.
SELECT 
    department_id,
    department_name,
    location_building AS raw_location,
    INITCAP(location_building) AS standardized_location
FROM DEPARTMENTS
ORDER BY department_id;


-- Query 1.3: Corporate ID Badge & Title Generation (String Concatenation & SUBSTR)
-- Purpose: Construct formatted corporate badge strings combining role abbreviation and employee name.
SELECT 
    employee_id,
    full_name,
    role,
    'EMP-' || LPAD(TO_CHAR(employee_id), 4, '0') AS formatted_badge_id,
    SUBSTR(role, 1, 4) || ' : ' || full_name AS directory_label
FROM EMPLOYEES
ORDER BY role, employee_id;


-- ============================================================================
-- PART 2: OPERATORS & GROUP (AGGREGATE) FUNCTIONS (Shobit's Scope)
-- ============================================================================

-- Query 2.1: Department Headcount with HAVING Threshold Filter (Syllabus Core)
-- Purpose: Calculate total assigned personnel per department and filter for departments
--          with a headcount of at least 2 staff members.
SELECT 
    d.department_id,
    d.department_name,
    d.location_building,
    COUNT(e.employee_id) AS total_assigned_staff
FROM DEPARTMENTS d
JOIN EMPLOYEES e ON d.department_id = e.department_id
GROUP BY d.department_id, d.department_name, d.location_building
HAVING COUNT(e.employee_id) >= 2
ORDER BY total_assigned_staff DESC, d.department_name;


-- Query 2.2: Organizational Workforce Distribution by Role
-- Purpose: Aggregate total headcount and workforce percentage share across all three roles
--          (USER, TECHNICIAN, ADMIN) to evaluate technical support capacity.
SELECT 
    role,
    COUNT(*) AS total_staff_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM EMPLOYEES), 1) AS percentage_of_workforce
FROM EMPLOYEES
GROUP BY role
ORDER BY total_staff_count DESC;


-- Query 2.3: Comprehensive Departmental Staffing Matrix (Outer Join Aggregation)
-- Purpose: Quantify staff distribution across ALL departments, ensuring departments
--          with low or zero staffing are not excluded from organizational reporting.
SELECT 
    d.department_id,
    d.department_name,
    d.location_building,
    COUNT(e.employee_id) AS total_employees,
    COUNT(CASE WHEN e.role = 'TECHNICIAN' THEN 1 END) AS technician_count,
    COUNT(CASE WHEN e.role = 'USER' THEN 1 END) AS user_count,
    COUNT(CASE WHEN e.role = 'ADMIN' THEN 1 END) AS admin_count
FROM DEPARTMENTS d
LEFT OUTER JOIN EMPLOYEES e ON d.department_id = e.department_id
GROUP BY d.department_id, d.department_name, d.location_building
ORDER BY d.department_id;
