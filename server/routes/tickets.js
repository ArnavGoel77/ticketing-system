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
// 1. GET /api/tickets/metrics (Aggregated KPI Analytics for Dashboard)
// Note: Placed BEFORE /:id to prevent route shadowing
// ============================================================================
router.get('/metrics', async (req, res) => {
    try {
        // Query A: Status & Total counts
        const statusSql = `
            SELECT 
                status,
                COUNT(*) AS count_by_status
            FROM TICKETS
            GROUP BY status
        `;
        const statusResult = await executeQuery(statusSql);

        // Query B: Priority queue with HAVING >= 2 (Review 1 Rubric Query)
        const prioritySql = `
            SELECT 
                priority_level,
                COUNT(*) AS total_tickets_in_queue
            FROM TICKETS
            WHERE status IN ('OPEN', 'IN_PROGRESS')
            GROUP BY priority_level
            ORDER BY total_tickets_in_queue DESC
        `;
        const priorityResult = await executeQuery(prioritySql);

        // Query C: Incident category breakdown
        const categorySql = `
            SELECT 
                issue_category,
                COUNT(*) AS incident_frequency
            FROM TICKETS
            GROUP BY issue_category
            ORDER BY incident_frequency DESC
        `;
        const categoryResult = await executeQuery(categorySql);

        // Query D: Turnaround time (AVG hours across completed resolutions)
        const turnaroundSql = `
            SELECT 
                COUNT(*) AS resolved_incident_count,
                ROUND(AVG((CAST(r.resolved_at AS DATE) - CAST(t.created_at AS DATE)) * 24), 2) AS overall_avg_resolution_hours
            FROM TICKET_RESOLUTIONS r
            JOIN TICKETS t ON r.ticket_id = t.ticket_id
        `;
        let turnaroundResult = { rows: [] };
        try {
            turnaroundResult = await executeQuery(turnaroundSql);
        } catch (e) {
            // In case TICKET_RESOLUTIONS is empty or not yet seeded
            turnaroundResult = { rows: [{ RESOLVED_INCIDENT_COUNT: 0, OVERALL_AVG_RESOLUTION_HOURS: 0 }] };
        }

        // Compute high-level KPI badge values
        const statusRows = statusResult.rows || [];
        let totalTickets = 0;
        let openTickets = 0;
        let resolvedTickets = 0;

        statusRows.forEach(row => {
            const count = Number(row.COUNT_BY_STATUS || row.count_by_status || 0);
            const status = (row.STATUS || row.status || '').toUpperCase();
            totalTickets += count;
            if (status === 'OPEN' || status === 'IN_PROGRESS') {
                openTickets += count;
            } else if (status === 'RESOLVED' || status === 'CLOSED') {
                resolvedTickets += count;
            }
        });

        // Critical open count
        const criticalCount = (priorityResult.rows || [])
            .filter(r => (r.PRIORITY_LEVEL || r.priority_level || '').toUpperCase() === 'CRITICAL')
            .reduce((acc, curr) => acc + Number(curr.TOTAL_TICKETS_IN_QUEUE || curr.total_tickets_in_queue || 0), 0);

        const metrics = {
            totalTickets,
            openTickets,
            criticalTickets: criticalCount,
            resolvedTickets,
            avgTurnaroundHours: turnaroundResult.rows[0]?.OVERALL_AVG_RESOLUTION_HOURS || 0,
            byPriority: priorityResult.rows || [],
            byStatus: statusRows,
            byCategory: categoryResult.rows || []
        };

        return sendResponse(res, 200, true, metrics, 'Analytical metrics calculated successfully');
    } catch (err) {
        console.error('Error fetching ticket metrics:', err);
        return sendResponse(res, 500, false, null, `Database error: ${err.message}`);
    }
});


