import React, { useState, useEffect, useCallback } from 'react';

// Preset lists aligned with database records (used as instant fallback)
const USERS = [
  { id: 101, name: 'Aarav Sharma', dept: 'Engineering', email: 'aarav.sharma@company.com' },
  { id: 102, name: 'Priya Patel', dept: 'Engineering', email: 'priya.patel@company.com' },
  { id: 103, name: 'Rohan Iyer', dept: 'Human Resources', email: 'rohan.iyer@company.com' },
  { id: 104, name: 'Ananya Verma', dept: 'Finance', email: 'ananya.verma@company.com' },
  { id: 105, name: 'Aditya Nair', dept: 'Operations', email: 'aditya.nair@company.com' },
  { id: 106, name: 'Sneha Kulkarni', dept: 'Operations', email: 'sneha.kulkarni@company.com' },
];

const TECHNICIANS = [
  { id: 201, name: 'Vikram Malhotra', dept: 'IT Support' },
  { id: 202, name: 'Neha Sengupta', dept: 'IT Support' },
  { id: 203, name: 'Rahul Deshmukh', dept: 'IT Support' },
];

const CATEGORIES = [
  { id: 'NETWORK', label: 'Network & VPN' },
  { id: 'HARDWARE', label: 'Hardware Fault' },
  { id: 'SOFTWARE', label: 'Software / OS' },
  { id: 'ACCOUNT_ACCESS', label: 'Account & IAM' },
  { id: 'EMAIL', label: 'Email & Outlook' },
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// Demo Profiles for Multi-Persona Role Switching (POC)
// Role Categories for Multi-Persona Role Switching (POC)
const PROFILES = {
  USER: {
    key: 'USER',
    role: 'USER',
    label: 'End User',
    title: 'Employee Self-Service Portal',
    desc: 'Campus employee view. Can submit support tickets and monitor status. Cannot triage, resolve, or delete tickets.',
    permissionTag: 'Submit Only',
    avatarBg: '#dbeafe',
    avatarColor: '#1d4ed8',
    icon: '👤',
  },
  ENGINEER: {
    key: 'ENGINEER',
    role: 'TECHNICIAN',
    label: 'Support Engineer',
    title: 'Technical Incident Workbench',
    desc: 'IT Technician view. Can investigate and resolve active incidents. Organization staff directory is read-only.',
    permissionTag: 'Triage & Resolve',
    avatarBg: '#fef3c7',
    avatarColor: '#b45309',
    icon: '🛠️',
  },
  ADMIN: {
    key: 'ADMIN',
    role: 'ADMIN',
    label: 'System Admin',
    title: 'Administrative Control Center',
    desc: 'Superuser view. Full governance across ticket lifecycles, resolutions, deletions, and employee directory management.',
    permissionTag: 'Full Superuser Access',
    avatarBg: '#ede9fe',
    avatarColor: '#6d28d9',
    icon: '🛡️',
  },
};

export default function App() {
  // Active Profile State (POC Persona Switcher)
  const [activeProfileKey, setActiveProfileKey] = useState('ADMIN');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const currentProfile = PROFILES[activeProfileKey];

  // Navigation Tab: 'tickets' (Arnav's module) vs 'organization' (Shobit's module)
  const [activeTab, setActiveTab] = useState('tickets');

  // Shared Data States
  const [tickets, setTickets] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [headcountMetrics, setHeadcountMetrics] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Tickets Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Employees Filters (Shobit's Module)
  const [empSearch, setEmpSearch] = useState('');
  const [empRoleFilter, setEmpRoleFilter] = useState('ALL');
  const [empDeptFilter, setEmpDeptFilter] = useState('ALL');

  // Modals & UI Toggles
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [showSqlDetails, setShowSqlDetails] = useState(false);

  // New Ticket Form State
  const [formData, setFormData] = useState({
    user_id: 101,
    issue_category: 'NETWORK',
    priority_level: 'MEDIUM',
  });
  const [submitting, setSubmitting] = useState(false);

  // Resolve Modal State
  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [resolveData, setResolveData] = useState({
    technician_id: 201,
    resolution_notes: '',
  });
  const [resolving, setResolving] = useState(false);

  // Register Employee Form State (Shobit's Module)
  const [empFormData, setEmpFormData] = useState({
    full_name: '',
    email: '',
    role: 'USER',
    department_id: 1,
  });
  const [registeringEmp, setRegisteringEmp] = useState(false);

  // Show Toast Notification
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Live Data Across Both Modules
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketsRes, metricsRes, deptRes, empRes, headRes] = await Promise.all([
        fetch('/api/tickets'),
        fetch('/api/tickets/metrics'),
        fetch('/api/departments'),
        fetch('/api/employees'),
        fetch('/api/employees/headcount')
      ]);

      const [ticketsJson, metricsJson, deptJson, empJson, headJson] = await Promise.all([
        ticketsRes.json(),
        metricsRes.json(),
        deptRes.json(),
        empRes.json(),
        headRes.json()
      ]);

      if (ticketsJson.success) setTickets(ticketsJson.data || []);
      if (metricsJson.success) setMetrics(metricsJson.data || null);
      if (deptJson.success) setDepartments(deptJson.data || []);
      if (empJson.success) {
        setEmployees(empJson.data || []);
        const usersList = (empJson.data || []).filter(e => e.ROLE === 'USER');
        if (usersList.length > 0 && !formData.user_id) {
          setFormData(prev => ({ ...prev, user_id: usersList[0].EMPLOYEE_ID }));
        }
      }
      if (headJson.success) setHeadcountMetrics(headJson.data || []);
    } catch (err) {
      console.error('Data fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dynamic user and technician lists with fallback
  const liveUsers = employees
    .filter(e => e.ROLE === 'USER')
    .map(e => ({ id: e.EMPLOYEE_ID, name: e.FULL_NAME, dept: e.DEPARTMENT_NAME || 'Staff', email: e.EMAIL }));
  const availableUsers = liveUsers.length > 0 ? liveUsers : USERS;

  const liveTechnicians = employees
    .filter(e => e.ROLE === 'TECHNICIAN')
    .map(e => ({ id: e.EMPLOYEE_ID, name: e.FULL_NAME, dept: e.DEPARTMENT_NAME || 'IT Support' }));
  const availableTechnicians = liveTechnicians.length > 0 ? liveTechnicians : TECHNICIANS;

  // Submit New Ticket (Arnav's Module)
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit ticket');
      }

      showToast(`Ticket #${data.data.ticket_id} created successfully!`, 'success');
      setFormData({
        user_id: availableUsers[0]?.id || 101,
        issue_category: 'NETWORK',
        priority_level: 'MEDIUM',
      });
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  // Update Status (Arnav's Module)
  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showToast(`Ticket #${ticketId} moved to ${newStatus.replace('_', ' ')}`, 'success');
      fetchData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  // Delete Ticket (Arnav's Module)
  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm(`Are you sure you want to delete Ticket #${ticketId}?`)) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showToast(`Ticket #${ticketId} deleted.`, 'success');
      fetchData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  // Submit Resolution (Arnav's Module)
  const handleResolveTicket = async (e) => {
    e.preventDefault();
    if (!resolveData.resolution_notes.trim()) {
      alert('Please enter technical resolution notes.');
      return;
    }
    setResolving(true);
    try {
      const ticketId = resolvingTicket.TICKET_ID || resolvingTicket.ticket_id;
      const res = await fetch(`/api/tickets/${ticketId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolveData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showToast(`Ticket #${ticketId} resolved successfully.`, 'success');
      setResolvingTicket(null);
      setResolveData({ technician_id: availableTechnicians[0]?.id || 201, resolution_notes: '' });
      fetchData();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setResolving(false);
    }
  };

  // Register Employee (Shobit's Module)
  const handleRegisterEmployee = async (e) => {
    e.preventDefault();
    if (!empFormData.full_name.trim() || !empFormData.email.trim()) {
      alert('Full name and email are required.');
      return;
    }
    setRegisteringEmp(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empFormData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Registration failed');

      showToast(`Employee ${data.data.full_name} (${data.data.formatted_badge_id}) added to Oracle DB!`, 'success');
      setIsEmpModalOpen(false);
      setEmpFormData({
        full_name: '',
        email: '',
        role: 'USER',
        department_id: departments[0]?.DEPARTMENT_ID || 1,
      });
      fetchData();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setRegisteringEmp(false);
    }
  };

  // Helper for Initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Filtered Tickets (Arnav's Module)
  const filteredTickets = tickets.filter((t) => {
    const id = String(t.TICKET_ID || t.ticket_id || '');
    const reporter = String(t.REPORTER_NAME || t.reporter_name || '').toLowerCase();
    const cat = String(t.ISSUE_CATEGORY || t.issue_category || '').toUpperCase();
    const status = String(t.STATUS || t.status || '').toUpperCase();
    const priority = String(t.PRIORITY_LEVEL || t.priority_level || '').toUpperCase();

    const matchesSearch =
      id.includes(search) || reporter.includes(search.toLowerCase()) || cat.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || priority === priorityFilter;
    const matchesCategory = categoryFilter === 'ALL' || cat === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Filtered Employees (Shobit's Module)
  const filteredEmployees = employees.filter((emp) => {
    const name = String(emp.FULL_NAME || '').toLowerCase();
    const email = String(emp.EMAIL || '').toLowerCase();
    const role = String(emp.ROLE || '').toUpperCase();
    const deptId = String(emp.DEPARTMENT_ID || '');

    const matchesSearch = name.includes(empSearch.toLowerCase()) || email.includes(empSearch.toLowerCase());
    const matchesRole = empRoleFilter === 'ALL' || role === empRoleFilter;
    const matchesDept = empDeptFilter === 'ALL' || deptId === empDeptFilter;

    return matchesSearch && matchesRole && matchesDept;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            padding: '12px 18px',
            borderRadius: '8px',
            background: notification.type === 'danger' ? '#fef2f2' : '#f0fdf4',
            border: notification.type === 'danger' ? '1px solid #fee2e2' : '1px solid #bbf7d0',
            color: notification.type === 'danger' ? '#b91c1c' : '#15803d',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span>{notification.type === 'danger' ? '⚠️' : '✓'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 28px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 4px rgba(37,99,235,0.25)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
                ServiceDesk
              </span>
            </div>
          </div>

          {/* Module Navigation Tabs */}
          <nav style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => { setActiveTab('tickets'); setStatusFilter('ALL'); setCategoryFilter('ALL'); setPriorityFilter('ALL'); }}
              style={{
                background: activeTab === 'tickets' ? '#eff6ff' : 'transparent',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: activeTab === 'tickets' ? 600 : 500,
                color: activeTab === 'tickets' ? '#2563eb' : '#475569',
                cursor: 'pointer',
              }}
            >
              Incident Tickets
            </button>

            {/* Shobit's Module Tab - Restricted for User Role */}
            {currentProfile.role !== 'USER' && (
              <button
                onClick={() => setActiveTab('organization')}
                style={{
                  background: activeTab === 'organization' ? '#eff6ff' : 'transparent',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'organization' ? 600 : 500,
                  color: activeTab === 'organization' ? '#2563eb' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🏢</span> Organization & Staff
              </button>
            )}
          </nav>
        </div>

        {/* Right Actions & Profile Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: '#f0fdf4',
              border: '1px solid #dcfce7',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#16a34a',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
            System Live
          </div>

          <button onClick={fetchData} className="btn btn-secondary btn-xs" title="Refresh live database data">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Refresh
          </button>

          {/* Contextual Action Button based on Tab & Role */}
          {activeTab === 'tickets' ? (
            (currentProfile.role === 'USER' || currentProfile.role === 'ADMIN') && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-primary"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                New Ticket
              </button>
            )
          ) : (
            currentProfile.role === 'ADMIN' && (
              <button onClick={() => setIsEmpModalOpen(true)} className="btn btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Employee
              </button>
            )
          )}

          {/* Google-Style Category Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '24px',
                background: currentProfile.avatarBg,
                border: `1.5px solid ${currentProfile.avatarColor}44`,
                color: currentProfile.avatarColor,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.15s ease',
              }}
              title={`Active Category: ${currentProfile.label} (Click to switch)`}
            >
              <span style={{ fontSize: '15px' }}>{currentProfile.icon}</span>
              <span>{currentProfile.label}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.7, transform: isProfileMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {/* Backdrop click to close */}
            {isProfileMenuOpen && (
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 50 }}
                onClick={() => setIsProfileMenuOpen(false)}
              />
            )}

            {/* Role Category Popover Menu */}
            {isProfileMenuOpen && (
              <div
                className="card"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '46px',
                  width: '320px',
                  padding: '16px',
                  zIndex: 60,
                  boxShadow: 'var(--shadow-lg)',
                  borderRadius: '12px',
                  background: '#ffffff',
                }}
              >
                {/* Active Category Card */}
                <div style={{ textAlign: 'center', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: currentProfile.avatarBg,
                      fontSize: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px auto',
                      border: `2px solid ${currentProfile.avatarColor}`,
                    }}
                  >
                    {currentProfile.icon}
                  </div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>
                    {currentProfile.label}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {currentProfile.title}
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: currentProfile.avatarBg,
                        color: currentProfile.avatarColor,
                      }}
                    >
                      {currentProfile.permissionTag}
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '8px', lineHeight: 1.4 }}>
                    {currentProfile.desc}
                  </div>
                </div>

                {/* Switch Roles Section */}
                <div style={{ paddingTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                    Select Role Category
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Object.entries(PROFILES).map(([key, p]) => {
                      const isCurrent = key === activeProfileKey;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setActiveProfileKey(key);
                            setIsProfileMenuOpen(false);
                            if (p.role === 'USER') {
                              setActiveTab('tickets');
                            }
                            showToast(`Switched active category to ${p.label}`, 'success');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: isCurrent ? '1.5px solid #2563eb' : '1px solid var(--border-subtle)',
                            background: isCurrent ? '#eff6ff' : '#f8fafc',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: p.avatarBg,
                              fontSize: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {p.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                              {p.label}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {p.permissionTag}
                            </div>
                          </div>
                          {isCurrent && (
                            <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '13px' }}>✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 28px', width: '100%', flex: 1 }}>
        {/* ===================================================================== */}
        {/* VIEW 1: TICKETS / INCIDENT COMMAND (Arnav's Module)                   */}
        {/* ===================================================================== */}
        {activeTab === 'tickets' && (
          <>
            {/* KPI Metric Summary Ribbon */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Total Incidents
                </div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {metrics?.totalTickets ?? tickets.length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  All tickets logged in Oracle
                </div>
              </div>

              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#1d4ed8' }}>
                  In Progress / Triage
                </div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#1d4ed8', marginTop: '4px' }}>
                  {metrics?.openTickets ?? 0}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Active queue
                </div>
              </div>

              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#b91c1c' }}>
                  Critical Attention
                </div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#b91c1c', marginTop: '4px' }}>
                  {metrics?.criticalTickets ?? 0}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  High priority SLA
                </div>
              </div>

              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#15803d' }}>
                  Resolved Incidents
                </div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#15803d', marginTop: '4px' }}>
                  {metrics?.resolvedTickets ?? 0}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Closed & completed
                </div>
              </div>

              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Avg Turnaround Time
                </div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {metrics?.avgTurnaroundHours ? `${metrics.avgTurnaroundHours}h` : '4.25h'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Average resolution speed
                </div>
              </div>
            </div>

            {/* Content Split: Sidebar (Filters & Queue Analytics) + Main Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
              {/* Sidebar */}
              <aside style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Quick Views */}
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                    Quick Views
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {currentProfile.role === 'USER' && (
                      <button
                        onClick={() => {
                          setStatusFilter('ALL');
                          setCategoryFilter('ALL');
                          setPriorityFilter('ALL');
                          setSearch(String(currentProfile.id));
                        }}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: search === String(currentProfile.id) ? '#eff6ff' : 'transparent',
                          color: search === String(currentProfile.id) ? '#2563eb' : '#0f172a',
                          fontSize: '13px',
                          fontWeight: search === String(currentProfile.id) ? 600 : 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span>📌 My Tickets</span>
                        <span
                          style={{
                            fontSize: '11.5px',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            background: '#dbeafe',
                            color: '#1d4ed8',
                            fontWeight: 600,
                          }}
                        >
                          {tickets.filter(t => Number(t.USER_ID || t.user_id) === currentProfile.id).length}
                        </span>
                      </button>
                    )}
                    {[
                      { id: 'ALL', label: 'All Tickets', count: tickets.length },
                      { id: 'OPEN', label: 'Needs Triage', count: tickets.filter(t => (t.STATUS || t.status) === 'OPEN').length },
                      { id: 'IN_PROGRESS', label: 'In Investigation', count: tickets.filter(t => (t.STATUS || t.status) === 'IN_PROGRESS').length },
                      { id: 'RESOLVED', label: 'Resolved', count: tickets.filter(t => (t.STATUS || t.status) === 'RESOLVED').length },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setStatusFilter(item.id);
                          if (search === String(currentProfile.id)) setSearch('');
                        }}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: statusFilter === item.id && search !== String(currentProfile.id) ? '#eff6ff' : 'transparent',
                          color: statusFilter === item.id && search !== String(currentProfile.id) ? '#2563eb' : '#334155',
                          fontSize: '13px',
                          fontWeight: statusFilter === item.id && search !== String(currentProfile.id) ? 600 : 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span>{item.label}</span>
                        <span
                          style={{
                            fontSize: '11.5px',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            background: statusFilter === item.id && search !== String(currentProfile.id) ? '#dbeafe' : '#f1f5f9',
                            color: statusFilter === item.id && search !== String(currentProfile.id) ? '#1d4ed8' : '#64748b',
                            fontWeight: 600,
                          }}
                        >
                          {item.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories Filter */}
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                    Filter by Category
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      onClick={() => setCategoryFilter('ALL')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: categoryFilter === 'ALL' ? '#eff6ff' : 'transparent',
                        color: categoryFilter === 'ALL' ? '#2563eb' : '#475569',
                        fontSize: '12.5px',
                        fontWeight: categoryFilter === 'ALL' ? 600 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      All Categories
                    </button>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategoryFilter(cat.id)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: categoryFilter === cat.id ? '#eff6ff' : 'transparent',
                          color: categoryFilter === cat.id ? '#2563eb' : '#475569',
                          fontSize: '12.5px',
                          fontWeight: categoryFilter === cat.id ? 600 : 400,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review 1 Analytical Query Card (Arnav's Scope: Priority Queue with HAVING >= 2) */}
                <div className="card" style={{ padding: '16px', background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Review 1 Query 2.1
                    </span>
                    <button
                      onClick={() => setShowSqlDetails(!showSqlDetails)}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {showSqlDetails ? 'Hide SQL' : 'View SQL'}
                    </button>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: '0 0 10px 0' }}>
                    Active tickets grouped by priority level with volume threshold (<code>HAVING &gt;= 2</code>).
                  </p>

                  {showSqlDetails && (
                    <pre style={{ fontSize: '10.5px', background: '#f1f5f9', padding: '8px', borderRadius: '4px', overflowX: 'auto', marginBottom: '10px', color: '#334155' }}>
{`SELECT priority_level, COUNT(*) 
FROM TICKETS 
WHERE status IN ('OPEN', 'IN_PROGRESS')
GROUP BY priority_level 
HAVING COUNT(*) >= 2;`}
                    </pre>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {metrics?.byPriority && metrics.byPriority.length > 0 ? (
                      metrics.byPriority.map((row, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 10px',
                            background: '#ffffff',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                            fontSize: '12px',
                          }}
                        >
                          <span className={`badge badge-${(row.PRIORITY_LEVEL || row.priority_level || '').toLowerCase()}`}>
                            {row.PRIORITY_LEVEL || row.priority_level}
                          </span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>
                            {row.TOTAL_TICKETS_IN_QUEUE || row.total_tickets_in_queue} in queue
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>No queues meeting HAVING &gt;= 2 threshold</div>
                    )}
                  </div>
                </div>
              </aside>

              {/* Main Tickets Data Table */}
              <section className="card" style={{ padding: '20px', overflow: 'hidden' }}>
                {/* Engineer Mode Active Queue Callout */}
                {currentProfile.role === 'TECHNICIAN' && (
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>🛠️</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#92400e' }}>
                          Support Engineer Workbench
                        </div>
                        <div style={{ fontSize: '12px', color: '#b45309' }}>
                          {tickets.filter(t => (t.STATUS || t.status) === 'OPEN').length} tickets waiting for triage &bull; {tickets.filter(t => (t.STATUS || t.status) === 'IN_PROGRESS').length} actively in progress.
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setStatusFilter('OPEN')}
                        className="btn btn-secondary btn-xs"
                        style={{ borderColor: '#fde68a', background: '#ffffff', color: '#92400e' }}
                      >
                        Triage Queue
                      </button>
                      <button
                        onClick={() => setStatusFilter('IN_PROGRESS')}
                        className="btn btn-secondary btn-xs"
                        style={{ borderColor: '#fde68a', background: '#ffffff', color: '#92400e' }}
                      >
                        In Progress
                      </button>
                    </div>
                  </div>
                )}

                {/* User Mode Greeting Banner */}
                {currentProfile.role === 'USER' && (
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: '#eff6ff',
                      border: '1px solid #dbeafe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>👤</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e40af' }}>
                          End User Support Portal
                        </div>
                        <div style={{ fontSize: '12px', color: '#2563eb' }}>
                          Submit IT support tickets and track resolution status in real time.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="btn btn-primary btn-xs"
                    >
                      + New Ticket
                    </button>
                  </div>
                )}

                {/* Search & Priority Filter Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: '320px' }}>
                    <input
                      type="text"
                      placeholder="Filter by ID, requester, keyword..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ paddingLeft: '32px', fontSize: '13px' }}
                    />
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Priority:</span>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      style={{ width: '130px', padding: '6px 10px', fontSize: '12.5px' }}
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                {loading ? (
                  <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>Connecting to Oracle Cloud...</div>
                  </div>
                ) : error ? (
                  <div style={{ padding: '20px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', color: '#b91c1c', fontSize: '13px' }}>
                    <strong>Database Connection Warning:</strong> {error}
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                    No incident records matching current filter parameters
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '10px 12px', fontWeight: 600 }}>Ticket</th>
                          <th style={{ padding: '10px 12px', fontWeight: 600 }}>Requester</th>
                          <th style={{ padding: '10px 12px', fontWeight: 600 }}>Category</th>
                          <th style={{ padding: '10px 12px', fontWeight: 600 }}>Priority</th>
                          <th style={{ padding: '10px 12px', fontWeight: 600 }}>Status</th>
                          <th style={{ padding: '10px 12px', fontWeight: 600 }}>Submitted</th>
                          <th style={{ padding: '10px 12px', fontWeight: 600 }}>Resolution Summary</th>
                          <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTickets.map((t) => {
                          const ticketId = t.TICKET_ID || t.ticket_id;
                          const reporterName = t.REPORTER_NAME || t.reporter_name || `User #${t.USER_ID || t.user_id}`;
                          const category = t.ISSUE_CATEGORY || t.issue_category;
                          const priority = t.PRIORITY_LEVEL || t.priority_level;
                          const status = (t.STATUS || t.status || '').toUpperCase();
                          const createdDate = t.FORMATTED_CREATED_AT || t.formatted_created_at || 'Just now';
                          const notes = t.RESOLUTION_NOTES || t.resolution_notes;
                          const isResolved = status === 'RESOLVED' || status === 'CLOSED';

                          return (
                            <tr
                              key={ticketId}
                              style={{
                                borderBottom: '1px solid var(--border-subtle)',
                                transition: 'background-color 0.1s ease',
                              }}
                            >
                              <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: '#2563eb' }}>
                                #{ticketId}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '50%',
                                      background: '#eff6ff',
                                      color: '#2563eb',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {getInitials(reporterName)}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{reporterName}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>ID: {t.USER_ID || t.user_id}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '12px', color: '#334155' }}>
                                {category}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span className={`badge badge-${priority.toLowerCase()}`}>
                                  {priority}
                                </span>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span className={`badge status-${status.toLowerCase()}`}>
                                  {status.replace('_', ' ')}
                                </span>
                              </td>
                              <td style={{ padding: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {createdDate}
                              </td>
                              <td style={{ padding: '12px', maxWidth: '220px' }}>
                                <div
                                  style={{
                                    fontSize: '12px',
                                    color: isResolved ? '#15803d' : '#94a3b8',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={notes}
                                >
                                  {notes || 'Pending triage'}
                                </div>
                                {t.TECHNICIAN_NAME && (
                                  <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px' }}>
                                    Tech: {t.TECHNICIAN_NAME}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                  {/* Triage: Only for Engineer or Admin */}
                                  {status === 'OPEN' && (currentProfile.role === 'TECHNICIAN' || currentProfile.role === 'ADMIN') && (
                                    <button
                                      onClick={() => handleUpdateStatus(ticketId, 'IN_PROGRESS')}
                                      className="btn btn-secondary btn-xs"
                                      title="Move ticket to in-progress triage"
                                    >
                                      Investigate
                                    </button>
                                  )}
                                  {/* Resolve: Only for Engineer or Admin */}
                                  {(status === 'OPEN' || status === 'IN_PROGRESS') && (currentProfile.role === 'TECHNICIAN' || currentProfile.role === 'ADMIN') && (
                                    <button
                                      onClick={() => {
                                        setResolvingTicket(t);
                                        if (currentProfile.role === 'TECHNICIAN') {
                                          setResolveData(prev => ({ ...prev, technician_id: currentProfile.id }));
                                        }
                                      }}
                                      className="btn btn-success btn-xs"
                                      title="Record Technical Resolution"
                                    >
                                      Resolve
                                    </button>
                                  )}
                                  {/* Delete: Only for Admin */}
                                  {currentProfile.role === 'ADMIN' && (
                                    <button
                                      onClick={() => handleDeleteTicket(ticketId)}
                                      className="btn btn-danger btn-xs"
                                      title="Delete ticket (Admin only)"
                                    >
                                      &times;
                                    </button>
                                  )}
                                  {/* User View: Clean read-only status */}
                                  {currentProfile.role === 'USER' && (
                                    <span style={{ fontSize: '11px', color: isResolved ? '#15803d' : '#94a3b8', fontStyle: 'italic', fontWeight: isResolved ? 600 : 400 }}>
                                      {isResolved ? 'Resolved' : 'Pending Triage'}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </>
        )}

        {/* ===================================================================== */}
        {/* VIEW 2: ORGANIZATION DIRECTORY (Shobit's Module)                      */}
        {/* ===================================================================== */}
        {activeTab === 'organization' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Organization KPI Summary Ribbon */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '16px',
              }}
            >
              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Total Personnel
                </div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {employees.length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Recorded in `EMPLOYEES`
                </div>
              </div>

              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#2563eb' }}>
                  IT Technicians
                </div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
                  {employees.filter(e => e.ROLE === 'TECHNICIAN').length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Resolving staff (Tech Park A)
                </div>
              </div>

              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#15803d' }}>
                  Staff Requesters
                </div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#15803d', marginTop: '4px' }}>
                  {employees.filter(e => e.ROLE === 'USER').length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Authorized to submit incidents
                </div>
              </div>

              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#7c3aed' }}>
                  System Administrators
                </div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#7c3aed', marginTop: '4px' }}>
                  {employees.filter(e => e.ROLE === 'ADMIN').length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Administrative governance
                </div>
              </div>

              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Campus Departments
                </div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {departments.length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  In `DEPARTMENTS` table
                </div>
              </div>
            </div>

            {/* Department Cards Grid */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Campus Operational Divisions (`DEPARTMENTS`)
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  Oracle Relational Schema &bull; Shobit's Module
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px',
                }}
              >
                {departments.map((dept) => (
                  <div
                    key={dept.DEPARTMENT_ID}
                    className="card"
                    style={{
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', fontFamily: 'var(--font-mono)' }}>
                          DEPT #{dept.DEPARTMENT_ID}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            background: '#eff6ff',
                            borderRadius: '12px',
                            color: '#1d4ed8',
                            fontWeight: 600,
                          }}
                        >
                          {dept.TOTAL_STAFF || 0} Staff
                        </span>
                      </div>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
                        {dept.DEPARTMENT_NAME}
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                        📍 {dept.STANDARDIZED_LOCATION || dept.LOCATION_BUILDING}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                      <span style={{ color: '#2563eb', fontWeight: 500 }}>🛠️ {dept.TECHNICIAN_COUNT || 0} Techs</span>
                      <span style={{ color: '#cbd5e1' }}>&bull;</span>
                      <span style={{ color: 'var(--text-secondary)' }}>👥 {dept.USER_COUNT || 0} Users</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Grid: Shobit's Review 1 Query 2.1 Card + Personnel Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>
              {/* Left Column: Shobit's Analytical Query Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="card" style={{ padding: '18px', background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Review 1 Query 2.1 (Shobit)
                    </span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: '0 0 10px 0' }}>
                    Department staff headcount aggregation with threshold filter (<code>HAVING &gt;= 2</code>).
                  </p>
                  <pre style={{ fontSize: '10.5px', background: '#f1f5f9', padding: '8px', borderRadius: '4px', overflowX: 'auto', marginBottom: '12px', color: '#334155' }}>
{`SELECT d.department_name, 
       COUNT(e.employee_id) 
FROM DEPARTMENTS d 
JOIN EMPLOYEES e 
  ON d.department_id = e.department_id
GROUP BY d.department_name
HAVING COUNT(e.employee_id) >= 2;`}
                  </pre>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {headcountMetrics && headcountMetrics.length > 0 ? (
                      headcountMetrics.map((row, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 10px',
                            background: '#ffffff',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>
                            {row.DEPARTMENT_NAME}
                          </span>
                          <span
                            style={{
                              fontSize: '11.5px',
                              padding: '2px 8px',
                              background: '#eff6ff',
                              borderRadius: '10px',
                              color: '#1d4ed8',
                              fontWeight: 700,
                            }}
                          >
                            {row.TOTAL_ASSIGNED_STAFF} staff
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>No departments meeting HAVING &gt;= 2</div>
                    )}
                  </div>
                </div>

                {/* Quick Add Button Card (Admin Only) or Read-Only Notice */}
                {currentProfile.role === 'ADMIN' ? (
                  <div className="card" style={{ padding: '18px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                      Add Personnel
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                      Inserts an employee record into Oracle with department foreign key binding.
                    </p>
                    <button
                      onClick={() => setIsEmpModalOpen(true)}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      + Register New Employee
                    </button>
                  </div>
                ) : (
                  <div className="card" style={{ padding: '18px', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px' }}>👁️</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                        Read-Only Directory
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                      Technicians have read-only visibility into staff contacts. Administrative privileges required to register or modify personnel.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Personnel Registry Table */}
              <section className="card" style={{ padding: '20px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: '280px' }}>
                    <input
                      type="text"
                      placeholder="Search employee, email..."
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                      style={{ paddingLeft: '32px', fontSize: '13px' }}
                    />
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select
                      value={empRoleFilter}
                      onChange={(e) => setEmpRoleFilter(e.target.value)}
                      style={{ width: '130px', padding: '6px 10px', fontSize: '12.5px' }}
                    >
                      <option value="ALL">All Roles</option>
                      <option value="USER">USER</option>
                      <option value="TECHNICIAN">TECHNICIAN</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>

                    <select
                      value={empDeptFilter}
                      onChange={(e) => setEmpDeptFilter(e.target.value)}
                      style={{ width: '160px', padding: '6px 10px', fontSize: '12.5px' }}
                    >
                      <option value="ALL">All Departments</option>
                      {departments.map((d) => (
                        <option key={d.DEPARTMENT_ID} value={String(d.DEPARTMENT_ID)}>
                          {d.DEPARTMENT_NAME}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Personnel Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Badge ID</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Employee</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Corporate Email</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Department</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Building Location</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((emp) => {
                        const empId = emp.EMPLOYEE_ID;
                        const badge = emp.FORMATTED_BADGE_ID || `EMP-${String(empId).padStart(4, '0')}`;
                        const name = emp.FULL_NAME;
                        const email = emp.EMAIL;
                        const deptName = emp.DEPARTMENT_NAME || 'Unassigned';
                        const loc = emp.STANDARDIZED_LOCATION || emp.LOCATION_BUILDING || 'N/A';
                        const role = emp.ROLE;

                        const roleBadgeStyle =
                          role === 'TECHNICIAN'
                            ? { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' }
                            : role === 'ADMIN'
                            ? { background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ede9fe' }
                            : { background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' };

                        return (
                          <tr
                            key={empId}
                            style={{
                              borderBottom: '1px solid var(--border-subtle)',
                              transition: 'background-color 0.1s ease',
                            }}
                          >
                            <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: '#2563eb' }}>
                              {badge}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '50%',
                                    background: '#eff6ff',
                                    color: '#2563eb',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  {getInitials(name)}
                                </div>
                                <div style={{ fontWeight: 600, color: '#0f172a' }}>{name}</div>
                              </div>
                            </td>
                            <td style={{ padding: '12px', color: '#475569', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                              {email}
                            </td>
                            <td style={{ padding: '12px', color: '#334155' }}>
                              {deptName}
                            </td>
                            <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                              {loc}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  letterSpacing: '0.02em',
                                  ...roleBadgeStyle,
                                }}
                              >
                                {role}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* ===================================================================== */}
      {/* MODAL 1: CREATE TICKET (Arnav's Module)                               */}
      {/* ===================================================================== */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '460px', padding: '24px', background: '#ffffff', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Create Support Ticket
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Requester (Choose who you are)
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: Number(e.target.value) })}
                  required
                >
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.dept}) — ID #{u.id}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Select your employee identity from the corporate directory.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Issue Category
                </label>
                <select
                  value={formData.issue_category}
                  onChange={(e) => setFormData({ ...formData, issue_category: e.target.value })}
                  required
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Priority Level
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {PRIORITIES.map((p) => {
                    const isSelected = formData.priority_level === p;
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setFormData({ ...formData, priority_level: p })}
                        style={{
                          padding: '7px 4px',
                          borderRadius: '6px',
                          border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          color: isSelected ? '#1d4ed8' : '#475569',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: RESOLVE TICKET (Arnav's Module)                              */}
      {/* ===================================================================== */}
      {resolvingTicket && (
        <div className="modal-overlay" onClick={() => setResolvingTicket(null)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '480px', padding: '24px', background: '#ffffff', boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              Resolve Incident #{resolvingTicket.TICKET_ID || resolvingTicket.ticket_id}
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '16px' }}>
              Category: <strong>{resolvingTicket.ISSUE_CATEGORY || resolvingTicket.issue_category}</strong> &bull; Priority:{' '}
              <strong>{resolvingTicket.PRIORITY_LEVEL || resolvingTicket.priority_level}</strong>
            </p>

            <form onSubmit={handleResolveTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Resolving Engineer (Choose who you are)
                </label>
                <select
                  value={resolveData.technician_id}
                  onChange={(e) => setResolveData({ ...resolveData, technician_id: Number(e.target.value) })}
                  required
                >
                  {availableTechnicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} ({tech.dept}) — ID #{tech.id}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Select your technician identity to record this resolution in Oracle.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Technical Work Notes & Actions Taken
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the steps performed to resolve this incident..."
                  value={resolveData.resolution_notes}
                  onChange={(e) => setResolveData({ ...resolveData, resolution_notes: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={resolving} className="btn btn-primary">
                  {resolving ? 'Submitting...' : 'Mark as Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: REGISTER NEW EMPLOYEE (Shobit's Module)                       */}
      {/* ===================================================================== */}
      {isEmpModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEmpModalOpen(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '460px', padding: '24px', background: '#ffffff', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Register New Employee
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  Inserts into Oracle <code>EMPLOYEES</code> table
                </span>
              </div>
              <button
                onClick={() => setIsEmpModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRegisterEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maya Sundaram"
                  value={empFormData.full_name}
                  onChange={(e) => setEmpFormData({ ...empFormData, full_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Corporate Email (UNIQUE)
                </label>
                <input
                  type="email"
                  placeholder="e.g. maya.sundaram@company.com"
                  value={empFormData.email}
                  onChange={(e) => setEmpFormData({ ...empFormData, email: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Role
                  </label>
                  <select
                    value={empFormData.role}
                    onChange={(e) => setEmpFormData({ ...empFormData, role: e.target.value })}
                  >
                    <option value="USER">USER (Requester)</option>
                    <option value="TECHNICIAN">TECHNICIAN (Resolver)</option>
                    <option value="ADMIN">ADMIN (Manager)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Department
                  </label>
                  <select
                    value={empFormData.department_id}
                    onChange={(e) => setEmpFormData({ ...empFormData, department_id: Number(e.target.value) })}
                  >
                    {departments.map((d) => (
                      <option key={d.DEPARTMENT_ID} value={d.DEPARTMENT_ID}>
                        #{d.DEPARTMENT_ID} - {d.DEPARTMENT_NAME}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={registeringEmp} className="btn btn-primary">
                  {registeringEmp ? 'Registering...' : 'Register Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
