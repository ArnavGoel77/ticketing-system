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
// 1. GET /api/departments (List all departments with headcount & role metrics)
// ============================================================================
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT 
                d.department_id,
                d.department_name,
                d.location_building,
                INITCAP(d.location_building) AS standardized_location,
                COUNT(e.employee_id) AS total_staff,
                COUNT(CASE WHEN e.role = 'TECHNICIAN' THEN 1 END) AS technician_count,
                COUNT(CASE WHEN e.role = 'USER' THEN 1 END) AS user_count,
                COUNT(CASE WHEN e.role = 'ADMIN' THEN 1 END) AS admin_count
            FROM DEPARTMENTS d
            LEFT OUTER JOIN EMPLOYEES e ON d.department_id = e.department_id
            GROUP BY d.department_id, d.department_name, d.location_building
            ORDER BY d.department_id ASC
        `;

        const result = await executeQuery(sql);
        return sendResponse(res, 200, true, result.rows || [], 'Departments retrieved successfully');
    } catch (err) {
        console.error('Error fetching departments:', err);
        return sendResponse(res, 500, false, null, `Database query failed: ${err.message}`);
    }
});

// ============================================================================
// 2. GET /api/departments/:id (Get single department details with staff roster)
// ============================================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deptSql = `
            SELECT 
                department_id,
                department_name,
                location_building
            FROM DEPARTMENTS
            WHERE department_id = :id
        `;
        const deptResult = await executeQuery(deptSql, { id: Number(id) });

        if (!deptResult.rows || deptResult.rows.length === 0) {
            return sendResponse(res, 404, false, null, `Department #${id} not found.`);
        }

        const staffSql = `
            SELECT 
                employee_id,
                full_name,
                email,
                role
            FROM EMPLOYEES
            WHERE department_id = :id
            ORDER BY role, full_name
        `;
        const staffResult = await executeQuery(staffSql, { id: Number(id) });

        const data = {
            ...deptResult.rows[0],
            staff: staffResult.rows || []
        };

        return sendResponse(res, 200, true, data, `Department #${id} details retrieved`);
    } catch (err) {
        console.error(`Error fetching department #${id}:`, err);
        return sendResponse(res, 500, false, null, `Database query failed: ${err.message}`);
    }
});

module.exports = router;