// ============================================================================
// 2. GET /api/tickets (Fetch All Tickets with Reporter, Assignee & Resolution Data)
// ============================================================================
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT 
                t.ticket_id,
                t.user_id,
                NVL(e.full_name, 'User #' || t.user_id) AS reporter_name,
                NVL(e.email, 'N/A') AS reporter_email,
                t.issue_category,
                t.issue_description,
                t.priority_level,
                t.status,
                TO_CHAR(CAST(t.created_at AS TIMESTAMP WITH TIME ZONE) AT TIME ZONE 'Asia/Kolkata', 'DD-Mon-YYYY HH12:MI:SS AM') || ' IST' AS formatted_created_at,
                TO_CHAR(t.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at_iso,
                t.assigned_to,
                assignee.full_name AS assigned_engineer_name,
                assignee.email AS assigned_engineer_email,
                assignee_dept.department_name AS assigned_engineer_dept,
                assignee_dept.location_building AS assigned_engineer_location,
                r.resolution_id,
                NVL(r.resolution_notes, 'Pending Assignment / Active Triage') AS resolution_notes,
                TO_CHAR(CAST(r.resolved_at AS TIMESTAMP WITH TIME ZONE) AT TIME ZONE 'Asia/Kolkata', 'DD-Mon-YYYY HH12:MI:SS AM') || ' IST' AS formatted_resolved_at,
                tech.full_name AS technician_name
            FROM TICKETS t
            LEFT OUTER JOIN EMPLOYEES e ON t.user_id = e.employee_id
            LEFT OUTER JOIN EMPLOYEES assignee ON t.assigned_to = assignee.employee_id
            LEFT OUTER JOIN DEPARTMENTS assignee_dept ON assignee.department_id = assignee_dept.department_id
            LEFT OUTER JOIN TICKET_RESOLUTIONS r ON t.ticket_id = r.ticket_id
            LEFT OUTER JOIN EMPLOYEES tech ON r.technician_id = tech.employee_id
            ORDER BY t.ticket_id DESC
        `;

        const result = await executeQuery(sql);
        return sendResponse(res, 200, true, result.rows || [], 'Tickets retrieved successfully');
    } catch (err) {
        console.error('Error fetching tickets:', err);
        return sendResponse(res, 500, false, null, `Database query failed: ${err.message}`);
    }
});


// ============================================================================
// 3. GET /api/tickets/:id (Fetch Single Ticket by ID)
// ============================================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `
            SELECT 
                t.ticket_id,
                t.user_id,
                NVL(e.full_name, 'User #' || t.user_id) AS reporter_name,
                NVL(e.email, 'N/A') AS reporter_email,
                t.issue_category,
                t.issue_description,
                t.priority_level,
                t.status,
                TO_CHAR(CAST(t.created_at AS TIMESTAMP WITH TIME ZONE) AT TIME ZONE 'Asia/Kolkata', 'DD-Mon-YYYY HH12:MI:SS AM') || ' IST' AS formatted_created_at,
                t.assigned_to,
                assignee.full_name AS assigned_engineer_name,
                assignee.email AS assigned_engineer_email,
                assignee_dept.department_name AS assigned_engineer_dept,
                assignee_dept.location_building AS assigned_engineer_location,
                r.resolution_id,
                r.resolution_notes,
                TO_CHAR(CAST(r.resolved_at AS TIMESTAMP WITH TIME ZONE) AT TIME ZONE 'Asia/Kolkata', 'DD-Mon-YYYY HH12:MI:SS AM') || ' IST' AS formatted_resolved_at,
                tech.full_name AS technician_name
            FROM TICKETS t
            LEFT OUTER JOIN EMPLOYEES e ON t.user_id = e.employee_id
            LEFT OUTER JOIN EMPLOYEES assignee ON t.assigned_to = assignee.employee_id
            LEFT OUTER JOIN DEPARTMENTS assignee_dept ON assignee.department_id = assignee_dept.department_id
            LEFT OUTER JOIN TICKET_RESOLUTIONS r ON t.ticket_id = r.ticket_id
            LEFT OUTER JOIN EMPLOYEES tech ON r.technician_id = tech.employee_id
            WHERE t.ticket_id = :id
        `;

        const result = await executeQuery(sql, { id: Number(id) });
        if (!result.rows || result.rows.length === 0) {
            return sendResponse(res, 404, false, null, `Ticket #${id} not found`);
        }

        return sendResponse(res, 200, true, result.rows[0], 'Ticket details retrieved');
    } catch (err) {
        console.error(`Error fetching ticket #${id}:`, err);
        return sendResponse(res, 500, false, null, `Database query failed: ${err.message}`);
    }
});


