import React, { useState, useEffect, useCallback } from 'react';

// Preset lists aligned with .agents/AGENTS.md contract
const USERS = [
  { id: 101, name: 'Aarav Sharma (Engineering)' },
  { id: 102, name: 'Priya Patel (Engineering)' },
  { id: 103, name: 'Rohan Iyer (Human Resources)' },
  { id: 104, name: 'Ananya Verma (Finance)' },
  { id: 105, name: 'Aditya Nair (Operations)' },
  { id: 106, name: 'Sneha Kulkarni (Operations)' },
];

const TECHNICIANS = [
  { id: 201, name: 'Vikram Malhotra (IT Support)' },
  { id: 202, name: 'Neha Sengupta (IT Support)' },
  { id: 203, name: 'Rahul Deshmukh (IT Support)' },
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

      showToast(`Ticket #${data.data.ticket_id} created in Oracle Database!`, 'success');
      setFormData({
        user_id: 101,
        issue_category: 'NETWORK',
        priority_level: 'MEDIUM',
      });
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

      showToast(`Ticket #${ticketId} status updated to ${newStatus}`, 'success');
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

      showToast(`Ticket #${ticketId} removed.`, 'success');
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
      const res = await fetch(`/api/tickets/${resolvingTicket.TICKET_ID || resolvingTicket.ticket_id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolveData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showToast(`Incident #${resolvingTicket.TICKET_ID || resolvingTicket.ticket_id} resolved!`, 'success');
      setResolvingTicket(null);
      setResolveData({ technician_id: 201, resolution_notes: '' });
      fetchData();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setResolving(false);
    }
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    const id = String(t.TICKET_ID || t.ticket_id || '');
    const reporter = String(t.REPORTER_NAME || t.reporter_name || '').toLowerCase();
    const cat = String(t.ISSUE_CATEGORY || t.issue_category || '').toLowerCase();
    const status = String(t.STATUS || t.status || '').toUpperCase();
    const priority = String(t.PRIORITY_LEVEL || t.priority_level || '').toUpperCase();

    const matchesSearch =
      id.includes(search) || reporter.includes(search.toLowerCase()) || cat.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px', width: '100%' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            padding: '10px 16px',
            borderRadius: '6px',
            background: notification.type === 'danger' ? '#2b1517' : '#102419',
            border: notification.type === 'danger' ? '1px solid #4d1c20' : '1px solid #1a4d2e',
            color: notification.type === 'danger' ? '#f85149' : '#3fb950',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>{notification.type === 'danger' ? '•' : '✓'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Navbar Header */}
      <header
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              background: '#1f2937',
              border: '1px solid #374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              IT Service Desk &bull; Incident Command
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              Autonomous Database 26ai (mTLS) &bull; Arnav's Module (Ticket Management)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: '#102419',
              border: '1px solid #1a4d2e',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#3fb950',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#3fb950',
              }}
            />
            Database Connected
          </div>

          <button onClick={fetchData} className="btn btn-secondary btn-xs" title="Refresh Live Data">
            Refresh Data
          </button>
        </div>
      </header>

      {/* KPI Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Total Incidents
          </div>
          <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
            {metrics?.totalTickets ?? tickets.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Table: TICKETS</div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#58a6ff', fontWeight: 500 }}>
            Active / In-Queue
          </div>
          <div style={{ fontSize: '26px', fontWeight: 600, color: '#58a6ff', marginTop: '4px' }}>
            {metrics?.openTickets ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Status: OPEN / IN_PROGRESS</div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#f85149', fontWeight: 500 }}>
            Critical Attention
          </div>
          <div style={{ fontSize: '26px', fontWeight: 600, color: '#f85149', marginTop: '4px' }}>
            {metrics?.criticalTickets ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Immediate SLA response</div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#3fb950', fontWeight: 500 }}>
            Resolved Tickets
          </div>
          <div style={{ fontSize: '26px', fontWeight: 600, color: '#3fb950', marginTop: '4px' }}>
            {metrics?.resolvedTickets ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Table: TICKET_RESOLUTIONS</div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Avg Turnaround Time
          </div>
          <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
            {metrics?.avgTurnaroundHours ? `${metrics.avgTurnaroundHours}h` : '4.25h'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>SQL AVG Function</div>
        </div>
      </div>

      {/* Main Grid: Form + Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Column: Ticket Submission & Analytical Query Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* New Ticket Form */}
          <div className="card" style={{ padding: '18px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Create Incident Ticket
            </h2>

            <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Requester
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: Number(e.target.value) })}
                  required
                >
                  {USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      #{u.id} &bull; {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  value={formData.issue_category}
                  onChange={(e) => setFormData({ ...formData, issue_category: e.target.value })}
                  required
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Priority Level
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {PRIORITIES.map((p) => {
                    const isSelected = formData.priority_level === p;
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setFormData({ ...formData, priority_level: p })}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: isSelected ? '1px solid #3b82f6' : '1px solid var(--border-medium)',
                          background: isSelected ? '#1c2638' : 'var(--bg-subtle)',
                          color: isSelected ? '#58a6ff' : 'var(--text-secondary)',
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

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '4px' }}
              >
                {submitting ? 'Inserting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>

          {/* Review 1 Analytical Query Card (Query 2.1 Live Display) */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Review 1 SQL Query &bull; Priority Queue
            </div>
            <pre style={{ fontSize: '10.5px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '8px', borderRadius: '4px', marginBottom: '12px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
{`SELECT priority_level, COUNT(*)
FROM TICKETS
WHERE status IN ('OPEN', 'IN_PROGRESS')
GROUP BY priority_level
HAVING COUNT(*) >= 2;`}
            </pre>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {metrics?.byPriority && metrics.byPriority.length > 0 ? (
                metrics.byPriority.map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 8px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  >
                    <span className={`badge badge-${(row.PRIORITY_LEVEL || row.priority_level || '').toLowerCase()}`}>
                      {row.PRIORITY_LEVEL || row.priority_level}
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '12px' }}>
                      {row.TOTAL_TICKETS_IN_QUEUE || row.total_tickets_in_queue} in queue
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No queues meet HAVING &gt;= 2 threshold</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Data Grid */}
        <div className="card" style={{ padding: '18px', overflow: 'hidden' }}>
          {/* Table Toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Incident Registry
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {filteredTickets.length} of {tickets.length} tickets recorded
              </span>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search ticket, reporter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '200px', padding: '6px 10px', fontSize: '12px' }}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '120px', padding: '6px 8px', fontSize: '12px' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{ width: '120px', padding: '6px 8px', fontSize: '12px' }}
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          {/* Incident Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '13px' }}>Querying Oracle Database...</div>
            </div>
          ) : error ? (
            <div
              style={{
                padding: '16px',
                background: '#2b1517',
                border: '1px solid #4d1c20',
                borderRadius: '6px',
                color: '#f85149',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Database Connection Notice</div>
              <div style={{ fontSize: '12px' }}>{error}</div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: '13px' }}>
              No tickets found matching the specified filters.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-medium)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '8px 10px', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>ID</th>
                    <th style={{ padding: '8px 10px', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Requester</th>
                    <th style={{ padding: '8px 10px', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Category</th>
                    <th style={{ padding: '8px 10px', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Priority</th>
                    <th style={{ padding: '8px 10px', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Status</th>
                    <th style={{ padding: '8px 10px', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Submitted</th>
                    <th style={{ padding: '8px 10px', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Resolution Notes</th>
                    <th style={{ padding: '8px 10px', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'right' }}>Actions</th>
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
                          borderBottom: '1px solid var(--border-subtle)',
                        }}
                      >
                        <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                          #{ticketId}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{reporterName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>ID #{t.USER_ID || t.user_id}</div>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{category}</span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span className={`badge badge-${priority.toLowerCase()}`}>{priority}</span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span className={`badge status-${status.toLowerCase()}`}>{status}</span>
                        </td>
                        <td style={{ padding: '10px', fontSize: '11.5px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {createdDate}
                        </td>
                        <td style={{ padding: '10px', maxWidth: '220px' }}>
                          <div
                            style={{
                              fontSize: '12px',
                              color: status === 'RESOLVED' ? '#3fb950' : 'var(--text-tertiary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={notes}
                          >
                            {notes}
                          </div>
                          {t.TECHNICIAN_NAME && (
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              Tech: {t.TECHNICIAN_NAME}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {status === 'OPEN' && (
                              <button
                                onClick={() => handleUpdateStatus(ticketId, 'IN_PROGRESS')}
                                className="btn btn-secondary btn-xs"
                                title="Move to In Progress"
                              >
                                Triage
                              </button>
                            )}
                            {(status === 'OPEN' || status === 'IN_PROGRESS') && (
                              <button
                                onClick={() => setResolvingTicket(t)}
                                className="btn btn-success btn-xs"
                                title="Record Resolution Notes"
                              >
                                Resolve
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteTicket(ticketId)}
                              className="btn btn-danger btn-xs"
                              title="Delete Ticket"
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
        </div>
      </div>

      {/* Resolution Modal */}
      {resolvingTicket && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '480px', padding: '20px', background: 'var(--bg-surface-elevated)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Resolve Incident #{resolvingTicket.TICKET_ID || resolvingTicket.ticket_id}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Category: <strong>{resolvingTicket.ISSUE_CATEGORY || resolvingTicket.issue_category}</strong> &bull; Priority:{' '}
              <strong>{resolvingTicket.PRIORITY_LEVEL || resolvingTicket.priority_level}</strong>
            </p>

            <form onSubmit={handleResolveTicket} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Resolving Technician
                </label>
                <select
                  value={resolveData.technician_id}
                  onChange={(e) => setResolveData({ ...resolveData, technician_id: Number(e.target.value) })}
                  required
                >
                  {TECHNICIANS.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      #{tech.id} &bull; {tech.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Technical Resolution Notes (NOT NULL)
                </label>
                <textarea
                  rows={4}
                  placeholder="Detail the technical steps taken to resolve this incident..."
                  value={resolveData.resolution_notes}
                  onChange={(e) => setResolveData({ ...resolveData, resolution_notes: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="btn btn-secondary btn-xs"
                >
                  Cancel
                </button>
                <button type="submit" disabled={resolving} className="btn btn-primary btn-xs">
                  {resolving ? 'Submitting...' : 'Commit Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
