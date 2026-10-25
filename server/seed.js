const { executeQuery, closePool } = require('./db');

async function seedDatabase() {
    console.log('--- Starting IT Service Desk Database Seed ---');

    try {
        // Step 1: Wipe existing records in reverse referential hierarchy
        console.log('Clearing existing records (resolutions -> tickets -> employees -> departments)...');
        await executeQuery(`DELETE FROM TICKET_RESOLUTIONS`);
        await executeQuery(`DELETE FROM TICKETS`);
        await executeQuery(`DELETE FROM EMPLOYEES`);
        await executeQuery(`DELETE FROM DEPARTMENTS`);
        console.log('Tables cleaned.');

        // Step 2: Seed Departments (1 - 5)
        console.log('Seeding departments...');
        const departments = [
            [1, 'IT Support', 'Tech Park A'],
            [2, 'Engineering', 'Innovation Block'],
            [3, 'Human Resources', 'Admin Wing'],
            [4, 'Finance', 'Admin Wing'],
            [5, 'Operations', 'Tech Park B - Suite 300']
        ];
        for (const [id, name, location] of departments) {
            await executeQuery(
                `INSERT INTO DEPARTMENTS (department_id, department_name, location_building) VALUES (:1, :2, :3)`,
                [id, name, location]
            );
        }

        // Step 3: Seed Employees (Users 101-106, Technicians 201-203, Admins 301-302)
        console.log('Seeding employees...');
        const employees = [
            [101, 2, 'Aarav Sharma', 'aarav.sharma@company.com', 'USER'],
            [102, 2, 'Priya Patel', 'priya.patel@company.com', 'USER'],
            [103, 3, 'Rohan Iyer', 'rohan.iyer@company.com', 'USER'],
            [104, 4, 'Ananya Verma', 'ananya.verma@company.com', 'USER'],
            [105, 1, 'Aditya Nair', 'aditya.nair@company.com', 'USER'],
            [106, 5, 'Sneha Kulkarni', 'sneha.kulkarni@company.com', 'USER'],
            [201, 1, 'Vikram Malhotra', 'vikram.malhotra@company.com', 'TECHNICIAN'],
            [202, 1, 'Neha Sengupta', 'neha.sengupta@company.com', 'TECHNICIAN'],
            [203, 1, 'Rahul Deshmukh', 'rahul.deshmukh@company.com', 'TECHNICIAN'],
            [301, 1, 'Suresh Menon', 'suresh.menon@company.com', 'ADMIN'],
            [302, 2, 'Deepika Rao', 'deepika.rao@company.com', 'ADMIN']
        ];
        for (const [id, deptId, name, email, role] of employees) {
            await executeQuery(
                `INSERT INTO EMPLOYEES (employee_id, department_id, full_name, email, role) VALUES (:1, :2, :3, :4, :5)`,
                [id, deptId, name, email, role]
            );
        }

        // Step 4: Seed Tickets (1001 - 1008)
        console.log('Seeding incident tickets...');
        await executeQuery(`
            INSERT INTO TICKETS (ticket_id, user_id, assigned_to, issue_category, issue_description, priority_level, status, created_at)
            VALUES (1001, 101, 201, 'NETWORK', 'Core gateway switch port 24 failing under heavy traffic load. Intermittent packet drops affecting 3rd-floor workstations.', 'CRITICAL', 'RESOLVED', SYSTIMESTAMP - INTERVAL '5' DAY)
        `);
        await executeQuery(`
            INSERT INTO TICKETS (ticket_id, user_id, assigned_to, issue_category, issue_description, priority_level, status, created_at)
            VALUES (1002, 102, 202, 'HARDWARE', 'ThinkPad workstation experiencing severe thermal throttling and loud grinding noise from the cooling fan under moderate load.', 'HIGH', 'RESOLVED', SYSTIMESTAMP - INTERVAL '4' DAY)
        `);
        await executeQuery(`
            INSERT INTO TICKETS (ticket_id, user_id, assigned_to, issue_category, issue_description, priority_level, status, created_at)
            VALUES (1003, 103, 203, 'SOFTWARE', 'Outlook desktop search catalog corrupted; cannot index or synchronize emails from the departmental exchange mailbox.', 'MEDIUM', 'RESOLVED', SYSTIMESTAMP - INTERVAL '3' DAY)
        `);
        await executeQuery(`
            INSERT INTO TICKETS (ticket_id, user_id, assigned_to, issue_category, issue_description, priority_level, status, created_at)
            VALUES (1004, 104, 201, 'ACCOUNT_ACCESS', 'Active Directory profile locked out after consecutive VPN password attempts. Need emergency MFA credential reset.', 'CRITICAL', 'RESOLVED', SYSTIMESTAMP - INTERVAL '2' DAY)
        `);
        await executeQuery(`
            INSERT INTO TICKETS (ticket_id, user_id, assigned_to, issue_category, issue_description, priority_level, status, created_at)
            VALUES (1005, 105, 201, 'NETWORK', 'GlobalProtect SSL VPN disconnects abruptly every 15 minutes while working remotely over home broadband.', 'HIGH', 'IN_PROGRESS', SYSTIMESTAMP - INTERVAL '1' DAY)
        `);
        await executeQuery(`
            INSERT INTO TICKETS (ticket_id, user_id, assigned_to, issue_category, issue_description, priority_level, status, created_at)
            VALUES (1006, 106, NULL, 'EMAIL', 'Department shared inbox receiving automated bounce-backs from corporate anti-spam gateway filters.', 'MEDIUM', 'OPEN', SYSTIMESTAMP - INTERVAL '14' HOUR)
        `);
        await executeQuery(`
            INSERT INTO TICKETS (ticket_id, user_id, assigned_to, issue_category, issue_description, priority_level, status, created_at)
            VALUES (1007, 101, NULL, 'SOFTWARE', 'IDE enterprise license key activation rejected with error 403 on development testbed server.', 'CRITICAL', 'OPEN', SYSTIMESTAMP - INTERVAL '6' HOUR)
        `);
        await executeQuery(`
            INSERT INTO TICKETS (ticket_id, user_id, assigned_to, issue_category, issue_description, priority_level, status, created_at)
            VALUES (1008, 103, NULL, 'HARDWARE', 'Dual-monitor workstation displays black screen on second DisplayPort after graphic driver patch.', 'LOW', 'OPEN', SYSTIMESTAMP - INTERVAL '2' HOUR)
        `);

        // Step 5: Seed Resolutions (5001 - 5004)
        console.log('Seeding incident resolutions...');
        await executeQuery(`
            INSERT INTO TICKET_RESOLUTIONS (resolution_id, ticket_id, technician_id, resolution_notes, resolved_at)
            VALUES (
                5001, 1001, 201, 
                'Flushed corporate DNS cache, renewed DHCP lease on switch port 24, and re-authenticated SSL VPN gateway adapter.',
                SYSTIMESTAMP - INTERVAL '4' DAY - INTERVAL '20' HOUR
            )
        `);
        await executeQuery(`
            INSERT INTO TICKET_RESOLUTIONS (resolution_id, ticket_id, technician_id, resolution_notes, resolved_at)
            VALUES (
                5002, 1002, 202, 
                'Diagnosed thermal throttling and replaced faulty cooling fan on ThinkPad workstation. Ran stress test with normal temps.',
                SYSTIMESTAMP - INTERVAL '3' DAY - INTERVAL '16' HOUR
            )
        `);
        await executeQuery(`
            INSERT INTO TICKET_RESOLUTIONS (resolution_id, ticket_id, technician_id, resolution_notes, resolved_at)
            VALUES (
                5003, 1003, 203, 
                'Re-indexed local Outlook search catalog and patched software build to version 24.2. Verified email sync functionality.',
                SYSTIMESTAMP - INTERVAL '2' DAY - INTERVAL '21' HOUR
            )
        `);
        await executeQuery(`
            INSERT INTO TICKET_RESOLUTIONS (resolution_id, ticket_id, technician_id, resolution_notes, resolved_at)
            VALUES (
                5004, 1004, 201, 
                'Unlocked corporate Active Directory profile, refreshed OAuth security token, and forced user MFA enrollment reset.',
                SYSTIMESTAMP - INTERVAL '1' DAY - INTERVAL '22' HOUR
            )
        `);

        console.log('Database seeded successfully!');
        console.log('Summary: 5 Departments, 11 Employees, 8 Tickets, 4 Resolutions populated.');
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await closePool();
    }
}

seedDatabase();