// ============================================================================
// 4. POST /api/tickets (Create a New Incident Ticket)
// ============================================================================
router.post('/', async (req, res) => {
    const { user_id, issue_category, issue_description, priority_level } = req.body;

    if (!user_id || !issue_category) {
        return sendResponse(res, 400, false, null, 'user_id and issue_category are required fields.');
    }

    const priority = (priority_level || 'MEDIUM').toUpperCase();
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validPriorities.includes(priority)) {
        return sendResponse(res, 400, false, null, `Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    const category = issue_category.toUpperCase();
    const validCategories = ['NETWORK', 'HARDWARE', 'SOFTWARE', 'ACCOUNT_ACCESS', 'EMAIL'];
    if (!validCategories.includes(category)) {
        return sendResponse(res, 400, false, null, `Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    const description = issue_description ? String(issue_description).trim() : 'General technical support request';

    try {
        const sql = `
            INSERT INTO TICKETS (user_id, issue_category, issue_description, priority_level, status)
            VALUES (:user_id, :issue_category, :issue_description, :priority_level, 'OPEN')
            RETURNING ticket_id, user_id, issue_category, issue_description, priority_level, status, TO_CHAR(created_at, 'DD-Mon-YYYY HH24:MI:SS')
            INTO :out_id, :out_user, :out_category, :out_desc, :out_priority, :out_status, :out_created
        `;

        const binds = {
            user_id: Number(user_id),
            issue_category: category,
            issue_description: description,
            priority_level: priority,
            out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
            out_user: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
            out_category: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 50 },
            out_desc: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 1000 },
            out_priority: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 20 },
            out_status: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 20 },
            out_created: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 50 }
        };

        const result = await executeQuery(sql, binds);
        const createdTicket = {
            ticket_id: result.outBinds.out_id[0],
            user_id: result.outBinds.out_user[0],
            issue_category: result.outBinds.out_category[0],
            issue_description: result.outBinds.out_desc[0],
            priority_level: result.outBinds.out_priority[0],
            status: result.outBinds.out_status[0],
            formatted_created_at: result.outBinds.out_created[0]
        };

        return sendResponse(res, 201, true, createdTicket, `Ticket #${createdTicket.ticket_id} created successfully`);
    } catch (err) {
        console.error('Error creating ticket:', err);
        return sendResponse(res, 500, false, null, `Insert failed: ${err.message}`);
    }
});


// ============================================================================
// 5. PUT /api/tickets/:id (Update Ticket Status, Priority, or Assigned Engineer)
// ============================================================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { status, priority_level, assigned_to, editor_employee_id, editor_role } = req.body;

    if (!status && !priority_level && assigned_to === undefined) {
        return sendResponse(res, 400, false, null, 'Provide status, priority_level, or assigned_to to update.');
    }

    try {
        // Step 0: Check current ticket status and assignee
        const checkSql = `SELECT status, assigned_to, priority_level FROM TICKETS WHERE ticket_id = :id`;
        const checkResult = await executeQuery(checkSql, { id: Number(id) });
        if (!checkResult.rows || checkResult.rows.length === 0) {
            return sendResponse(res, 404, false, null, `Ticket #${id} not found.`);
        }
        const currentTicket = checkResult.rows[0];
        const currentStatus = (currentTicket.STATUS || '').toUpperCase();
        const currentAssignedTo = currentTicket.ASSIGNED_TO;

        // Rule 1: Cannot change criticality if ticket is already RESOLVED or CLOSED
        if (priority_level && (currentStatus === 'RESOLVED' || currentStatus === 'CLOSED')) {
            return sendResponse(res, 400, false, null, `Criticality locked: Cannot modify the priority of a resolved or closed ticket.`);
        }

        // Rule 2: Cannot change criticality if ticket is in-progress and assigned to another engineer (unless ADMIN)
        if (priority_level && currentStatus === 'IN_PROGRESS' && currentAssignedTo) {
            if (editor_employee_id && Number(currentAssignedTo) !== Number(editor_employee_id) && editor_role !== 'ADMIN') {
                return sendResponse(res, 403, false, null, `Permission denied: Only the assigned lead engineer (or an administrator) can adjust the criticality of this ticket.`);
            }
        }

        const updates = [];
        const binds = { id: Number(id) };

        if (status) {
            const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
            const normalizedStatus = status.toUpperCase();
            if (!validStatuses.includes(normalizedStatus)) {
                return sendResponse(res, 400, false, null, `Invalid status. Must be: ${validStatuses.join(', ')}`);
            }
            updates.push(`status = :status`);
            binds.status = normalizedStatus;
        }

        if (priority_level) {
            const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
            const normalizedPriority = priority_level.toUpperCase();
            if (!validPriorities.includes(normalizedPriority)) {
                return sendResponse(res, 400, false, null, `Invalid priority. Must be: ${validPriorities.join(', ')}`);
            }
            updates.push(`priority_level = :priority_level`);
            binds.priority_level = normalizedPriority;
        }

        if (assigned_to !== undefined) {
            updates.push(`assigned_to = :assigned_to`);
            binds.assigned_to = assigned_to ? Number(assigned_to) : null;
        }

        const sql = `
            UPDATE TICKETS 
            SET ${updates.join(', ')}
            WHERE ticket_id = :id
        `;

        const result = await executeQuery(sql, binds);
        if (result.rowsAffected === 0) {
            return sendResponse(res, 404, false, null, `Ticket #${id} not found.`);
        }

        return sendResponse(res, 200, true, { ticket_id: Number(id), ...req.body }, `Ticket #${id} updated successfully`);
    } catch (err) {
        console.error(`Error updating ticket #${id}:`, err);
        return sendResponse(res, 500, false, null, `Update failed: ${err.message}`);
    }
});


