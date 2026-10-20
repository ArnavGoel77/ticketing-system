-- Format timestamps and uppercase categories using TO_CHAR and UPPER
SELECT 
    ticket_id,
    UPPER(issue_category) AS standardized_category,
    priority_level,
    TO_CHAR(created_at, 'DD-Mon-YYYY HH24:MI:SS') AS formatted_submission_time,
    TO_CHAR(created_at, 'Day') AS day_of_week
FROM TICKETS
ORDER BY created_at DESC;

-- Handle NULL resolution notes on unresolved tickets using NVL and LEFT JOIN
SELECT 
    t.ticket_id,
    t.issue_category,
    t.status,
    t.priority_level,
    NVL(r.resolution_notes, 'Pending Assignment / Active Triage') AS ticket_resolution_status,
    NVL(TO_CHAR(r.resolved_at, 'DD-Mon-YYYY HH24:MI'), 'Unresolved') AS formatted_resolved_date
FROM TICKETS t
LEFT OUTER JOIN TICKET_RESOLUTIONS r ON t.ticket_id = r.ticket_id
ORDER BY t.ticket_id;

-- Calculate turnaround time in hours using ROUND and date subtraction
SELECT 
    r.resolution_id,
    r.ticket_id,
    t.issue_category,
    ROUND((CAST(r.resolved_at AS DATE) - CAST(t.created_at AS DATE)) * 24, 2) AS turnaround_hours
FROM TICKET_RESOLUTIONS r
JOIN TICKETS t ON r.ticket_id = t.ticket_id
ORDER BY turnaround_hours DESC;

-- Count pending tickets grouped by priority level with HAVING count >= 2
SELECT 
    priority_level,
    COUNT(*) AS total_tickets_in_queue
FROM TICKETS
WHERE status IN ('OPEN', 'IN_PROGRESS')
GROUP BY priority_level
HAVING COUNT(*) >= 2
ORDER BY total_tickets_in_queue DESC;

-- Compute ticket distribution and percentages by operational status
SELECT 
    status,
    COUNT(*) AS count_by_status,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM TICKETS), 1) AS percentage_of_total
FROM TICKETS
GROUP BY status
ORDER BY count_by_status DESC;

-- Group incident volume by issue category
SELECT 
    issue_category,
    COUNT(*) AS incident_frequency
FROM TICKETS
GROUP BY issue_category
ORDER BY incident_frequency DESC;

-- Calculate overall average, minimum, and maximum resolution turnaround hours
SELECT 
    COUNT(*) AS resolved_incident_count,
    ROUND(AVG((CAST(r.resolved_at AS DATE) - CAST(t.created_at AS DATE)) * 24), 2) AS overall_avg_resolution_hours,
    ROUND(MIN((CAST(r.resolved_at AS DATE) - CAST(t.created_at AS DATE)) * 24), 2) AS fastest_resolution_hours,
    ROUND(MAX((CAST(r.resolved_at AS DATE) - CAST(t.created_at AS DATE)) * 24), 2) AS longest_resolution_hours
FROM TICKET_RESOLUTIONS r
JOIN TICKETS t ON r.ticket_id = t.ticket_id;
