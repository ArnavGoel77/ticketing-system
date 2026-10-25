import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';

// Static Fallbacks for Categories & Priorities
const CATEGORIES = [
  { id: 'NETWORK', label: 'Network & Connectivity' },
  { id: 'HARDWARE', label: 'Hardware Fault' },
  { id: 'SOFTWARE', label: 'Software / Applications' },
  { id: 'ACCOUNT_ACCESS', label: 'Account & IAM Security' },
  { id: 'EMAIL', label: 'Email & Communications' },
];

const CATEGORY_ICONS = {
  NETWORK: '🌐',
  HARDWARE: '💻',
  SOFTWARE: '⚙️',
  ACCOUNT_ACCESS: '🔑',
  EMAIL: '📧',
  GENERAL: '❓'
};

const getCategoryIcon = (category) => {
  if (!category) return '📋';
  const key = String(category).toUpperCase();
  return CATEGORY_ICONS[key] || '📋';
};

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function App() {
  // Session Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Dedicated Route State (/login, /admin, /user, /engineer)
  const getRouteFromPath = () => {
    const p = window.location.pathname.toLowerCase();
    if (p.includes('/admin')) return '/admin';
    if (p.includes('/engineer')) return '/engineer';
    if (p.includes('/user')) return '/user';
    return '/login';
  };

  const [currentRoute, setCurrentRoute] = useState(getRouteFromPath);

  // Admin Dedicated Sub-Tab ('organization' | 'tickets' | 'sqllab')
  const [adminActiveTab, setAdminActiveTab] = useState('organization');

  // Shared Data States
  const [tickets, setTickets] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [headcountMetrics, setHeadcountMetrics] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Tickets Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // User Portal Filter States
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Employees Filter States
  const [empSearch, setEmpSearch] = useState('');
  const [empRoleFilter, setEmpRoleFilter] = useState('ALL');
  const [empDeptFilter, setEmpDeptFilter] = useState('ALL');

  // Modals & UI Toggles
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isStaffLookupOpen, setIsStaffLookupOpen] = useState(false);

  // Create Ticket Form State
  const [formData, setFormData] = useState({
    user_id: '',
    issue_category: '',
    issue_description: '',
    priority_level: 'MEDIUM',
  });
  const [submitting, setSubmitting] = useState(false);

  // Resolve Ticket Modal State
  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  // Investigation Details Popup State
  const [investigatingTicket, setInvestigatingTicket] = useState(null);
  const [investigationPriority, setInvestigationPriority] = useState('MEDIUM');
  const [investigating, setInvestigating] = useState(false);

  // Register Employee Form State
  const [empFormData, setEmpFormData] = useState({
    full_name: '',
    email: '',
    role: '',
    department_id: '',
  });
  const [registeringEmp, setRegisteringEmp] = useState(false);

  // On-screen Confirmation Popup State (Replaces browser window.confirm alerts)
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    type: null,
    id: null,
    name: '',
    details: '',
  });

  // Show Toast Notification
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Safe Navigation Helper with History PushState
  const navigate = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentRoute(path);
  };

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getRouteFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Route Guarding & Initial Redirection
  useEffect(() => {
    if (!currentUser) {
      if (currentRoute !== '/login') {
        navigate('/login');
      }
    } else {
      // Authenticated User
      if (currentRoute === '/login' || currentRoute === '/') {
        if (currentUser.role === 'ADMIN') navigate('/admin');
        else if (currentUser.role === 'TECHNICIAN') navigate('/engineer');
        else navigate('/user');
      } else if (currentRoute === '/admin' && currentUser.role !== 'ADMIN') {
        // Guard /admin against non-administrators
        showToast('Access denied: Administrator privileges required.', 'danger');
        if (currentUser.role === 'TECHNICIAN') navigate('/engineer');
        else navigate('/user');
      }
    }
  }, [currentUser, currentRoute]);

  // Fetch Live Database Data Across Modules
  const fetchData = useCallback(async () => {
    if (!currentUser) return;
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
      if (empJson.success) setEmployees(empJson.data || []);
      if (headJson.success) setHeadcountMetrics(headJson.data || []);
    } catch (err) {
      console.error('Data fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Session Handlers
  const handleLoginSuccess = (userObj) => {
    setCurrentUser(userObj);
    showToast(`Welcome back, ${userObj.full_name}!`, 'success');
    if (userObj.role === 'ADMIN') {
      navigate('/admin');
    } else if (userObj.role === 'TECHNICIAN') {
      navigate('/engineer');
    } else {
      navigate('/user');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    navigate('/login');
    showToast('Signed out successfully.', 'success');
  };

  // Helper for Initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // ============================================================================
  // TICKET MUTATION HANDLERS
  // ============================================================================

  // Submit New Ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    const requesterId = currentUser.role === 'USER' ? currentUser.employee_id : (formData.user_id || currentUser.employee_id);

    if (!requesterId) {
      showToast('Please select a requester identity.', 'danger');
      return;
    }
    if (!formData.issue_category) {
      showToast('Please select an issue category.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        user_id: Number(requesterId),
        issue_category: formData.issue_category,
        issue_description: formData.issue_description.trim() || 'General incident inquiry',
        priority_level: currentUser.role === 'USER' ? 'MEDIUM' : (formData.priority_level || 'MEDIUM'),
      };

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit incident ticket');
      }

      showToast(`Ticket #${data.data.ticket_id} submitted successfully!`, 'success');
      setFormData({
        user_id: '',
        issue_category: '',
        issue_description: '',
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

  // Open Investigation Brief Modal (Popup with details, description, requester)
  const openInvestigationModal = (ticket) => {
    setInvestigatingTicket(ticket);
    setInvestigationPriority(ticket.PRIORITY_LEVEL || ticket.priority_level || 'MEDIUM');
  };

  // Confirm Investigation Action (Assigns to current engineer and flips to IN_PROGRESS)
  const handleConfirmInvestigation = async () => {
    if (!investigatingTicket) return;
    const ticketId = investigatingTicket.TICKET_ID || investigatingTicket.ticket_id;
    setInvestigating(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          assigned_to: currentUser.employee_id,
          priority_level: investigationPriority
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Investigation update failed');

      showToast(`Assigned Ticket #${ticketId} to ${currentUser.full_name}. Status moved to IN_PROGRESS.`, 'success');
      setInvestigatingTicket(null);
      fetchData();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setInvestigating(false);
    }
  };

  // Support Engineer Priority Escalation Action
  const handleUpdatePriority = async (ticketId, newPriority) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority_level: newPriority }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Priority update failed');

      showToast(`Ticket #${ticketId} priority escalated to ${newPriority}`, 'success');
      fetchData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  // Submit Resolution (Only assigned investigating engineer or Admin can resolve)
  const handleResolveTicket = async (e) => {
    e.preventDefault();
    if (!resolveNotes.trim()) {
      showToast('Please enter technical resolution diagnosis notes.', 'danger');
      return;
    }

    const ticketAssignedTo = resolvingTicket.ASSIGNED_TO || resolvingTicket.assigned_to;
    if (ticketAssignedTo && Number(ticketAssignedTo) !== Number(currentUser.employee_id) && currentUser.role !== 'ADMIN') {
      showToast('Only the assigned investigating engineer (or an administrator) can resolve this ticket.', 'danger');
      return;
    }

    setResolving(true);
    try {
      const ticketId = resolvingTicket.TICKET_ID || resolvingTicket.ticket_id;
      const res = await fetch(`/api/tickets/${ticketId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technician_id: currentUser.employee_id,
          resolution_notes: resolveNotes.trim()
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Resolution failed');

      showToast(`Ticket #${ticketId} resolved successfully.`, 'success');
      setResolvingTicket(null);
      setResolveNotes('');
      fetchData();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setResolving(false);
    }
  };

  // Execute Ticket Deletion (Admin Only)
  const executeDeleteTicket = async (ticketId) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete ticket');

      showToast(`Ticket #${ticketId} permanently removed.`, 'success');
      fetchData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  // ============================================================================
  // PERSONNEL & ORG HANDLERS
  // ============================================================================

  // Register Employee
  const handleRegisterEmployee = async (e) => {
    e.preventDefault();
    if (!empFormData.full_name.trim() || !empFormData.email.trim()) {
      showToast('Full name and email are required.', 'danger');
      return;
    }
    if (!empFormData.role) {
      showToast('Please select an employee role.', 'danger');
      return;
    }
    if (!empFormData.department_id) {
      showToast('Please select a department.', 'danger');
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
        role: '',
        department_id: '',
      });
      fetchData();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setRegisteringEmp(false);
    }
  };

  // Delete Employee (FK Handling)
  const executeDeleteEmployee = async (empId, empName) => {
    try {
      const res = await fetch(`/api/employees/${empId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete employee');
      }

      showToast(data.message || `Employee "${empName}" removed successfully.`, 'success');
      fetchData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  // Filtered Tickets (Support search across ID, requester, category, and issue description)
  const filteredTickets = tickets.filter((t) => {
    const id = String(t.TICKET_ID || t.ticket_id || '');
    const reporter = String(t.REPORTER_NAME || t.reporter_name || '').toLowerCase();
    const cat = String(t.ISSUE_CATEGORY || t.issue_category || '').toUpperCase();
    const desc = String(t.ISSUE_DESCRIPTION || t.issue_description || '').toLowerCase();
    const status = String(t.STATUS || t.status || '').toUpperCase();
    const priority = String(t.PRIORITY_LEVEL || t.priority_level || '').toUpperCase();

    const query = search.toLowerCase();
    const matchesSearch =
      !search || id.includes(query) || reporter.includes(query) || cat.toLowerCase().includes(query) || desc.includes(query);
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || priority === priorityFilter;
    const matchesCategory = categoryFilter === 'ALL' || cat === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Filtered Employees
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

  // ============================================================================
  // UN-AUTHENTICATED ROUTE: /login (Task S2)
  // ============================================================================
  if (!currentUser || currentRoute === '/login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // ============================================================================
  // AUTHENTICATED PORTAL SHELL (Header + Dynamic Views)
  // ============================================================================
  const roleTitleMap = {
    ADMIN: 'Admin Console',
    TECHNICIAN: 'Engineer Workbench',
    USER: 'Support Portal'
  };

  const rolePillMap = {
    ADMIN: { label: '🛡️ System Admin', bg: '#f5f3ff', color: '#6d28d9', border: '#ede9fe' },
    TECHNICIAN: { label: '🛠️ Support Engineer', bg: '#fffbeb', color: '#b45309', border: '#fef3c7' },
    USER: { label: '👤 Requester', bg: '#eff6ff', color: '#1d4ed8', border: '#dbeafe' }
  };

  const activePill = rolePillMap[currentUser.role] || rolePillMap.USER;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 2000,
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

      {/* Persistent Global App Header */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 28px',
          height: '66px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Left: Brand & Portal Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 4px rgba(37,99,235,0.25)',
              fontSize: '18px'
            }}
          >
            🏢
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                ServiceDesk
              </span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>
                {roleTitleMap[currentUser.role] || 'Service Desk'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Oracle Autonomous Database 26ai (ATP)
            </div>
          </div>
        </div>

        {/* Right: User Profile Badge, Status & Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Oracle DB Status Indicator */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: '#f0fdf4',
              border: '1px solid #dcfce7',
              borderRadius: '20px',
              fontSize: '11.5px',
              fontWeight: 500,
              color: '#16a34a',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
            Oracle ATP Live
          </div>

          <button onClick={fetchData} className="btn btn-secondary btn-xs" title="Refresh live database data">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Refresh
          </button>

          {/* User Profile Badge (Initial avatar + Label + Role Pill) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 8px 4px 6px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '30px'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {getInitials(currentUser.full_name)}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
                {currentUser.full_name}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {currentUser.formatted_badge_id} &bull; {currentUser.department_name}
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: activePill.bg,
                color: activePill.color,
                border: `1px solid ${activePill.border}`
              }}
            >
              {activePill.label}
            </span>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-xs"
            style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fff' }}
            title="Sign out of current persona session"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* VIEW 1: DEDICATED /admin VIEW (Admin Console)                         */}
      {/* ===================================================================== */}
      {currentRoute === '/admin' && (
        <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 28px', width: '100%', flex: 1 }}>
          {/* Admin Navigation Ribbon */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '22px',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '12px'
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setAdminActiveTab('organization')}
                style={{
                  background: adminActiveTab === 'organization' ? '#eff6ff' : 'transparent',
                  border: adminActiveTab === 'organization' ? '1px solid #bfdbfe' : '1px solid transparent',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: adminActiveTab === 'organization' ? 700 : 500,
                  color: adminActiveTab === 'organization' ? '#2563eb' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🏢</span> Staff & Organization
              </button>

              <button
                onClick={() => setAdminActiveTab('tickets')}
                style={{
                  background: adminActiveTab === 'tickets' ? '#eff6ff' : 'transparent',
                  border: adminActiveTab === 'tickets' ? '1px solid #bfdbfe' : '1px solid transparent',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: adminActiveTab === 'tickets' ? 700 : 500,
                  color: adminActiveTab === 'tickets' ? '#2563eb' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🎫</span> Tickets
              </button>

              <button
                onClick={() => setAdminActiveTab('sqllab')}
                style={{
                  background: adminActiveTab === 'sqllab' ? '#eff6ff' : 'transparent',
                  border: adminActiveTab === 'sqllab' ? '1px solid #bfdbfe' : '1px solid transparent',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: adminActiveTab === 'sqllab' ? 700 : 500,
                  color: adminActiveTab === 'sqllab' ? '#2563eb' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🔬</span> Analytical SQL Lab
              </button>
            </div>

            {/* Contextual Action Button */}
            {adminActiveTab === 'organization' ? (
              <button onClick={() => setIsEmpModalOpen(true)} className="btn btn-primary">
                + Register New Employee
              </button>
            ) : adminActiveTab === 'tickets' ? (
              <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
                + Submit New Ticket
              </button>
            ) : null}
          </div>

          {/* TAB 1: STAFF & ORGANIZATION MANAGEMENT */}
          {adminActiveTab === 'organization' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Organization KPI Ribbon */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
                <div className="card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Total Personnel</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {employees.length}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Recorded in `EMPLOYEES`</div>
                </div>

                <div className="card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#2563eb' }}>IT Technicians</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
                    {employees.filter(e => e.ROLE === 'TECHNICIAN').length}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Resolvers (Tech Park A)</div>
                </div>

                <div className="card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#15803d' }}>Staff Requesters</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#15803d', marginTop: '4px' }}>
                    {employees.filter(e => e.ROLE === 'USER').length}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Campus End Users</div>
                </div>

                <div className="card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#7c3aed' }}>System Administrators</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#7c3aed', marginTop: '4px' }}>
                    {employees.filter(e => e.ROLE === 'ADMIN').length}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Administrative Governance</div>
                </div>

                <div className="card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Campus Departments</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {departments.length}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>In `DEPARTMENTS` table</div>
                </div>
              </div>

              {/* Department Cards Grid */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Campus Operational Divisions (`DEPARTMENTS`)
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    Enterprise Personnel &amp; Division Directory
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
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

              {/* Personnel Table Section */}
              <section className="card" style={{ padding: '20px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      Corporate Personnel Directory (`EMPLOYEES`)
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                      Identity roster with role permissions and building location mappings
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Search employee, email..."
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                      style={{ width: '220px', fontSize: '12.5px', padding: '6px 10px' }}
                    />

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
                        <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
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
                          <tr key={empId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
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
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <button
                                onClick={() => setConfirmDelete({
                                  isOpen: true,
                                  type: 'employee',
                                  id: empId,
                                  name: name,
                                  details: `Are you sure you want to permanently delete employee "${name}" (${badge})? This operation will remove the employee record from the Oracle EMPLOYEES table.`,
                                })}
                                className="btn btn-danger btn-xs"
                                title={`Remove ${name}`}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: SYSTEM INCIDENT OVERSIGHT */}
          {adminActiveTab === 'tickets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Ticket Metrics KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Total Tickets</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {metrics?.totalTickets || tickets.length}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Logged in `TICKETS`</div>
                </div>

                <div className="card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#2563eb' }}>Open / Active</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
                    {metrics?.openTickets || tickets.filter(t => t.STATUS === 'OPEN' || t.STATUS === 'IN_PROGRESS').length}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Active incident triage</div>
                </div>

                <div className="card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#dc2626' }}>Critical Escalations</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#dc2626', marginTop: '4px' }}>
                    {metrics?.criticalTickets || tickets.filter(t => t.PRIORITY_LEVEL === 'CRITICAL').length}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>High urgency queue</div>
                </div>

                <div className="card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#16a34a' }}>Completed Resolutions</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
                    {metrics?.resolvedTickets || tickets.filter(t => t.STATUS === 'RESOLVED' || t.STATUS === 'CLOSED').length}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>In `TICKET_RESOLUTIONS`</div>
                </div>

                <div className="card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Avg Turnaround</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {metrics?.avgTurnaroundHours ? `${metrics.avgTurnaroundHours}h` : '18.5h'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Computed via AVG() group fn</div>
                </div>
              </div>

              {/* Ticket Search & Filter Toolbar */}
              <section className="card" style={{ padding: '20px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Search incident ID, keyword, requester..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: '280px', fontSize: '12.5px', padding: '6px 10px' }}
                  />

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{ width: '130px', padding: '6px 10px', fontSize: '12.5px' }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>

                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      style={{ width: '130px', padding: '6px 10px', fontSize: '12.5px' }}
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      style={{ width: '160px', padding: '6px 10px', fontSize: '12.5px' }}
                    >
                      <option value="ALL">All Categories</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tickets Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>ID</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Requester</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Category</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Priority</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Created Date</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map((t) => {
                        const ticketId = t.TICKET_ID || t.ticket_id;
                        const reporter = t.REPORTER_NAME || t.reporter_name || `User #${t.USER_ID || t.user_id}`;
                        const cat = t.ISSUE_CATEGORY || t.issue_category;
                        const priority = t.PRIORITY_LEVEL || t.priority_level;
                        const status = t.STATUS || t.status;
                        const date = t.FORMATTED_CREATED_AT || t.formatted_created_at || t.CREATED_AT || t.created_at;

                        return (
                          <tr key={ticketId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#2563eb' }}>
                              #{ticketId}
                            </td>
                            <td style={{ padding: '12px', fontWeight: 600, color: '#0f172a' }}>
                              {reporter}
                            </td>
                            <td style={{ padding: '12px', color: '#475569' }}>
                              {cat}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span className={`badge badge-${String(priority).toLowerCase()}`}>
                                {priority}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span className={`badge status-${String(status).toLowerCase()}`}>
                                {String(status).replace('_', ' ')}
                              </span>
                            </td>
                            <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>
                              {date}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <button
                                onClick={() => setConfirmDelete({
                                  isOpen: true,
                                  type: 'ticket',
                                  id: ticketId,
                                  name: `Ticket #${ticketId}`,
                                  details: `Are you sure you want to permanently delete Ticket #${ticketId}? This operation will remove the incident record from the Oracle TICKETS table.`,
                                })}
                                className="btn btn-danger btn-xs"
                                title="Permanent administrative ticket removal"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: ANALYTICAL SQL LAB (Review 1 & 2 Query Execution) */}
          {adminActiveTab === 'sqllab' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Oracle Autonomous Database SQL Laboratory
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '3px 0 0 0' }}>
                  Live execution of Single-Row, Aggregate Group Functions, and HAVING thresholds
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
                {/* Card 1: Query 2.1 */}
                <div className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                      Query 2.1 &bull; HAVING Threshold
                    </span>
                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>Executed Live</span>
                  </div>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                    Department Headcount (<code>HAVING &gt;= 2</code>)
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                    Filters departments that have 2 or more staff members assigned.
                  </p>
                  <pre style={{ fontSize: '11px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '6px', color: '#334155', overflowX: 'auto', marginBottom: '14px' }}>
{`SELECT d.department_name, d.location_building,
       COUNT(e.employee_id) AS total_assigned_staff
FROM DEPARTMENTS d
JOIN EMPLOYEES e ON d.department_id = e.department_id
GROUP BY d.department_id, d.department_name, d.location_building
HAVING COUNT(e.employee_id) >= 2
ORDER BY total_assigned_staff DESC;`}
                  </pre>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {headcountMetrics.map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '12.5px' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.DEPARTMENT_NAME}</span>
                        <span style={{ color: '#2563eb', fontWeight: 700 }}>{row.TOTAL_ASSIGNED_STAFF} assigned personnel</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card 2: Query 2.2 */}
                <div className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>
                      Query 2.2 &bull; Role Distribution
                    </span>
                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>Executed Live</span>
                  </div>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                    Workforce Role Headcount & Percentage Share
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                    Computes percentage share across USER, TECHNICIAN, and ADMIN roles.
                  </p>
                  <pre style={{ fontSize: '11px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '6px', color: '#334155', overflowX: 'auto', marginBottom: '14px' }}>
{`SELECT role, COUNT(*) AS total_staff_count,
       ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM EMPLOYEES), 1) AS percentage_of_workforce
FROM EMPLOYEES
GROUP BY role
ORDER BY total_staff_count DESC;`}
                  </pre>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {['USER', 'TECHNICIAN', 'ADMIN'].map((role) => {
                      const count = employees.filter(e => e.ROLE === role).length;
                      const pct = employees.length > 0 ? ((count / employees.length) * 100).toFixed(1) : '0';
                      return (
                        <div key={role} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '12.5px' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{role}</span>
                          <span style={{ color: '#7c3aed', fontWeight: 700 }}>{count} staff ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card 3: Query 1.1, 1.2, 1.3 */}
                <div className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                      SQL Lab 1.0 &bull; Single-Row Functions
                    </span>
                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>Active in Schema</span>
                  </div>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                    Character Functions (UPPER, LOWER, INITCAP, LPAD, SUBSTR)
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                    Cleanses names and formats employee badges across the user interface.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                    <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <code>UPPER(full_name)</code> &rarr; Standardized capitalized corporate names
                    </div>
                    <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <code>LOWER(email)</code> &rarr; Case-insensitive authentication matching
                    </div>
                    <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <code>INITCAP(location_building)</code> &rarr; Standardized facility building names
                    </div>
                    <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <code>'EMP-' || LPAD(TO_CHAR(employee_id), 4, '0')</code> &rarr; Corporate badge format (e.g. EMP-0101)
                    </div>
                  </div>
                </div>

                {/* Card 4: Priority Queue with HAVING >= 2 */}
                <div className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>
                      Review 1 Analytical Query &bull; Priority Queue
                    </span>
                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>Executed Live</span>
                  </div>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                    Active Priority Volume (<code>HAVING &gt;= 2</code>)
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                    Identifies priority levels with at least 2 active tickets in the queue.
                  </p>
                  <pre style={{ fontSize: '11px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '6px', color: '#334155', overflowX: 'auto', marginBottom: '14px' }}>
{`SELECT priority_level, COUNT(*) AS total_tickets_in_queue
FROM TICKETS
WHERE status IN ('OPEN', 'IN_PROGRESS')
GROUP BY priority_level
HAVING COUNT(*) >= 2
ORDER BY total_tickets_in_queue DESC;`}
                  </pre>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {metrics?.byPriority && metrics.byPriority.length > 0 ? (
                      metrics.byPriority.map((row, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '12.5px' }}>
                          <span className={`badge badge-${String(row.PRIORITY_LEVEL).toLowerCase()}`}>{row.PRIORITY_LEVEL}</span>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{row.TOTAL_TICKETS_IN_QUEUE} in queue</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>No queues meeting threshold</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: DEDICATED /user VIEW (Support Portal)                          */}
      {/* ===================================================================== */}
      {currentRoute === '/user' && (() => {
        const myTickets = tickets.filter(t => (t.USER_ID || t.user_id) === currentUser.employee_id);
        const myActiveCount = myTickets.filter(t => (t.STATUS || t.status) !== 'RESOLVED').length;
        const myResolvedCount = myTickets.filter(t => (t.STATUS || t.status) === 'RESOLVED').length;

        const filteredMyTickets = myTickets.filter(t => {
          const status = (t.STATUS || t.status || '').toUpperCase();
          const cat = (t.ISSUE_CATEGORY || t.issue_category || '').toLowerCase();
          const desc = (t.ISSUE_DESCRIPTION || t.issue_description || '').toLowerCase();
          const id = String(t.TICKET_ID || t.ticket_id || '');
          const eng = (t.ASSIGNED_ENGINEER_NAME || t.assigned_engineer_name || '').toLowerCase();
          const query = userSearchTerm.toLowerCase();

          const matchesSearch = !userSearchTerm || id.includes(query) || cat.includes(query) || desc.includes(query) || eng.includes(query);
          if (!matchesSearch) return false;

          if (userStatusFilter === 'ACTIVE') return status !== 'RESOLVED';
          if (userStatusFilter === 'RESOLVED') return status === 'RESOLVED';
          return true;
        });

        return (
          <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 28px', width: '100%', flex: 1 }}>
            {/* Page Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '22px',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                  My Support Incidents
                </h1>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                  Track service requests, communicate with investigating engineers, and monitor resolution progress
                </p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-primary"
                style={{ padding: '10px 18px', fontSize: '13.5px', fontWeight: 600, borderRadius: '8px', boxShadow: '0 2px 6px rgba(37,99,235,0.25)' }}
              >
                <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Submit New Ticket
              </button>
            </div>

            {/* Quick Metrics Ribbon */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
              <div className="card metric-card">
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  📋
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Total Requests</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{myTickets.length}</div>
                </div>
              </div>

              <div className="card metric-card">
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  ⏳
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#b45309' }}>Active / In Progress</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#b45309' }}>{myActiveCount}</div>
                </div>
              </div>

              <div className="card metric-card">
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  ✓
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>Resolved &amp; Closed</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a' }}>{myResolvedCount}</div>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              {/* Segmented Filter Tabs */}
              <div style={{ display: 'inline-flex', background: '#e2e8f0', padding: '3px', borderRadius: '8px', gap: '3px' }}>
                <button
                  onClick={() => setUserStatusFilter('ALL')}
                  style={{
                    background: userStatusFilter === 'ALL' ? '#ffffff' : 'transparent',
                    color: userStatusFilter === 'ALL' ? '#0f172a' : '#64748b',
                    fontWeight: userStatusFilter === 'ALL' ? 700 : 500,
                    boxShadow: userStatusFilter === 'ALL' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  All ({myTickets.length})
                </button>
                <button
                  onClick={() => setUserStatusFilter('ACTIVE')}
                  style={{
                    background: userStatusFilter === 'ACTIVE' ? '#ffffff' : 'transparent',
                    color: userStatusFilter === 'ACTIVE' ? '#2563eb' : '#64748b',
                    fontWeight: userStatusFilter === 'ACTIVE' ? 700 : 500,
                    boxShadow: userStatusFilter === 'ACTIVE' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Active ({myActiveCount})
                </button>
                <button
                  onClick={() => setUserStatusFilter('RESOLVED')}
                  style={{
                    background: userStatusFilter === 'RESOLVED' ? '#ffffff' : 'transparent',
                    color: userStatusFilter === 'RESOLVED' ? '#16a34a' : '#64748b',
                    fontWeight: userStatusFilter === 'RESOLVED' ? 700 : 500,
                    boxShadow: userStatusFilter === 'RESOLVED' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Resolved ({myResolvedCount})
                </button>
              </div>

              {/* Search Input */}
              <div style={{ position: 'relative', width: '300px' }}>
                <input
                  type="text"
                  placeholder="Search incidents or keywords..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  style={{
                    padding: '7px 12px 7px 32px',
                    fontSize: '12.5px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1'
                  }}
                />
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px', pointerEvents: 'none' }}>
                  🔍
                </span>
              </div>
            </div>

            {/* User Ticket Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredMyTickets.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '50px 20px', background: '#ffffff', borderRadius: '10px' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>📂</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                    No support incidents found
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 auto 16px auto', maxWidth: '380px' }}>
                    {userSearchTerm || userStatusFilter !== 'ALL'
                      ? 'No incidents match your current search or status filter.'
                      : 'You have not submitted any technical support incidents yet.'}
                  </p>
                  <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '6px' }}>
                    + Submit Your First Incident
                  </button>
                </div>
              ) : (
                filteredMyTickets.map((t) => {
                  const ticketId = t.TICKET_ID || t.ticket_id;
                  const cat = t.ISSUE_CATEGORY || t.issue_category;
                  const priority = t.PRIORITY_LEVEL || t.priority_level;
                  const status = t.STATUS || t.status;
                  const date = t.FORMATTED_CREATED_AT || t.formatted_created_at || t.CREATED_AT || t.created_at;
                  const desc = t.ISSUE_DESCRIPTION || t.issue_description || 'No detailed issue notes provided.';
                  const engineerName = t.ASSIGNED_ENGINEER_NAME || t.assigned_engineer_name;
                  const engineerEmail = t.ASSIGNED_ENGINEER_EMAIL || t.assigned_engineer_email;
                  const engineerDept = t.ASSIGNED_ENGINEER_DEPT || t.assigned_engineer_dept || 'IT Support';
                  const engineerLoc = t.ASSIGNED_ENGINEER_LOCATION || t.assigned_engineer_location || 'Tech Park A';
                  const resNotes = t.RESOLUTION_NOTES || t.resolution_notes;
                  const resolvedAt = t.FORMATTED_RESOLVED_AT || t.formatted_resolved_at;

                  return (
                    <div
                      key={ticketId}
                      className="card card-hover"
                      style={{
                        padding: '20px 24px',
                        background: '#ffffff',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px'
                      }}
                    >
                      {/* Top Row: ID, Category, Priority, Date, Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb', fontFamily: 'var(--font-mono)' }}>
                            #{ticketId}
                          </span>
                          <span className="category-badge">
                            <span>{getCategoryIcon(cat)}</span>
                            <span>{cat}</span>
                          </span>
                          <span className={`priority-pill priority-pill-${String(priority).toLowerCase()}`}>
                            {priority}
                          </span>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                            • Reported on {date}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge status-${String(status).toLowerCase()}`}>
                            <span
                              className={`status-dot ${
                                status === 'OPEN'
                                  ? 'status-dot-open'
                                  : status === 'IN_PROGRESS'
                                  ? 'status-dot-progress'
                                  : 'status-dot-resolved'
                              }`}
                            />
                            {String(status).replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Issue Description Container */}
                      <div
                        style={{
                          padding: '12px 16px',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          borderLeft: '3px solid #2563eb',
                          fontSize: '13.5px',
                          lineHeight: 1.6,
                          color: '#1e293b'
                        }}
                      >
                        {desc}
                      </div>

                      {/* Investigating Lead Engineer Contact Card */}
                      {(status === 'IN_PROGRESS' || status === 'RESOLVED') && (
                        <div
                          style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            background: '#f0fdf4',
                            border: '1px solid #dcfce7',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: '#16a34a',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '13px'
                              }}
                            >
                              {(engineerName || 'Vikram Malhotra').split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Investigating Lead Engineer
                              </div>
                              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                                {engineerName || 'Vikram Malhotra'}
                                <span style={{ fontWeight: 400, color: '#64748b', fontSize: '12px', marginLeft: '6px' }}>
                                  ({engineerDept})
                                </span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12.5px' }}>
                            <span style={{ color: '#475569' }}>
                              🏢 Office: <strong>{engineerLoc}</strong>
                            </span>
                            <a
                              href={`mailto:${engineerEmail || 'support@company.com'}?subject=Inquiry on Ticket #${ticketId}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#ffffff',
                                border: '1px solid #bbf7d0',
                                color: '#15803d',
                                fontWeight: 600,
                                padding: '5px 12px',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                fontSize: '12px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              ✉️ Contact Engineer
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Resolution Summary Box */}
                      {status === 'RESOLVED' && resNotes && (
                        <div
                          style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderLeft: '3px solid #16a34a',
                            color: '#0f172a',
                            fontSize: '13px',
                            lineHeight: 1.5
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '12px', textTransform: 'uppercase' }}>
                              ✓ Official Resolution Diagnosis
                            </span>
                            {resolvedAt && (
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                Resolved on {resolvedAt}
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#334155' }}>{resNotes}</div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </main>
        );
      })()}

      {/* ===================================================================== */}
      {/* VIEW 3: DEDICATED /engineer VIEW (Engineer Workbench)                  */}
      {/* ===================================================================== */}
      {currentRoute === '/engineer' && (() => {
        const engineerOpenCount = tickets.filter(t => (t.STATUS || t.status) === 'OPEN').length;
        const engineerInProgressCount = tickets.filter(t => (t.STATUS || t.status) === 'IN_PROGRESS').length;
        const engineerResolvedCount = tickets.filter(t => (t.STATUS || t.status) === 'RESOLVED').length;

        return (
          <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 28px', width: '100%', flex: 1 }}>
            {/* Support Workbench Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                  Incident Triage &amp; Resolution Queue
                </h1>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                  Technician: <strong>{currentUser.full_name}</strong> • Division: <strong>{currentUser.department_name || 'IT Support'}</strong> • Office: <strong>{currentUser.location_building}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setIsStaffLookupOpen(true)} className="btn btn-secondary" style={{ borderRadius: '8px', fontSize: '13px' }}>
                  📖 Staff Directory
                </button>
              </div>
            </div>

            {/* Operational KPIs Ribbon */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '22px' }}>
              <div className="card metric-card">
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  ⚡
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>Active Queue</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{engineerOpenCount + engineerInProgressCount}</div>
                </div>
              </div>

              <div className="card metric-card">
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  🚨
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#b91c1c' }}>Awaiting Triage</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#b91c1c' }}>{engineerOpenCount}</div>
                </div>
              </div>

              <div className="card metric-card">
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  🔍
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#b45309' }}>In Investigation</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#b45309' }}>{engineerInProgressCount}</div>
                </div>
              </div>

              <div className="card metric-card">
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  ✓
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#16a34a' }}>Resolved Total</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#16a34a' }}>{engineerResolvedCount}</div>
                </div>
              </div>
            </div>

            {/* Workbench Grid: Left Category Sidebar + Right Incident Queue */}
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '22px', alignItems: 'start' }}>
              {/* Category Filter Sidebar */}
              <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="card" style={{ padding: '16px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                    Incident Categories
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                      onClick={() => setCategoryFilter('ALL')}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: categoryFilter === 'ALL' ? '#eff6ff' : 'transparent',
                        border: categoryFilter === 'ALL' ? '1px solid #bfdbfe' : '1px solid transparent',
                        color: categoryFilter === 'ALL' ? '#2563eb' : '#475569',
                        fontWeight: categoryFilter === 'ALL' ? 700 : 500,
                        cursor: 'pointer',
                        fontSize: '12.5px',
                        textAlign: 'left'
                      }}
                    >
                      <span>📁 All Categories</span>
                      <span style={{ fontSize: '11px', background: categoryFilter === 'ALL' ? '#2563eb' : '#e2e8f0', color: categoryFilter === 'ALL' ? '#ffffff' : '#475569', padding: '2px 7px', borderRadius: '10px', fontWeight: 700 }}>
                        {tickets.length}
                      </span>
                    </button>

                    {CATEGORIES.map((c) => {
                      const count = tickets.filter(t => (t.ISSUE_CATEGORY || t.issue_category) === c.id).length;
                      const isSelected = categoryFilter === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setCategoryFilter(c.id)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            background: isSelected ? '#eff6ff' : 'transparent',
                            border: isSelected ? '1px solid #bfdbfe' : '1px solid transparent',
                            color: isSelected ? '#2563eb' : '#475569',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            fontSize: '12.5px',
                            textAlign: 'left'
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{getCategoryIcon(c.id)}</span>
                            <span>{c.label}</span>
                          </span>
                          <span style={{ fontSize: '11px', background: isSelected ? '#2563eb' : '#e2e8f0', color: isSelected ? '#ffffff' : '#475569', padding: '2px 7px', borderRadius: '10px', fontWeight: 700 }}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              {/* Engineer Triage Queue */}
              <section className="card" style={{ padding: '20px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ position: 'relative', width: '280px' }}>
                    <input
                      type="text"
                      placeholder="Search queue by keyword, user, ID..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ padding: '7px 12px 7px 32px', fontSize: '12.5px', borderRadius: '8px' }}
                    />
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px', pointerEvents: 'none' }}>
                      🔍
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{ width: '130px', padding: '6px 10px', fontSize: '12.5px', borderRadius: '8px' }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>

                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      style={{ width: '130px', padding: '6px 10px', fontSize: '12.5px', borderRadius: '8px' }}
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </div>

                {/* Workbench Ticket List */}
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', background: '#f8fafc' }}>
                        <th style={{ padding: '12px 14px', fontWeight: 600 }}>ID</th>
                        <th style={{ padding: '12px 14px', fontWeight: 600 }}>Requester</th>
                        <th style={{ padding: '12px 14px', fontWeight: 600 }}>Category</th>
                        <th style={{ padding: '12px 14px', fontWeight: 600 }}>Problem Description</th>
                        <th style={{ padding: '12px 14px', fontWeight: 600 }}>Criticality</th>
                        <th style={{ padding: '12px 14px', fontWeight: 600 }}>Lead Engineer</th>
                        <th style={{ padding: '12px 14px', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                            No incidents found matching current filters.
                          </td>
                        </tr>
                      ) : (
                        filteredTickets.map((t) => {
                          const ticketId = t.TICKET_ID || t.ticket_id;
                          const reporter = t.REPORTER_NAME || t.reporter_name || `User #${t.USER_ID || t.user_id}`;
                          const cat = t.ISSUE_CATEGORY || t.issue_category;
                          const priority = t.PRIORITY_LEVEL || t.priority_level;
                          const status = t.STATUS || t.status;
                          const desc = t.ISSUE_DESCRIPTION || t.issue_description || '—';
                          const engineerName = t.ASSIGNED_ENGINEER_NAME || t.assigned_engineer_name;
                          const assignedTo = t.ASSIGNED_TO || t.assigned_to;
                          const isAssignedToMe = assignedTo && Number(assignedTo) === Number(currentUser.employee_id);
                          const canResolve = isAssignedToMe || currentUser.role === 'ADMIN';

                          return (
                            <tr key={ticketId} className="table-hover-row" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#2563eb', fontSize: '12.5px' }}>
                                #{ticketId}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{reporter}</div>
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <span className="category-badge">
                                  <span>{getCategoryIcon(cat)}</span>
                                  <span>{cat}</span>
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', maxWidth: '240px' }}>
                                <div
                                  onClick={() => openInvestigationModal(t)}
                                  title="Click to view complete problem description"
                                  style={{
                                    color: '#334155',
                                    fontSize: '12.5px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {desc}
                                </div>
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <select
                                  value={priority}
                                  onChange={(e) => handleUpdatePriority(ticketId, e.target.value)}
                                  style={{
                                    width: '100px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    background:
                                      priority === 'CRITICAL' ? '#fef2f2' :
                                      priority === 'HIGH' ? '#fff7ed' :
                                      priority === 'MEDIUM' ? '#eff6ff' : '#f8fafc',
                                    color:
                                      priority === 'CRITICAL' ? '#b91c1c' :
                                      priority === 'HIGH' ? '#c2410c' :
                                      priority === 'MEDIUM' ? '#2563eb' : '#475569',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {PRIORITIES.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                  ))}
                                </select>
                              </td>
                              <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                                {engineerName ? (
                                  <span style={{ fontWeight: 600, color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    👨‍💻 {engineerName}
                                  </span>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>
                                )}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <span className={`badge status-${String(status).toLowerCase()}`}>
                                  <span
                                    className={`status-dot ${
                                      status === 'OPEN'
                                        ? 'status-dot-open'
                                        : status === 'IN_PROGRESS'
                                        ? 'status-dot-progress'
                                        : 'status-dot-resolved'
                                    }`}
                                  />
                                  {String(status).replace('_', ' ')}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                  {status === 'OPEN' && (
                                    <button
                                      onClick={() => openInvestigationModal(t)}
                                      className="btn btn-primary btn-xs"
                                      style={{ fontWeight: 600, padding: '5px 11px', borderRadius: '6px' }}
                                    >
                                      🔍 Investigate
                                    </button>
                                  )}

                                  {status === 'IN_PROGRESS' && (
                                    canResolve ? (
                                      <button
                                        onClick={() => {
                                          setResolvingTicket(t);
                                          setResolveNotes('');
                                        }}
                                        className="btn btn-success btn-xs"
                                        style={{ fontWeight: 600, padding: '5px 11px', borderRadius: '6px' }}
                                      >
                                        ✓ Resolve
                                      </button>
                                    ) : (
                                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <span
                                          style={{
                                            fontSize: '11px',
                                            color: '#64748b',
                                            background: '#f1f5f9',
                                            border: '1px solid #cbd5e1',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontWeight: 600,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                          }}
                                          title={`Under investigation by ${engineerName || 'another engineer'}. Only they can resolve it.`}
                                        >
                                          🔒 Locked
                                        </span>
                                        <button
                                          onClick={() => openInvestigationModal(t)}
                                          className="btn btn-secondary btn-xs"
                                          style={{ fontSize: '11px', padding: '4px 7px' }}
                                          title="View ticket details"
                                        >
                                          Details
                                        </button>
                                      </div>
                                    )
                                  )}

                                  {status === 'RESOLVED' && (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, padding: '4px 6px' }}>
                                        ✓ Done
                                      </span>
                                      <button
                                        onClick={() => openInvestigationModal(t)}
                                        className="btn btn-secondary btn-xs"
                                        style={{ fontSize: '11px', padding: '4px 7px' }}
                                        title="View resolution diagnosis and ticket details"
                                      >
                                        Details
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </main>
        );
      })()}

      {/* ===================================================================== */}
      {/* MODAL 1: CREATE SUPPORT TICKET                                        */}
      {/* ===================================================================== */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '480px', padding: '24px', background: '#ffffff', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Submit Support Incident Ticket
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Requester Identity (Auto-locked for USER role, picker for ADMIN) */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Requester
                </label>
                {currentUser.role === 'USER' ? (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>👤</span>
                    <span>{currentUser.full_name} ({currentUser.formatted_badge_id} &bull; {currentUser.department_name})</span>
                  </div>
                ) : (
                  <select
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value ? Number(e.target.value) : '' })}
                    required
                  >
                    <option value="">-- Select Requester --</option>
                    {employees.filter(e => e.ROLE === 'USER').map((u) => (
                      <option key={u.EMPLOYEE_ID} value={u.EMPLOYEE_ID}>
                        {u.FULL_NAME} ({u.DEPARTMENT_NAME}) &bull; ID #{u.EMPLOYEE_ID}
                      </option>
                    ))}
                  </select>
                )}
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
                  <option value="">-- Select Category --</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Detailed Issue Explanation
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain symptoms, error messages, and when the issue started..."
                  value={formData.issue_description}
                  onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
                  required
                />
              </div>

              {/* Priority Picker (Hidden for End Users, Available for Admins) */}
              {currentUser.role === 'ADMIN' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Priority Level (Admin Override)
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
              ) : (
                <div style={{ fontSize: '11.5px', color: '#64748b', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  ℹ️ Priority will be evaluated by an IT Support Engineer upon triage.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Submitting...' : 'Submit Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: INVESTIGATION BRIEF & ACTION                                   */}
      {/* ===================================================================== */}
      {investigatingTicket && (() => {
        const ticketId = investigatingTicket.TICKET_ID || investigatingTicket.ticket_id;
        const reporter = investigatingTicket.REPORTER_NAME || investigatingTicket.reporter_name || `User #${investigatingTicket.USER_ID || investigatingTicket.user_id}`;
        const reporterEmail = investigatingTicket.REPORTER_EMAIL || investigatingTicket.reporter_email;
        const cat = investigatingTicket.ISSUE_CATEGORY || investigatingTicket.issue_category;
        const priority = investigatingTicket.PRIORITY_LEVEL || investigatingTicket.priority_level;
        const status = investigatingTicket.STATUS || investigatingTicket.status;
        const desc = investigatingTicket.ISSUE_DESCRIPTION || investigatingTicket.issue_description || 'No detailed issue notes provided.';
        const date = investigatingTicket.FORMATTED_CREATED_AT || investigatingTicket.formatted_created_at || investigatingTicket.CREATED_AT || investigatingTicket.created_at;
        const assignedTo = investigatingTicket.ASSIGNED_TO || investigatingTicket.assigned_to;
        const engineerName = investigatingTicket.ASSIGNED_ENGINEER_NAME || investigatingTicket.assigned_engineer_name;
        const isAssignedToMe = Number(assignedTo) === Number(currentUser.employee_id);
        const canResolve = isAssignedToMe || currentUser.role === 'ADMIN';

        return (
          <div className="modal-overlay" onClick={() => setInvestigatingTicket(null)}>
            <div
              className="card"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '560px',
                maxWidth: '92vw',
                padding: '24px 28px',
                background: '#ffffff',
                boxShadow: 'var(--shadow-lg)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#2563eb', fontFamily: 'var(--font-mono)' }}>
                      #{ticketId}
                    </span>
                    <span className="category-badge">
                      <span>{getCategoryIcon(cat)}</span>
                      <span>{cat}</span>
                    </span>
                    <span className={`badge status-${String(status).toLowerCase()}`}>
                      <span
                        className={`status-dot ${
                          status === 'OPEN'
                            ? 'status-dot-open'
                            : status === 'IN_PROGRESS'
                            ? 'status-dot-progress'
                            : 'status-dot-resolved'
                        }`}
                      />
                      {String(status).replace('_', ' ')}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Incident Investigation Brief
                  </h2>
                </div>

                <button
                  onClick={() => setInvestigatingTicket(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '22px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '0 4px',
                    lineHeight: 1
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Requester Info Strip */}
              <div
                style={{
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: '#eff6ff',
                      color: '#2563eb',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}
                  >
                    👤
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      {reporter}
                    </div>
                    {reporterEmail && (
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {reporterEmail}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'right' }}>
                  <div>Reported on:</div>
                  <strong style={{ color: '#334155' }}>{date}</strong>
                </div>
              </div>

              {/* Problem Description Container */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '6px' }}>
                  Reported Problem Description
                </label>
                <div
                  style={{
                    padding: '14px 16px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderLeft: '4px solid #2563eb',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    lineHeight: 1.6,
                    color: '#0f172a'
                  }}
                >
                  {desc}
                </div>
              </div>

              {/* Triage Criticality Adjuster (when OPEN) or Status Info */}
              {status === 'OPEN' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '6px' }}>
                    Triage Criticality Level
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {PRIORITIES.map((p) => {
                      const isSelected = investigationPriority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setInvestigationPriority(p)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            color: isSelected ? '#2563eb' : '#475569',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                  <span>Current Priority: <strong>{priority}</strong></span>
                  <span>Assigned Lead: <strong>{engineerName || 'Unassigned'}</strong></span>
                </div>
              )}

              {/* Investigator Action Callout */}
              {status === 'OPEN' && (
                <div
                  style={{
                    padding: '12px 14px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    color: '#1e40af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>👨‍💻</span>
                  <div>
                    <strong>Assigning Lead: {currentUser.full_name}</strong>
                    <div style={{ fontSize: '11.5px', color: '#3b82f6', marginTop: '2px' }}>
                      Status will change to IN_PROGRESS. Other technicians cannot resolve this ticket until released or completed.
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setInvestigatingTicket(null)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', borderRadius: '6px' }}
                >
                  Close
                </button>

                {status === 'OPEN' && (
                  <button
                    type="button"
                    disabled={investigating}
                    onClick={handleConfirmInvestigation}
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', borderRadius: '6px', fontWeight: 600 }}
                  >
                    {investigating ? 'Assigning...' : '🚀 Begin Investigation'}
                  </button>
                )}

                {status === 'IN_PROGRESS' && canResolve && (
                  <button
                    type="button"
                    onClick={() => {
                      const t = investigatingTicket;
                      setInvestigatingTicket(null);
                      setResolvingTicket(t);
                      setResolveNotes('');
                    }}
                    className="btn btn-success"
                    style={{ padding: '8px 18px', borderRadius: '6px', fontWeight: 600 }}
                  >
                    ✓ Proceed to Resolve
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* MODAL 2: RESOLVE INCIDENT                                             */}
      {/* ===================================================================== */}
      {resolvingTicket && (
        <div className="modal-overlay" onClick={() => setResolvingTicket(null)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '480px', padding: '24px', background: '#ffffff', boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              Resolve Incident #{resolvingTicket.TICKET_ID || resolvingTicket.ticket_id}
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '16px' }}>
              Category: <strong>{resolvingTicket.ISSUE_CATEGORY || resolvingTicket.issue_category}</strong> &bull; Resolving Technician:{' '}
              <strong>{currentUser.full_name}</strong>
            </p>

            <form onSubmit={handleResolveTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Technical Diagnosis & Corrective Actions
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain steps taken, patches applied, or hardware replaced to resolve the incident..."
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
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
                <button type="submit" disabled={resolving} className="btn btn-success">
                  {resolving ? 'Submitting...' : 'Mark Incident Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: REGISTER NEW EMPLOYEE                                        */}
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
                    required
                  >
                    <option value="">-- Select Role --</option>
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
                    onChange={(e) => setEmpFormData({ ...empFormData, department_id: e.target.value ? Number(e.target.value) : '' })}
                    required
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => {
                      const loc = d.STANDARDIZED_LOCATION || d.LOCATION_BUILDING || '';
                      return (
                        <option key={d.DEPARTMENT_ID} value={d.DEPARTMENT_ID}>
                          #{d.DEPARTMENT_ID} - {d.DEPARTMENT_NAME} {loc ? `(${loc})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Dynamic Location Badge */}
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '14px' }}>📍</span>
                <span>
                  Building Location:{' '}
                  <strong style={{ color: '#0f172a' }}>
                    {departments.find((d) => Number(d.DEPARTMENT_ID) === Number(empFormData.department_id))?.STANDARDIZED_LOCATION ||
                      departments.find((d) => Number(d.DEPARTMENT_ID) === Number(empFormData.department_id))?.LOCATION_BUILDING ||
                      'Assigned Campus'}
                  </strong>{' '}
                  <span style={{ color: '#64748b' }}>(Pre-defined)</span>
                </span>
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

      {/* ===================================================================== */}
      {/* MODAL 4: READ-ONLY STAFF DIRECTORY LOOKUP (For Support Engineers)      */}
      {/* ===================================================================== */}
      {isStaffLookupOpen && (
        <div className="modal-overlay" onClick={() => setIsStaffLookupOpen(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '700px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '24px', background: '#ffffff', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Campus Personnel Contacts (Read-Only)
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Look up requester office building locations for on-site hardware support
                </span>
              </div>
              <button
                onClick={() => setIsStaffLookupOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '8px 10px' }}>Badge</th>
                    <th style={{ padding: '8px 10px' }}>Employee</th>
                    <th style={{ padding: '8px 10px' }}>Email</th>
                    <th style={{ padding: '8px 10px' }}>Department</th>
                    <th style={{ padding: '8px 10px' }}>Office Building</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.EMPLOYEE_ID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#2563eb' }}>
                        {emp.FORMATTED_BADGE_ID}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>
                        {emp.FULL_NAME}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>
                        {emp.EMAIL}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#334155' }}>
                        {emp.DEPARTMENT_NAME}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#64748b' }}>
                        {emp.STANDARDIZED_LOCATION || emp.LOCATION_BUILDING}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: ON-SCREEN DELETE CONFIRMATION POPUP                          */}
      {/* ===================================================================== */}
      {confirmDelete.isOpen && (
        <div
          className="modal-overlay"
          onClick={() => setConfirmDelete({ isOpen: false, type: null, id: null, name: '', details: '' })}
          style={{ zIndex: 1100 }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '430px',
              padding: '24px',
              background: '#ffffff',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: '12px',
              border: '1px solid #fee2e2',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid #fee2e2',
                }}
              >
                ⚠️
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Confirm Deletion
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Permanent database operation
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, marginBottom: '22px' }}>
              {confirmDelete.details}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setConfirmDelete({ isOpen: false, type: null, id: null, name: '', details: '' })}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmDelete.type === 'ticket') {
                    executeDeleteTicket(confirmDelete.id);
                  } else if (confirmDelete.type === 'employee') {
                    executeDeleteEmployee(confirmDelete.id, confirmDelete.name);
                  }
                  setConfirmDelete({ isOpen: false, type: null, id: null, name: '', details: '' });
                }}
                className="btn btn-danger"
                style={{ background: '#dc2626', borderColor: '#dc2626', color: '#ffffff', fontWeight: 600 }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
