import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml

def create_report(output_path):
    doc = docx.Document()

    # Page setup: 0.8 inch margins for clean 6-7 page layout
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Base typography (Pure black and white)
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Arial'
    normal_style.font.size = Pt(9.5)
    normal_style.font.color.rgb = RGBColor(0, 0, 0)
    normal_style.paragraph_format.line_spacing = 1.08
    normal_style.paragraph_format.space_after = Pt(2.5)
    normal_style.paragraph_format.space_before = Pt(0)

    def set_cell_border(cell, **kwargs):
        tcPr = cell._tc.get_or_add_tcPr()
        tcBorders = parse_xml(r'''
            <w:tcBorders xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                <w:top w:val="{top_val}" w:sz="{top_sz}" w:space="0" w:color="{top_color}"/>
                <w:left w:val="{left_val}" w:sz="{left_sz}" w:space="0" w:color="{left_color}"/>
                <w:bottom w:val="{bottom_val}" w:sz="{bottom_sz}" w:space="0" w:color="{bottom_color}"/>
                <w:right w:val="{right_val}" w:sz="{right_sz}" w:space="0" w:color="{right_color}"/>
            </w:tcBorders>
        '''.format(
            top_val=kwargs.get('top', {}).get('val', 'single'),
            top_sz=kwargs.get('top', {}).get('sz', '4'),
            top_color=kwargs.get('top', {}).get('color', '000000'),
            left_val=kwargs.get('left', {}).get('val', 'single'),
            left_sz=kwargs.get('left', {}).get('sz', '4'),
            left_color=kwargs.get('left', {}).get('color', '000000'),
            bottom_val=kwargs.get('bottom', {}).get('val', 'single'),
            bottom_sz=kwargs.get('bottom', {}).get('sz', '4'),
            bottom_color=kwargs.get('bottom', {}).get('color', '000000'),
            right_val=kwargs.get('right', {}).get('val', 'single'),
            right_sz=kwargs.get('right', {}).get('sz', '4'),
            right_color=kwargs.get('right', {}).get('color', '000000'),
        ))
        tcPr.append(tcBorders)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(0, 0, 0)
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(5)
        p.paragraph_format.space_after = Pt(1.5)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(10.5)
        run.font.color.rgb = RGBColor(0, 0, 0)
        return p

    def add_p(text):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(0, 0, 0)
        return p

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(1.5)
        run1 = p.add_run(bold_prefix)
        run1.bold = True
        run1.font.size = Pt(9.5)
        run1.font.color.rgb = RGBColor(0, 0, 0)
        run2 = p.add_run(text)
        run2.font.size = Pt(9.5)
        run2.font.color.rgb = RGBColor(0, 0, 0)
        return p

    def add_code_block(code_text):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        cell.width = Inches(6.9)
        border_args = {'val': 'single', 'sz': '4', 'color': '000000'}
        set_cell_border(cell, top=border_args, bottom=border_args, left=border_args, right=border_args)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.0
        run = p.add_run(code_text)
        run.font.name = 'Consolas'
        run.font.size = Pt(8)
        run.font.color.rgb = RGBColor(0, 0, 0)
        doc.add_paragraph().paragraph_format.space_after = Pt(1)

    def add_screenshot_placeholder(fig_num, title, description):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        cell.width = Inches(6.9)
        border_args = {'val': 'single', 'sz': '4', 'color': '000000'}
        set_cell_border(cell, top=border_args, bottom=border_args, left=border_args, right=border_args)

        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(f"[INSERT SCREENSHOT HERE: {title.upper()}]\n")
        run.bold = True
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(0, 0, 0)

        p2 = cell.add_paragraph()
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p2.paragraph_format.space_before = Pt(0)
        p2.paragraph_format.space_after = Pt(8)
        run2 = p2.add_run(f"Recommended Screenshot: {description}")
        run2.font.size = Pt(8)
        run2.font.italic = True
        run2.font.color.rgb = RGBColor(60, 60, 60)

        cap_p = doc.add_paragraph()
        cap_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cap_p.paragraph_format.space_before = Pt(2)
        cap_p.paragraph_format.space_after = Pt(4)
        cap_run = cap_p.add_run(f"Figure {fig_num}: {title}")
        cap_run.bold = True
        cap_run.font.size = Pt(8.5)
        cap_run.font.color.rgb = RGBColor(0, 0, 0)

    # =========================================================================
    # PAGE 1: COVER PAGE
    # =========================================================================
    for _ in range(4):
        doc.add_paragraph()

    t_p1 = doc.add_paragraph()
    t_p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    t_p1.paragraph_format.space_after = Pt(4)
    r1 = t_p1.add_run("Database Management Systems - BCSE302L")
    r1.bold = True
    r1.font.size = Pt(17)
    r1.font.color.rgb = RGBColor(0, 0, 0)

    t_p2 = doc.add_paragraph()
    t_p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    t_p2.paragraph_format.space_after = Pt(0)
    r2 = t_p2.add_run("Project Report")
    r2.bold = True
    r2.font.size = Pt(15)
    r2.font.color.rgb = RGBColor(0, 0, 0)

    for _ in range(7):
        doc.add_paragraph()

    t_mid = doc.add_paragraph()
    t_mid.alignment = WD_ALIGN_PARAGRAPH.CENTER
    t_mid.paragraph_format.space_after = Pt(0)
    r_mid = t_mid.add_run("Enterprise IT Incident Ticketing and Resolution System")
    r_mid.bold = True
    r_mid.font.size = Pt(14)
    r_mid.font.color.rgb = RGBColor(0, 0, 0)

    for _ in range(9):
        doc.add_paragraph()

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_p.paragraph_format.space_after = Pt(4)
    r_sub = sub_p.add_run("Submitted By:")
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = RGBColor(0, 0, 0)

    n1_p = doc.add_paragraph()
    n1_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    n1_p.paragraph_format.space_after = Pt(1)
    rn1 = n1_p.add_run("Arnav Goel")
    rn1.bold = True
    rn1.font.size = Pt(12.5)
    rn1.font.color.rgb = RGBColor(0, 0, 0)

    reg1_p = doc.add_paragraph()
    reg1_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    reg1_p.paragraph_format.space_after = Pt(8)
    rr1 = reg1_p.add_run("24BCT0189")
    rr1.bold = True
    rr1.font.size = Pt(11.5)
    rr1.font.color.rgb = RGBColor(0, 0, 0)

    n2_p = doc.add_paragraph()
    n2_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    n2_p.paragraph_format.space_after = Pt(1)
    rn2 = n2_p.add_run("Shobit Khanna")
    rn2.bold = True
    rn2.font.size = Pt(12.5)
    rn2.font.color.rgb = RGBColor(0, 0, 0)

    reg2_p = doc.add_paragraph()
    reg2_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    reg2_p.paragraph_format.space_after = Pt(0)
    rr2 = reg2_p.add_run("24BCT0187")
    rr2.bold = True
    rr2.font.size = Pt(11.5)
    rr2.font.color.rgb = RGBColor(0, 0, 0)

    doc.add_page_break()

    # =========================================================================
    # 1. INTRODUCTION & PROBLEM DEFINITION
    # =========================================================================
    add_h1("1. Introduction & Problem Definition")

    add_h2("1.1 Project Overview")
    add_p(
        "In offices and college campuses, people face computer, software, and internet problems daily. "
        "Without a central system, issues get reported through random emails or chats, leading to confusion and delays. "
        "Our project is an Enterprise IT Incident Ticketing and Resolution System built on Oracle Autonomous Database "
        "with a React and Node.js web interface. It allows users to raise support tickets, allows technicians to claim "
        "and resolve them, and lets administrators oversee all tickets, personnel, and audit logs."
    )

    add_h2("1.2 Problem Definition")
    add_bullet("Lost Tickets: ", "Support requests sent via chat or email get buried and forgotten without a central database.")
    add_bullet("Work Overlap: ", "Without clear ticket assignment, multiple technicians might work on the same problem simultaneously.")
    add_bullet("No Change History: ", "If someone alters a ticket's status or priority, there is no record of who did it or when.")
    add_bullet("Repeated Data: ", "Storing department names and office locations inside every ticket creates duplicates and errors.")
    add_bullet("Lost Technical Fixes: ", "Solutions are not preserved, meaning recurring problems have to be re-diagnosed every time.")

    add_h2("1.3 Project Objectives")
    add_bullet("Normalized Database: ", "Design 6 related tables in Oracle Cloud up to BCNF to eliminate duplicate data.")
    add_bullet("Automated Audit Logs: ", "Use Oracle row triggers (:OLD vs :NEW) to automatically record all ticket changes.")
    add_bullet("Assignment Ownership: ", "Ensure that when an engineer investigates a ticket, peer technicians cannot resolve or alter it.")
    add_bullet("IST Timestamps: ", "Standardize and display all dates and times in Indian Standard Time (IST).")

    # =========================================================================
    # 2. REQUIREMENTS & SYSTEM ANALYSIS
    # =========================================================================
    add_h1("2. Requirements & System Analysis")

    add_h2("2.1 Functional Requirements")
    add_bullet("User Roles: ", "Supports Requesters (USER - raise tickets), Technicians (TECHNICIAN - investigate and resolve), and Administrators (ADMIN - manage staff and audit).")
    add_bullet("Ticket Lifecycle: ", "Starts as OPEN. When claimed, it shifts to IN_PROGRESS. After entering diagnosis notes, it moves to RESOLVED.")
    add_bullet("Assignment Protection: ", "Only the assigned investigating engineer (or an admin) can resolve a ticket or change its priority.")
    add_bullet("Criticality Lockout: ", "Once a ticket is resolved, its priority level is locked permanently.")
    add_bullet("Automated Audit Trail: ", "Trigger intercepts all updates and deletes, recording user identity and old/new values.")

    add_h2("2.2 Non-Functional Requirements & Modules")
    add_bullet("Integrity & Reliability: ", "Uses foreign keys with ON DELETE CASCADE and atomic procedures with SAVEPOINT rollbacks.")
    add_bullet("Arnav Goel (24BCT0189): ", "TICKETS, TICKET_RESOLUTIONS, TICKET_AUDIT_LOGS, audit triggers, resolution procedure, SLA function, engineer workbench, and user portal.")
    add_bullet("Shobit Khanna (24BCT0187): ", "DEPARTMENTS, EMPLOYEES, EMPLOYEE_AUDIT_LOGS, staff transfer procedure, headcount queries, login authentication, and admin console.")

    # =========================================================================
    # 3. ER / EER & RELATIONAL DESIGN
    # =========================================================================
    add_h1("3. ER / EER & Relational Design")

    add_h2("3.1 Data Dictionary")
    table_dict = doc.add_table(rows=7, cols=4)
    table_dict.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Table Name", "Primary Key", "Foreign Keys", "Purpose & Attributes"]
    for i, h in enumerate(headers):
        cell = table_dict.cell(0, i)
        set_cell_border(cell, top={'val': 'single', 'sz': '6', 'color': '000000'},
                              bottom={'val': 'single', 'sz': '6', 'color': '000000'},
                              left={'val': 'single', 'sz': '4', 'color': '000000'},
                              right={'val': 'single', 'sz': '4', 'color': '000000'})
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.bold = True
        run.font.size = Pt(8.0)

    entities_data = [
        ("DEPARTMENTS", "department_id", "None", "department_name (UK), location_building. Tracks divisions."),
        ("EMPLOYEES", "employee_id", "department_id", "full_name, email (UK), role (USER/TECHNICIAN/ADMIN)."),
        ("TICKETS", "ticket_id", "user_id, assigned_to", "issue_category, issue_description, priority_level, status, created_at."),
        ("TICKET_RESOLUTIONS", "resolution_id", "ticket_id (UK), technician_id", "resolution_notes, resolved_at. 1-to-1 incident resolution details."),
        ("TICKET_AUDIT_LOGS", "audit_id", "ticket_id (logical)", "old_status, new_status, old_priority, new_priority, action_type, changed_at."),
        ("EMPLOYEE_AUDIT_LOGS", "audit_id", "employee_id (logical)", "old_department_id, new_department_id, old_role, new_role, modified_at.")
    ]

    for r_idx, data in enumerate(entities_data, start=1):
        for c_idx, txt in enumerate(data):
            cell = table_dict.cell(r_idx, c_idx)
            set_cell_border(cell, top={'val': 'single', 'sz': '4', 'color': '000000'},
                                  bottom={'val': 'single', 'sz': '4', 'color': '000000'},
                                  left={'val': 'single', 'sz': '4', 'color': '000000'},
                                  right={'val': 'single', 'sz': '4', 'color': '000000'})
            p = cell.paragraphs[0]
            run = p.add_run(txt)
            run.font.size = Pt(7.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(2)

    add_h2("3.2 Cardinality & Schema")
    add_bullet("Relationships: ", "DEPARTMENTS-EMPLOYEES (1:N); EMPLOYEES-TICKETS as requester (1:N); EMPLOYEES-TICKETS as assignee (1:N); TICKETS-RESOLUTIONS (1:1); EMPLOYEES-RESOLUTIONS (1:N).")
    add_p(
        "• DEPARTMENTS (department_id [PK], department_name, location_building)\n"
        "• EMPLOYEES (employee_id [PK], full_name, email, role, department_id [FK])\n"
        "• TICKETS (ticket_id [PK], user_id [FK], issue_category, issue_description, priority_level, status, assigned_to [FK], created_at)\n"
        "• TICKET_RESOLUTIONS (resolution_id [PK], ticket_id [FK, UK], technician_id [FK], resolution_notes, resolved_at)\n"
        "• TICKET_AUDIT_LOGS (audit_id [PK], ticket_id, old_status, new_status, old_priority, new_priority, action_type, changed_by_user, changed_at)"
    )

    add_screenshot_placeholder(
        "A",
        "Entity-Relationship (ER) Diagram",
        "ER diagram showing all tables, primary keys, foreign keys, and 1:N / 1:1 connections."
    )

    # =========================================================================
    # 4. NORMALIZATION & DESIGN JUSTIFICATION
    # =========================================================================
    add_h1("4. Normalization & Design Justification")

    add_h2("4.1 Normal Forms (1NF, 2NF, 3NF, BCNF)")
    add_bullet("1NF (Atomic Values): ", "Every column contains a single scalar value. Priority ('HIGH') and categories are single strings, and each row has a primary key.")
    add_bullet("2NF (No Partial Dependencies): ", "All tables have single-column primary keys (department_id, employee_id, ticket_id, resolution_id). Without composite keys, partial dependency cannot exist.")
    add_bullet("3NF (No Transitive Dependencies): ", "Building location is stored only in DEPARTMENTS, not in EMPLOYEES or TICKETS. Technician names are stored only in EMPLOYEES, not in TICKET_RESOLUTIONS.")
    add_bullet("BCNF (Candidate Key Determinants): ", "All functional determinants are candidate keys (e.g. employee_id -> full_name; email -> employee_id). No non-key determinants exist, preventing update anomalies.")

    add_h2("4.2 Design Justification")
    add_bullet("Separate Resolutions: ", "Keeping TICKET_RESOLUTIONS separate avoids empty NULL notes for open tickets and enforces a clean 1:1 completed resolution state.")
    add_bullet("Separate Audit Logs: ", "Storing history in TICKET_AUDIT_LOGS keeps active ticket queries fast while saving an untouched record in the background.")

    # =========================================================================
    # 5. SQL IMPLEMENTATION
    # =========================================================================
    add_h1("5. SQL Implementation")

    add_h2("5.1 DDL Schema")
    add_code_block(
"""CREATE TABLE DEPARTMENTS (
    department_id NUMBER PRIMARY KEY, department_name VARCHAR2(50) NOT NULL UNIQUE, location_building VARCHAR2(50) NOT NULL
);
CREATE TABLE EMPLOYEES (
    employee_id NUMBER PRIMARY KEY, full_name VARCHAR2(100) NOT NULL, email VARCHAR2(100) NOT NULL UNIQUE,
    role VARCHAR2(20) NOT NULL CHECK (role IN ('USER', 'TECHNICIAN', 'ADMIN')),
    department_id NUMBER NOT NULL REFERENCES DEPARTMENTS(department_id) ON DELETE CASCADE
);
CREATE TABLE TICKETS (
    ticket_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id NUMBER NOT NULL REFERENCES EMPLOYEES(employee_id) ON DELETE CASCADE,
    issue_category VARCHAR2(50) NOT NULL CHECK (issue_category IN ('NETWORK','HARDWARE','SOFTWARE','ACCOUNT_ACCESS','EMAIL')),
    issue_description VARCHAR2(1000) NOT NULL,
    priority_level VARCHAR2(20) DEFAULT 'MEDIUM' CHECK (priority_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    status VARCHAR2(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
    assigned_to NUMBER REFERENCES EMPLOYEES(employee_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE TICKET_RESOLUTIONS (
    resolution_id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    ticket_id NUMBER NOT NULL UNIQUE REFERENCES TICKETS(ticket_id) ON DELETE CASCADE,
    technician_id NUMBER NOT NULL REFERENCES EMPLOYEES(employee_id),
    resolution_notes VARCHAR2(1000) NOT NULL, resolved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);"""
    )

    add_h2("5.2 Single-Row, Group & View Queries")
    add_code_block(
"""-- Single-row formatting and IST conversion
SELECT t.ticket_id, UPPER(t.issue_category) AS cat, 'EMP-' || LPAD(TO_CHAR(e.employee_id), 4, '0') AS badge,
       TO_CHAR(CAST(t.created_at AS TIMESTAMP WITH TIME ZONE) AT TIME ZONE 'Asia/Kolkata', 'DD-Mon-YYYY HH12:MI:SS AM') || ' IST' AS created_ist
FROM TICKETS t JOIN EMPLOYEES e ON t.user_id = e.employee_id;

-- Queue volume with HAVING >= 2
SELECT priority_level, COUNT(*) AS in_queue FROM TICKETS
WHERE status IN ('OPEN', 'IN_PROGRESS') GROUP BY priority_level HAVING COUNT(*) >= 2;

-- Average turnaround hours
SELECT ROUND(AVG((CAST(r.resolved_at AS DATE) - CAST(t.created_at AS DATE)) * 24), 2) AS avg_hours
FROM TICKET_RESOLUTIONS r JOIN TICKETS t ON r.ticket_id = t.ticket_id;

-- Dashboard View
CREATE OR REPLACE VIEW VW_ACTIVE_INCIDENTS_DASHBOARD AS
SELECT t.ticket_id, t.issue_category, t.priority_level, t.status, u.full_name AS requester, NVL(tech.full_name, 'Unassigned') AS lead_eng
FROM TICKETS t JOIN EMPLOYEES u ON t.user_id = u.employee_id LEFT JOIN EMPLOYEES tech ON t.assigned_to = tech.employee_id
WHERE t.status IN ('OPEN', 'IN_PROGRESS');"""
    )

    # =========================================================================
    # 6. PL/SQL IMPLEMENTATION
    # =========================================================================
    add_h1("6. PL/SQL Implementation")

    add_h2("6.1 Audit Trigger (TRG_TICKET_AUDIT_TRAIL)")
    add_p("Fires automatically on update/delete to save :OLD and :NEW states into TICKET_AUDIT_LOGS:")
    add_code_block(
"""CREATE OR REPLACE TRIGGER TRG_TICKET_AUDIT_TRAIL
AFTER UPDATE OR DELETE ON TICKETS FOR EACH ROW
DECLARE
    v_user VARCHAR2(100) := NVL(SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER'), USER);
BEGIN
    IF DELETING THEN
        INSERT INTO TICKET_AUDIT_LOGS (ticket_id, old_status, new_status, old_priority, new_priority, action_type, changed_by_user, changed_at)
        VALUES (:OLD.ticket_id, :OLD.status, NULL, :OLD.priority_level, NULL, 'DELETE', v_user, SYSTIMESTAMP);
    ELSIF UPDATING THEN
        IF (:OLD.status != :NEW.status) OR (:OLD.priority_level != :NEW.priority_level) OR 
           (:OLD.assigned_to IS NULL AND :NEW.assigned_to IS NOT NULL) OR (:OLD.assigned_to != :NEW.assigned_to) THEN
            INSERT INTO TICKET_AUDIT_LOGS (ticket_id, old_status, new_status, old_priority, new_priority, action_type, changed_by_user, changed_at)
            VALUES (:NEW.ticket_id, :OLD.status, :NEW.status, :OLD.priority_level, :NEW.priority_level, 'UPDATE', v_user, SYSTIMESTAMP);
        END IF;
    END IF;
END;
/"""
    )

    add_h2("6.2 Resolution Procedure & Turnaround Function")
    add_code_block(
"""CREATE OR REPLACE PROCEDURE SP_RESOLVE_INCIDENT_TRANSACTION (
    p_ticket_id IN NUMBER, p_technician_id IN NUMBER, p_resolution_notes IN VARCHAR2, p_status_msg OUT VARCHAR2
) IS
    v_status VARCHAR2(20); v_assigned NUMBER; v_role VARCHAR2(20);
    SAVEPOINT before_res;
BEGIN
    SELECT status, assigned_to INTO v_status, v_assigned FROM TICKETS WHERE ticket_id = p_ticket_id;
    IF v_status = 'RESOLVED' THEN p_status_msg := 'ERROR: Already resolved.'; RETURN; END IF;
    SELECT role INTO v_role FROM EMPLOYEES WHERE employee_id = p_technician_id;
    IF v_role NOT IN ('TECHNICIAN', 'ADMIN') THEN p_status_msg := 'ERROR: Technician required.'; RETURN; END IF;
    IF v_assigned IS NOT NULL AND v_assigned != p_technician_id AND v_role != 'ADMIN' THEN
        p_status_msg := 'ERROR: Assigned to peer technician.'; RETURN;
    END IF;
    INSERT INTO TICKET_RESOLUTIONS (ticket_id, technician_id, resolution_notes, resolved_at)
    VALUES (p_ticket_id, p_technician_id, p_resolution_notes, SYSTIMESTAMP);
    UPDATE TICKETS SET status = 'RESOLVED', assigned_to = NVL(assigned_to, p_technician_id) WHERE ticket_id = p_ticket_id;
    COMMIT;
    p_status_msg := 'SUCCESS: Incident resolved.';
EXCEPTION WHEN OTHERS THEN
    ROLLBACK TO before_res; p_status_msg := 'ERROR: ' || SQLERRM;
END;
/
CREATE OR REPLACE FUNCTION FN_CALCULATE_RESOLUTION_TIME (p_ticket_id IN NUMBER) RETURN NUMBER IS
    v_hrs NUMBER;
BEGIN
    SELECT ROUND((CAST(r.resolved_at AS DATE) - CAST(t.created_at AS DATE)) * 24, 2)
    INTO v_hrs FROM TICKETS t JOIN TICKET_RESOLUTIONS r ON t.ticket_id = r.ticket_id WHERE t.ticket_id = p_ticket_id;
    RETURN v_hrs;
EXCEPTION WHEN NO_DATA_FOUND THEN RETURN -1;
END;
/"""
    )

    # =========================================================================
    # 7. RESULTS, SCREENSHOTS & ANALYSIS
    # =========================================================================
    add_h1("7. Results, Screenshots & Analysis")

    # Figure 1
    add_h2("7.1 Staff & Organization Management (Admin Console)")
    add_screenshot_placeholder(
        "1",
        "Staff & Organization Management Console",
        "Open /admin -> Staff & Organization. Screenshot showing department cards and employee directory."
    )
    add_p("Analysis: Shows department overview and employee list with standardized badges.")

    # Figure 2
    add_h2("7.2 System Incident Oversight (Admin Console)")
    add_screenshot_placeholder(
        "2",
        "System Incident Oversight Table",
        "Open /admin -> Tickets. Screenshot showing KPI cards and tickets sorted with latest on top."
    )
    add_p("Analysis: Displays all reported tickets with IST timestamps and newest tickets at the top.")

    # Figure 3
    add_h2("7.3 Analytical SQL Laboratory")
    add_screenshot_placeholder(
        "3",
        "Analytical SQL Laboratory Interface",
        "Open /admin -> Analytical SQL Lab. Screenshot showing single-row functions and HAVING >= 2."
    )
    add_p("Analysis: Live query execution calculating workforce metrics and testing the resolution time function.")

    # Figure 4
    add_h2("7.4 Oracle PL/SQL Audit Trail & Trigger Telemetry")
    add_screenshot_placeholder(
        "4",
        "Oracle PL/SQL Audit Trail & Trigger Telemetry Stream",
        "Open /admin -> Audit Trail & Triggers. Screenshot showing trigger rows with :OLD to :NEW state transitions."
    )
    add_p("Analysis: Confirms trigger operation. Logs status transitions and priority shifts with IST times.")

    # Figure 5
    add_h2("7.5 Engineer Workbench - Queue & Criticality Lockouts")
    add_screenshot_placeholder(
        "5",
        "Engineer Workbench Incident Queue with Criticality Lockouts",
        "Sign in as Vikram Malhotra at /engineer. Screenshot showing active dropdowns and locked badges on resolved tickets."
    )
    add_p("Analysis: Proves priority cannot be changed once a ticket is resolved or assigned to another engineer.")

    # Figure 6
    add_h2("7.6 Engineer Workbench - Investigation Brief Modal")
    add_screenshot_placeholder(
        "6",
        "Incident Investigation Brief Popup Dialog",
        "In Engineer Workbench, click Investigate. Screenshot of popup showing user issue notes."
    )
    add_p("Analysis: Allows technicians to review problem notes and claim the ticket, setting status to IN_PROGRESS.")

    # Figure 7
    add_h2("7.7 Requester Support Portal - Incident Tracking")
    add_screenshot_placeholder(
        "7",
        "Requester Support Portal My Incidents View",
        "Sign in as Aarav Sharma at /user. Screenshot showing user tickets and resolution notes."
    )
    add_p("Analysis: Gives requesters live progress, assigned technician contact cards, and diagnosis notes.")

    # Figure 8
    add_h2("7.8 Oracle Database Schema & Trigger Compilation")
    add_screenshot_placeholder(
        "8",
        "Oracle SQL Developer / Database Actions Trigger Compilation",
        "Screenshot in Oracle SQL Developer or Web SQL Worksheet showing triggers compiled VALID."
    )
    add_p("Analysis: Verifies that tables, constraints, procedures, and triggers are compiled inside Oracle Autonomous Database.")

    # =========================================================================
    # 8. CONCLUSION, FUTURE ENHANCEMENTS & REFERENCES
    # =========================================================================
    add_h1("8. Conclusion, Future Enhancements & References")

    add_h2("8.1 Conclusion")
    add_p(
        "We built a functional IT incident ticketing database in Oracle Cloud normalized up to BCNF. "
        "Triggers automatically audit every update and deletion. Stored procedures and assignment locks "
        "prevent technicians from overwriting each other's work, providing a secure and reliable support platform."
    )

    add_h2("8.2 Future Enhancements")
    add_bullet("Auto-Assignment: ", "Dispatch incoming tickets to the technician with the smallest active queue.")
    add_bullet("Email Notifications: ", "Send email alerts to users whenever ticket status changes.")
    add_bullet("Knowledge Base: ", "Suggest fixes to technicians based on past similar tickets.")

    add_h2("8.3 References")
    add_p(
        "1. R. Elmasri and S. B. Navathe, Fundamentals of Database Systems, 7th ed., Pearson.\n"
        "2. A. Silberschatz, H. F. Korth, and S. Sudarshan, Database System Concepts, 7th ed., McGraw-Hill.\n"
        "3. Oracle Corporation, Oracle Database PL/SQL Language Reference 19c / 26ai.\n"
        "4. GitHub Repository: https://github.com/ArnavGoel77/ticketing-system"
    )

    try:
        doc.save(output_path)
        print(f"Report generated successfully at: {output_path}")
    except PermissionError:
        fallback_path = os.path.abspath('c:/ticketing-system/DBMS_Project_Report_6-7_Pages.docx')
        doc.save(fallback_path)
        print(f"Original file is currently open in Word. Saved 6-7 page version to: {fallback_path}")

if __name__ == '__main__':
    target = os.path.abspath('c:/ticketing-system/DBMS_Project_Report.docx')
    create_report(target)
