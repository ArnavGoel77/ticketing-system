import React, { useState, useEffect, useCallback } from 'react';

// Preset lists aligned with database records
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

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals & UI Toggles
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  // Show Toast Notification
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Tickets & Metrics
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketsRes, metricsRes] = await Promise.all([
        fetch('/api/tickets'),
        fetch('/api/tickets/metrics')
      ]);

      const ticketsJson = await ticketsRes.json();
      const metricsJson = await metricsRes.json();

      if (ticketsJson.success) {
        setTickets(ticketsJson.data || []);
      } else {
        throw new Error(ticketsJson.message || 'Failed to fetch tickets');
      }

      if (metricsJson.success) {
        setMetrics(metricsJson.data || null);
      }
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

  // Submit New Ticket
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
        user_id: 101,
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

  // Update Status (e.g. Move to IN_PROGRESS)
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

  // Delete Ticket
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

  // Submit Resolution
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
      setResolveData({ technician_id: 201, resolution_notes: '' });
      fetchData();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setResolving(false);
    }
  };

  // Helper for Initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Filtered Tickets
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

          {/* Navigation Links */}
          <nav style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => { setStatusFilter('ALL'); setCategoryFilter('ALL'); setPriorityFilter('ALL'); }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: statusFilter === 'ALL' && categoryFilter === 'ALL' ? '#2563eb' : '#475569',
                cursor: 'pointer',
              }}
            >
              All Tickets
            </button>
            <button
              onClick={() => setStatusFilter('OPEN')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                color: statusFilter === 'OPEN' ? '#2563eb' : '#475569',
                cursor: 'pointer',
              }}
            >
              Needs Triage
            </button>
            <button
              onClick={() => setStatusFilter('RESOLVED')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                color: statusFilter === 'RESOLVED' ? '#2563eb' : '#475569',
                cursor: 'pointer',
              }}
            >
              Resolved
            </button>
          </nav>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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

          <button onClick={fetchData} className="btn btn-secondary btn-xs" title="Refresh data">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Refresh
          </button>

          <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Ticket
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 28px', width: '100%', flex: 1 }}>
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
              All tickets logged
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
                {[
                  { id: 'ALL', label: 'All Tickets', count: tickets.length },
                  { id: 'OPEN', label: 'Needs Triage', count: tickets.filter(t => (t.STATUS || t.status) === 'OPEN').length },
                  { id: 'IN_PROGRESS', label: 'In Investigation', count: tickets.filter(t => (t.STATUS || t.status) === 'IN_PROGRESS').length },
                  { id: 'RESOLVED', label: 'Resolved', count: tickets.filter(t => (t.STATUS || t.status) === 'RESOLVED').length },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setStatusFilter(item.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: statusFilter === item.id ? '#eff6ff' : 'transparent',
                      color: statusFilter === item.id ? '#2563eb' : '#334155',
                      fontSize: '13px',
                      fontWeight: statusFilter === item.id ? 600 : 500,
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
                        background: statusFilter === item.id ? '#dbeafe' : '#f1f5f9',
                        color: statusFilter === item.id ? '#1d4ed8' : '#64748b',
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

            {/* Priority Queue Analytics (Review 1 Aggregation with HAVING >= 2) */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Queue Volume
                </div>
                <button
                  onClick={() => setShowSqlDetails(!showSqlDetails)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showSqlDetails ? 'Hide SQL' : 'View SQL'}
                </button>
              </div>

              {showSqlDetails && (
                <pre
                  style={{
                    fontSize: '10px',
                    color: '#475569',
                    fontFamily: 'var(--font-mono)',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
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
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    >
                      <span className={`badge badge-${(row.PRIORITY_LEVEL || row.priority_level || '').toLowerCase()}`}>
                        {row.PRIORITY_LEVEL || row.priority_level}
                      </span>
                      <span style={{ color: '#0f172a', fontWeight: 600, fontSize: '12px' }}>
                        {row.TOTAL_TICKETS_IN_QUEUE || row.total_tickets_in_queue} tickets
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No queues meet threshold</div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Table Area */}
          <section className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Filter Toolbar */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                background: '#ffffff',
              }}
            >
              <div>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                  Incident Registry
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                  ({filteredTickets.length} results)
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: '210px',
                      padding: '6px 10px 6px 30px',
                      fontSize: '12.5px',
                    }}
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
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>

                {/* Priority Filter */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  style={{ width: '130px', padding: '6px 10px', fontSize: '12px' }}
                >
                  <option value="ALL">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            {/* Table Content */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '13px' }}>Loading incident records...</div>
              </div>
            ) : error ? (
              <div
                style={{
                  margin: '20px',
                  padding: '16px',
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '6px',
                  color: '#b91c1c',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>Database Notice</div>
                <div style={{ fontSize: '12px' }}>{error}</div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                No tickets matching your current filter.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)', color: '#475569' }}>
                      <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ID</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Requester</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Priority</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Created</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Resolution Details</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Actions</th>
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
                      const notes = t.RESOLUTION_NOTES || t.resolution_notes || 'Pending Triage';

                      return (
                        <tr
                          key={ticketId}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background-color 0.1s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: '#2563eb', fontWeight: 600, fontSize: '12px' }}>
                            #{ticketId}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
                                  background: '#eff6ff',
                                  border: '1px solid #dbeafe',
                                  color: '#1d4ed8',
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {getInitials(reporterName)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>{reporterName}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>#{t.USER_ID || t.user_id}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ color: '#334155', fontWeight: 500 }}>
                              {CATEGORIES.find((c) => c.id === category)?.label || category}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span className={`badge badge-${priority.toLowerCase()}`}>{priority}</span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span className={`badge status-${status.toLowerCase()}`}>{status.replace('_', ' ')}</span>
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {createdDate}
                          </td>
                          <td style={{ padding: '12px 14px', maxWidth: '240px' }}>
                            <div
                              style={{
                                fontSize: '12px',
                                color: status === 'RESOLVED' ? '#15803d' : '#64748b',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={notes}
                            >
                              {notes}
                            </div>
                            {t.TECHNICIAN_NAME && (
                              <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px', fontWeight: 500 }}>
                                Tech: {t.TECHNICIAN_NAME}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {status === 'OPEN' && (
                                <button
                                  onClick={() => handleUpdateStatus(ticketId, 'IN_PROGRESS')}
                                  className="btn btn-secondary btn-xs"
                                  title="Mark as In Progress"
                                >
                                  Triage
                                </button>
                              )}
                              {(status === 'OPEN' || status === 'IN_PROGRESS') && (
                                <button
                                  onClick={() => setResolvingTicket(t)}
                                  className="btn btn-success btn-xs"
                                  title="Resolve ticket"
                                >
                                  Resolve
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteTicket(ticketId)}
                                className="btn btn-danger btn-xs"
                                title="Delete"
                              >
                                Delete
                              </button>
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
      </main>

      {/* New Ticket Modal */}
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
                  Requester
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: Number(e.target.value) })}
                  required
                >
                  {USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.dept})
                    </option>
                  ))}
                </select>
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

      {/* Resolution Modal */}
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
                  Assigned Technician
                </label>
                <select
                  value={resolveData.technician_id}
                  onChange={(e) => setResolveData({ ...resolveData, technician_id: Number(e.target.value) })}
                  required
                >
                  {TECHNICIANS.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} ({tech.dept})
                    </option>
                  ))}
                </select>
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
    </div>
  );
}
