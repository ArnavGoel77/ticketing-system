-- ============================================================================
-- DBMS Lab Project: IT Service Desk Ticketing System
-- Review 1: 01_schema.sql (DDL Schema)
-- ============================================================================
-- Dependency Order: DEPARTMENTS -> EMPLOYEES -> TICKETS -> TICKET_RESOLUTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SHOBIT'S MODULE: Identity & Organization
-- ----------------------------------------------------------------------------
-- TODO (Shobit): CREATE TABLE DEPARTMENTS
-- Attributes: department_id (PK), department_name (NOT NULL), location_building


-- TODO (Shobit): CREATE TABLE EMPLOYEES
-- Attributes: employee_id (PK), department_id (FK), full_name, email (UNIQUE), role (CHECK)



-- ----------------------------------------------------------------------------
-- ARNAV'S MODULE: Ticket Management
-- ----------------------------------------------------------------------------
-- TODO (Arnav): CREATE TABLE TICKETS
-- Attributes: ticket_id (PK), user_id (FK), issue_category, priority_level (CHECK), status (DEFAULT 'OPEN'), created_at


-- TODO (Arnav): CREATE TABLE TICKET_RESOLUTIONS
-- Attributes: resolution_id (PK), ticket_id (FK, UNIQUE), technician_id (FK), resolution_notes (NOT NULL), resolved_at

