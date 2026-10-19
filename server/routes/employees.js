const express = require('express');
const router = express.Router();
const { executeQuery, oracledb } = require('../db');

/**
 * Standardized API response helper
 */
const sendResponse = (res, statusCode, success, data = null, message = '') => {
    return res.status(statusCode).json({ success, data, message });
};

// ============================================================================
// 1. GET /api/employees (List employees with optional ?role= filter & department join)
// ============================================================================
router.get('/', async (req, res) => {
    const { role, department_id } = req.query;

    try {
        const conditions = [];
        const binds = {};

        if (role) {
            const normalizedRole = role.toUpperCase();
            const validRoles = ['USER', 'TECHNICIAN', 'ADMIN'];
            if (!validRoles.includes(normalizedRole)) {
                return sendResponse(res, 400, false, null, `Invalid role filter. Allowed: ${validRoles.join(', ')}`);
            }
            conditions.push('e.role = :role');
            binds.role = normalizedRole;
        }

        if (department_id) {
            conditions.push('e.department_id = :department_id');
            binds.department_id = Number(department_id);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
            SELECT 
                e.employee_id,
                e.department_id,
                NVL(d.department_name, 'Unassigned / Global') AS department_name,
                NVL(d.location_building, 'N/A') AS location_building,
                INITCAP(NVL(d.location_building, 'N/A')) AS standardized_location,
                e.full_name,
                UPPER(e.full_name) AS uppercase_name,
                LOWER(e.email) AS email,
                LENGTH(e.full_name) AS name_length,
                e.role,
                'EMP-' || LPAD(TO_CHAR(e.employee_id), 4, '0') AS formatted_badge_id
            FROM EMPLOYEES e
            LEFT OUTER JOIN DEPARTMENTS d ON e.department_id = d.department_id
            ${whereClause}
            ORDER BY e.employee_id ASC
        `;

        const result = await executeQuery(sql, binds);
        return sendResponse(res, 200, true, result.rows || [], 'Employees retrieved successfully');
    } catch (err) {
        console.error('Error fetching employees:', err);
        return sendResponse(res, 500, false, null, `Database query failed: ${err.message}`);
    }
});

// ============================================================================
// 2. GET /api/employees/headcount (Department Headcount with HAVING >= 2)
// Placed before /:id to prevent shadowing
// ============================================================================
router.get('/headcount', async (req, res) => {
    try {
        const sql = `
            SELECT 
                d.department_id,
                d.department_name,
                d.location_building,
                COUNT(e.employee_id) AS total_assigned_staff
            FROM DEPARTMENTS d
            JOIN EMPLOYEES e ON d.department_id = e.department_id
            GROUP BY d.department_id, d.department_name, d.location_building
            HAVING COUNT(e.employee_id) >= 2
            ORDER BY total_assigned_staff DESC, d.department_name
        `;
        const result = await executeQuery(sql);
        return sendResponse(res, 200, true, result.rows || [], 'Department headcount analytics retrieved');
    } catch (err) {
        console.error('Error fetching headcount metrics:', err);
        return sendResponse(res, 500, false, null, `Database query failed: ${err.message}`);
    }
});

// ============================================================================
// 3. GET /api/employees/:id (Get single employee details)
// ============================================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `
            SELECT 
                e.employee_id,
                e.department_id,
                NVL(d.department_name, 'Unassigned') AS department_name,
                NVL(d.location_building, 'N/A') AS location_building,
                e.full_name,
                UPPER(e.full_name) AS uppercase_name,
                LOWER(e.email) AS email,
                e.role,
                'EMP-' || LPAD(TO_CHAR(e.employee_id), 4, '0') AS formatted_badge_id
            FROM EMPLOYEES e
            LEFT OUTER JOIN DEPARTMENTS d ON e.department_id = d.department_id
            WHERE e.employee_id = :id
        `;

        const result = await executeQuery(sql, { id: Number(id) });
        if (!result.rows || result.rows.length === 0) {
            return sendResponse(res, 404, false, null, `Employee #${id} not found.`);
        }

        return sendResponse(res, 200, true, result.rows[0], 'Employee details retrieved');
    } catch (err) {
        console.error(`Error fetching employee #${id}:`, err);
        return sendResponse(res, 500, false, null, `Database query failed: ${err.message}`);
    }
});

// ============================================================================
// 4. POST /api/employees (Register a New Employee)
// Body: { department_id, full_name, email, role }
// ============================================================================
router.post('/', async (req, res) => {
    const { department_id, full_name, email, role } = req.body;

    if (!full_name || !email || !role) {
        return sendResponse(res, 400, false, null, 'full_name, email, and role are required fields.');
    }

    const normalizedRole = role.toUpperCase();
    const validRoles = ['USER', 'TECHNICIAN', 'ADMIN'];
    if (!validRoles.includes(normalizedRole)) {
        return sendResponse(res, 400, false, null, `Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    const sanitizedEmail = email.trim().toLowerCase();

    try {
        const sql = `
            INSERT INTO EMPLOYEES (department_id, full_name, email, role)
            VALUES (:department_id, :full_name, :email, :role)
            RETURNING employee_id, department_id, full_name, email, role
            INTO :out_id, :out_dept, :out_name, :out_email, :out_role
        `;

        const binds = {
            department_id: department_id ? Number(department_id) : null,
            full_name: full_name.trim(),
            email: sanitizedEmail,
            role: normalizedRole,
            out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
            out_dept: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
            out_name: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 100 },
            out_email: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 150 },
            out_role: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 20 }
        };

        const result = await executeQuery(sql, binds);
        const createdEmployee = {
            employee_id: result.outBinds.out_id[0],
            department_id: result.outBinds.out_dept[0],
            full_name: result.outBinds.out_name[0],
            email: result.outBinds.out_email[0],
            role: result.outBinds.out_role[0],
            formatted_badge_id: `EMP-${String(result.outBinds.out_id[0]).padStart(4, '0')}`
        };

        return sendResponse(res, 201, true, createdEmployee, `Employee ${createdEmployee.full_name} registered successfully`);
    } catch (err) {
        console.error('Error registering employee:', err);
        if (err.message.includes('ORA-00001')) {
            return sendResponse(res, 409, false, null, `An employee with email "${sanitizedEmail}" already exists.`);
        }
        if (err.message.includes('ORA-02291')) {
            return sendResponse(res, 400, false, null, `Department ID ${department_id} does not exist.`);
        }
        return sendResponse(res, 500, false, null, `Registration failed: ${err.message}`);
    }
});

// ============================================================================
// 5. DELETE /api/employees/:id (Delete Employee with FK Constraint Handling)
// ============================================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const employeeId = Number(id);

    try {
        const sql = `DELETE FROM EMPLOYEES WHERE employee_id = :id`;
        const result = await executeQuery(sql, { id: employeeId });

        if (result.rowsAffected === 0) {
            return sendResponse(res, 404, false, null, `Employee #${id} not found.`);
        }

        return sendResponse(res, 200, true, { employee_id: employeeId }, 'Employee deleted successfully');
    } catch (err) {
        console.error(`Error deleting employee #${id}:`, err);

        // Check for ORA-02292: child record found (e.g. Technician referenced in TICKET_RESOLUTIONS)
        if (err.message.includes('ORA-02292')) {
            return sendResponse(
                res,
                409,
                false,
                null,
                'Cannot delete technician with existing ticket resolutions. Reassign or remove resolutions first.'
            );
        }

        return sendResponse(res, 500, false, null, `Deletion failed: ${err.message}`);
    }
});

module.exports = router;
