-- ============================================================================
-- DBMS Lab Project: IT Service Desk Incident & Ticketing System
-- Review 1: shobit_02_seed_data.sql (SHOBIT'S MODULE: Mock Data, Updates & Deletes)
-- Database Engine: Oracle Autonomous Database 26ai / 19c
-- ============================================================================
-- PREREQUISITE:
--   Must be executed after sql/shobit_01_schema.sql and BEFORE sql/02_seed_data.sql.
--   Mock ID allocations strictly adhere to the contract in .agents/AGENTS.md:
--     - DEPARTMENTS: 1 to 5
--     - EMPLOYEES (Users): 101 to 106
--     - EMPLOYEES (Technicians): 201 to 203
--     - EMPLOYEES (Admins): 301 to 302
-- ============================================================================

-- ============================================================================
-- 1. DEPARTMENTS INSERT (5 Core Operational Divisions)
-- ============================================================================
INSERT INTO DEPARTMENTS (department_id, department_name, location_building) 
VALUES (1, 'IT Support', 'Tech Park A');

INSERT INTO DEPARTMENTS (department_id, department_name, location_building) 
VALUES (2, 'Engineering', 'Innovation Block');

INSERT INTO DEPARTMENTS (department_id, department_name, location_building) 
VALUES (3, 'Human Resources', 'Admin Wing');

INSERT INTO DEPARTMENTS (department_id, department_name, location_building) 
VALUES (4, 'Finance', 'Admin Wing');

INSERT INTO DEPARTMENTS (department_id, department_name, location_building) 
VALUES (5, 'Operations', 'Tech Park B');


-- ============================================================================
-- 2. EMPLOYEES INSERT (11 Personnel across Users, Technicians & Admins)
-- ============================================================================

-- 2.1 Standard Users (Submitters: IDs 101 - 106)
INSERT INTO EMPLOYEES (employee_id, department_id, full_name, email, role) 
VALUES (101, 2, 'Alice Smith', 'alice.smith@company.com', 'USER');

INSERT INTO EMPLOYEES (employee_id, department_id, full_name, email, role) 
VALUES (102, 2, 'Bob Jones', 'bob.jones@company.com', 'USER');

INSERT INTO EMPLOYEES (employee_id, department_id, full_name, email, role) 
VALUES (103, 3, 'Charlie Brown', 'charlie.brown@company.com', 'USER');

INSERT INTO EMPLOYEES (employee_id, department_id, full_name, email, role) 
VALUES (104, 4, 'Diana Prince', 'diana.prince@company.com', 'USER');

INSERT INTO EMPLOYEES (employee_id, department_id, full_name, email, role) 
VALUES (105, 5, 'Evan Wright', 'evan.wright@company.com', 'USER');

INSERT INTO EMPLOYEES (employee_id, department_id, full_name, email, role) 
VALUES (106, 5, 'Fiona Gallagher', 'fiona.gallagher@company.com', 'USER');

-- 2.2 IT Support Technicians (Resolvers: IDs 201 - 203)
INSERT INTO EMPLOYEES (employee_id, department_id, full_name, email, role) 
VALUES (201, 1, 'Kevin Mitnick', 'kevin.mitnick@company.com', 'TECHNICIAN');

INSERT INTO EMPLOYEES (employee_id, department_id, full_name, email, role) 
VALUES (202, 1, 'Ada Lovelace', 'ada.lovelace@company.com', 'TECHNICIAN');

INSERT INTO EMPLOYEES (employee_id, department_id, full_name, email, role) 
VALUES (203, 1, 'Linus Torvalds', 'linus.torvalds@company.com', 'TECHNICIAN');

-- 2.3 System Administrators (Managers: IDs 301 - 302)
INSERT INTO EMPLOYEES (employee_id, department_id, full_name, email, role) 
VALUES (301, 1, 'Grace Hopper', 'grace.hopper@company.com', 'ADMIN');

INSERT INTO EMPLOYEES (employee_id, department_id, full_name, email, role) 
VALUES (302, 2, 'Alan Turing', 'alan.turing@company.com', 'ADMIN');


-- ============================================================================
-- 3. STANDARD DML UPDATE OPERATIONS
-- ============================================================================

-- 3.1 Department Reassignment: Transfer Evan Wright (105) to IT Support (1)
UPDATE EMPLOYEES 
SET department_id = 1 
WHERE employee_id = 105;

-- 3.2 Facilities Update: Modernize building location for Operations
UPDATE DEPARTMENTS 
SET location_building = 'Tech Park B - Suite 300' 
WHERE department_id = 5;


-- ============================================================================
-- 4. STANDARD DML DELETE OPERATIONS (Safe Record Removal & FK Testing)
-- ============================================================================

-- 4.1 Temporary Employee Lifecycle (Insert & Direct Delete)
INSERT INTO EMPLOYEES (employee_id, department_id, full_name, email, role) 
VALUES (999, 1, 'Temporary Contractor', 'temp.contractor@company.com', 'USER');

DELETE FROM EMPLOYEES 
WHERE employee_id = 999;

-- 4.2 Demonstrating ON DELETE SET NULL Referential Action
-- Step A: Insert a temporary project department
INSERT INTO DEPARTMENTS (department_id, department_name, location_building) 
VALUES (99, 'Quality Assurance Temp', 'Annex C');

-- Step B: Assign temporary tester to the temporary department
INSERT INTO EMPLOYEES (employee_id, department_id, full_name, email, role) 
VALUES (998, 99, 'Tester Tim', 'tim.test@company.com', 'USER');

-- Step C: Delete the department (FK on EMPLOYEES sets department_id to NULL rather than rejecting or deleting employee)
DELETE FROM DEPARTMENTS 
WHERE department_id = 99;

-- Step D: Clean up the test employee record
DELETE FROM EMPLOYEES 
WHERE employee_id = 998;


-- ============================================================================
-- Final Transaction Commit
-- ============================================================================
COMMIT;

-- Verify seeded counts for Shobit's module:
-- SELECT 'DEPARTMENTS' AS entity, COUNT(*) AS total_rows FROM DEPARTMENTS
-- UNION ALL
-- SELECT 'EMPLOYEES', COUNT(*) FROM EMPLOYEES;