// ============================================================================
// 6. DELETE /api/tickets/:id (Cancel / Delete Ticket)
// ============================================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `DELETE FROM TICKETS WHERE ticket_id = :id`;
        const result = await executeQuery(sql, { id: Number(id) });

        if (result.rowsAffected === 0) {
            return sendResponse(res, 404, false, null, `Ticket #${id} not found.`);
        }

        return sendResponse(res, 200, true, { ticket_id: Number(id) }, `Ticket #${id} successfully deleted.`);
    } catch (err) {
        console.error(`Error deleting ticket #${id}:`, err);
        return sendResponse(res, 500, false, null, `Delete failed: ${err.message}`);
    }
});


// ============================================================================
// 7. POST /api/tickets/:id/resolve (Resolve a Ticket)
// ============================================================================
router.post('/:id/resolve', async (req, res) => {
    const { id } = req.params;
    const { technician_id, resolution_notes } = req.body;

    if (!technician_id || !resolution_notes) {
        return sendResponse(res, 400, false, null, 'technician_id and resolution_notes are required.');
    }

    try {
        // Step 0: Check ticket existence, current assignment, and technician role
        const checkSql = `
            SELECT t.status, t.assigned_to, e.full_name AS assigned_engineer_name, tech.role AS technician_role
            FROM TICKETS t
            LEFT OUTER JOIN EMPLOYEES e ON t.assigned_to = e.employee_id
            LEFT OUTER JOIN EMPLOYEES tech ON tech.employee_id = :technician_id
            WHERE t.ticket_id = :id
        `;
        const checkResult = await executeQuery(checkSql, {
            id: Number(id),
            technician_id: Number(technician_id)
        });

        if (!checkResult.rows || checkResult.rows.length === 0) {
            return sendResponse(res, 404, false, null, `Ticket #${id} not found.`);
        }

        const ticket = checkResult.rows[0];
        const assignedTo = ticket.ASSIGNED_TO;
        const technicianRole = ticket.TECHNICIAN_ROLE;

        // If ticket is assigned to a different engineer, only an ADMIN can resolve it
        if (assignedTo && Number(assignedTo) !== Number(technician_id) && technicianRole !== 'ADMIN') {
            return sendResponse(
                res,
                403,
                false,
                null,
                `Cannot resolve ticket: Ticket #${id} is currently under investigation by ${ticket.ASSIGNED_ENGINEER_NAME || 'another engineer'}. Only the assigned investigating engineer (or an administrator) can resolve it.`
            );
        }

        // Step 1: Insert into TICKET_RESOLUTIONS
        const insertResolutionSql = `
            INSERT INTO TICKET_RESOLUTIONS (ticket_id, technician_id, resolution_notes)
            VALUES (:ticket_id, :technician_id, :resolution_notes)
        `;
        await executeQuery(insertResolutionSql, {
            ticket_id: Number(id),
            technician_id: Number(technician_id),
            resolution_notes: resolution_notes.trim()
        });

        // Step 2: Mark ticket as RESOLVED and ensure assigned_to is set
        const updateTicketSql = `
            UPDATE TICKETS 
            SET status = 'RESOLVED',
                assigned_to = NVL(assigned_to, :technician_id)
            WHERE ticket_id = :id
        `;
        await executeQuery(updateTicketSql, { id: Number(id), technician_id: Number(technician_id) });

        return sendResponse(res, 200, true, { ticket_id: Number(id), technician_id }, `Ticket #${id} resolved successfully.`);
    } catch (err) {
        console.error(`Error resolving ticket #${id}:`, err);
        return sendResponse(res, 500, false, null, `Resolution failed: ${err.message}`);
    }
});

module.exports = router;
