const express = require('express');
const router = express.Router();
const { executeQuery } = require('../db');

/**
 * Standardized API response helper
 */
const sendResponse = (res, statusCode, success, data = null, message = '') => {
    return res.status(statusCode).json({ success, data, message });
};

// ============================================================================
// POST /api/auth/login (Corporate Persona Authentication)
// Body: { email, password }
// ============================================================================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return sendResponse(res, 400, false, null, 'Email and password are required.');
    }

    const sanitizedEmail = String(email).trim().toLowerCase();
    const inputPassword = String(password).trim();

    try {
        const sql = `
            SELECT 
                e.employee_id,
                e.department_id,
                e.full_name,
                e.email,
                e.role,
                NVL(d.department_name, 'Unassigned / Global') AS department_name,
                NVL(d.location_building, 'N/A') AS location_building,
                'EMP-' || LPAD(TO_CHAR(e.employee_id), 4, '0') AS formatted_badge_id
            FROM EMPLOYEES e
            LEFT OUTER JOIN DEPARTMENTS d ON e.department_id = d.department_id
            WHERE LOWER(e.email) = :email
        `;

        const result = await executeQuery(sql, { email: sanitizedEmail });

        if (!result.rows || result.rows.length === 0) {
            return sendResponse(res, 401, false, null, 'No corporate account found with that email address.');
        }

        const user = result.rows[0];
        const role = (user.ROLE || user.role || '').toUpperCase();

        // Role-based password validation (per final_task.md specification)
        let expectedPassword = '';
        if (role === 'USER') {
            expectedPassword = 'user';
        } else if (role === 'TECHNICIAN') {
            expectedPassword = 'engineer';
        } else if (role === 'ADMIN') {
            expectedPassword = 'admin';
        } else {
            return sendResponse(res, 403, false, null, `Unrecognized account role: ${role}`);
        }

        if (inputPassword !== expectedPassword) {
            return sendResponse(res, 401, false, null, `Invalid password for role ${role} (use '${expectedPassword}')`);
        }

        // Standardized employee response payload
        const employeeData = {
            employee_id: user.EMPLOYEE_ID || user.employee_id,
            department_id: user.DEPARTMENT_ID || user.department_id,
            full_name: user.FULL_NAME || user.full_name,
            email: user.EMAIL || user.email,
            role: role,
            department_name: user.DEPARTMENT_NAME || user.department_name,
            location_building: user.LOCATION_BUILDING || user.location_building,
            formatted_badge_id: user.FORMATTED_BADGE_ID || user.formatted_badge_id
        };

        return sendResponse(res, 200, true, employeeData, 'Authentication successful');
    } catch (err) {
        console.error('Error during authentication:', err);
        return sendResponse(res, 500, false, null, `Authentication server error: ${err.message}`);
    }
});

// ============================================================================
// GET /api/auth/me (Verify session employee against database)
// ============================================================================
router.get('/me', async (req, res) => {
    const email = req.query.email;
    if (!email) {
        return sendResponse(res, 400, false, null, 'Email query parameter required.');
    }

    try {
        const sql = `
            SELECT 
                e.employee_id,
                e.department_id,
                e.full_name,
                e.email,
                e.role,
                NVL(d.department_name, 'Unassigned / Global') AS department_name,
                NVL(d.location_building, 'N/A') AS location_building,
                'EMP-' || LPAD(TO_CHAR(e.employee_id), 4, '0') AS formatted_badge_id
            FROM EMPLOYEES e
            LEFT OUTER JOIN DEPARTMENTS d ON e.department_id = d.department_id
            WHERE LOWER(e.email) = :email
        `;

        const result = await executeQuery(sql, { email: String(email).trim().toLowerCase() });
        if (!result.rows || result.rows.length === 0) {
            return sendResponse(res, 404, false, null, 'Employee session not found.');
        }

        const user = result.rows[0];
        return sendResponse(res, 200, true, {
            employee_id: user.EMPLOYEE_ID || user.employee_id,
            department_id: user.DEPARTMENT_ID || user.department_id,
            full_name: user.FULL_NAME || user.full_name,
            email: user.EMAIL || user.email,
            role: (user.ROLE || user.role || '').toUpperCase(),
            department_name: user.DEPARTMENT_NAME || user.department_name,
            location_building: user.LOCATION_BUILDING || user.location_building,
            formatted_badge_id: user.FORMATTED_BADGE_ID || user.formatted_badge_id
        }, 'Current session validated');
    } catch (err) {
        return sendResponse(res, 500, false, null, err.message);
    }
});

module.exports = router;
