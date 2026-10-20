-- Standardize employee directory casing and name lengths using UPPER, LOWER, and LENGTH
SELECT 
    employee_id,
    UPPER(full_name) AS uppercase_name,
    LOWER(email) AS sanitized_email,
    LENGTH(full_name) AS name_char_count,
    role
FROM EMPLOYEES
ORDER BY employee_id;

-- Standardize building names to title casing using INITCAP
SELECT 
    department_id,
    department_name,
    location_building AS raw_location,
    INITCAP(location_building) AS standardized_location
FROM DEPARTMENTS
ORDER BY department_id;

-- Generate formatted badge IDs and directory labels using LPAD and SUBSTR
SELECT 
    employee_id,
    full_name,
    role,
    'EMP-' || LPAD(TO_CHAR(employee_id), 4, '0') AS formatted_badge_id,
    SUBSTR(role, 1, 4) || ' : ' || full_name AS directory_label
FROM EMPLOYEES
ORDER BY role, employee_id;

-- Count department headcount with HAVING count >= 2
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

-- Calculate organizational workforce headcount and percentage by role
SELECT 
    role,
    COUNT(*) AS total_staff_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM EMPLOYEES), 1) AS percentage_of_workforce
FROM EMPLOYEES
GROUP BY role
ORDER BY total_staff_count DESC;

-- Aggregate department staffing matrix breakdown by technician, user, and admin counts
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
