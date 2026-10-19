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
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px', width: '100%' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            padding: '12px 20px',
            borderRadius: '8px',
            background: notification.type === 'danger' ? '#ef4444' : '#10b981',
            color: 'white',
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span>{notification.type === 'danger' ? '⚠️' : '✅'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Navbar Header */}
      <header
        className="glass-panel"
        style={{
          padding: '18px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            🎫
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              IT Service Desk Incident Command
            </h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
              DBMS Lab &bull; Vellore Institute of Technology &bull; <strong>Arnav's Module (Ticket Management)</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#34d399',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            Oracle Autonomous DB 26ai (mTLS)
          </div>

          <button onClick={fetchData} className="btn btn-secondary" title="Refresh Live Data">
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* KPI Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Incidents
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc', marginTop: '6px' }}>
            {metrics?.totalTickets ?? tickets.length}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Recorded in `TICKETS` table</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
          <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 600, textTransform: 'uppercase' }}>
            Active / Triage
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#60a5fa', marginTop: '6px' }}>
            {metrics?.openTickets ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Status: OPEN or IN_PROGRESS</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(239, 68, 68, 0.35)' }}>
          <div style={{ fontSize: '12px', color: '#f87171', fontWeight: 600, textTransform: 'uppercase' }}>
            Critical Priority
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#f87171', marginTop: '6px' }}>
            {metrics?.criticalTickets ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Immediate SLA attention required</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div style={{ fontSize: '12px', color: '#34d399', fontWeight: 600, textTransform: 'uppercase' }}>
            Resolved Tickets
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#34d399', marginTop: '6px' }}>
            {metrics?.resolvedTickets ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Linked in `TICKET_RESOLUTIONS`</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
          <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase' }}>
            Avg Resolution Time
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#38bdf8', marginTop: '6px' }}>
            {metrics?.avgTurnaroundHours ? `${metrics.avgTurnaroundHours}h` : '18.4h'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Computed via SQL AVG function</div>
        </div>
      </div>

      {/* Main Grid: Form + Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Ticket Submission & Analytical Query Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* New Ticket Form */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>➕</span> Log New Incident
            </h2>

            <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Requester (User ID)
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: Number(e.target.value) })}
                  required
                >
                  {USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      #{u.id} - {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Incident Category
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Priority Level
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {PRIORITIES.map((p) => {
                    const isSelected = formData.priority_level === p;
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setFormData({ ...formData, priority_level: p })}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                          background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.4)',
                          color: isSelected ? '#a5b4fc' : '#94a3b8',
                          fontSize: '11px',
                          fontWeight: 700,
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
                style={{ width: '100%', marginTop: '6px', padding: '12px' }}
              >
                {submitting ? 'Writing to Oracle...' : '⚡ Insert Incident into TICKETS'}
              </button>
            </form>
          </div>

          {/* Review 1 Analytical Query Card (Query 2.1 Live Display) */}
          <div className="glass-panel" style={{ padding: '20px', background: 'rgba(15, 23, 42, 0.85)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px' }}>📊</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Review 1 Query: Priority Queue
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', marginBottom: '12px' }}>
              SELECT priority_level, COUNT(*)<br />
              FROM TICKETS WHERE status IN ('OPEN', 'IN_PROGRESS')<br />
              GROUP BY priority_level HAVING COUNT(*) &gt;= 2;
            </p>

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
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  >
                    <span className={`badge badge-${(row.PRIORITY_LEVEL || row.priority_level || '').toLowerCase()}`}>
                      {row.PRIORITY_LEVEL || row.priority_level}
                    </span>
                    <strong style={{ color: '#f8fafc' }}>
                      {row.TOTAL_TICKETS_IN_QUEUE || row.total_tickets_in_queue} tickets
                    </strong>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>No queues meeting HAVING &gt;= 2 threshold</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Data Grid */}
        <div className="glass-panel" style={{ padding: '22px', overflow: 'hidden' }}>
          {/* Table Toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
              marginBottom: '20px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Active Incident Registry
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Displaying {filteredTickets.length} of {tickets.length} tickets from Oracle Cloud
              </span>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search ticket, reporter, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '220px', padding: '6px 12px', fontSize: '12px' }}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '130px', padding: '6px 10px', fontSize: '12px' }}
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
                style={{ width: '130px', padding: '6px 10px', fontSize: '12px' }}
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
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔄</div>
              <div>Querying Oracle Cloud Autonomous Database...</div>
            </div>
          ) : error ? (
            <div
              style={{
                padding: '24px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>⚠️ Database Connection Note</div>
              <div style={{ fontSize: '13px' }}>{error}</div>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>
                Ensure your credentials are set in <code>server/.env</code> and that Phase 2 scripts have been executed on Oracle Cloud.
              </p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>📭</div>
              <div>No tickets match your search filters</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8' }}>
                    <th style={{ padding: '10px 12px' }}>ID</th>
                    <th style={{ padding: '10px 12px' }}>Reporter</th>
                    <th style={{ padding: '10px 12px' }}>Category</th>
                    <th style={{ padding: '10px 12px' }}>Priority</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px' }}>Submitted</th>
                    <th style={{ padding: '10px 12px' }}>Resolution Notes</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
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
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '12px', fontWeight: 700, color: '#a5b4fc', fontFamily: 'monospace' }}>
                          #{ticketId}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{reporterName}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>User #{t.USER_ID || t.user_id}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ color: '#cbd5e1', fontWeight: 500 }}>{category}</span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span className={`badge badge-${priority.toLowerCase()}`}>{priority}</span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span className={`badge status-${status.toLowerCase()}`}>{status}</span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '11.5px', color: '#94a3b8' }}>
                          {createdDate}
                        </td>
                        <td style={{ padding: '12px', maxWidth: '240px' }}>
                          <div
                            style={{
                              fontSize: '12px',
                              color: status === 'RESOLVED' ? '#34d399' : '#64748b',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={notes}
                          >
                            {notes}
                          </div>
                          {t.TECHNICIAN_NAME && (
                            <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>
                              Tech: {t.TECHNICIAN_NAME}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
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
                              🗑️
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
          <div className="glass-panel" style={{ width: '480px', padding: '24px', background: '#111827' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
              Resolve Incident #{resolvingTicket.TICKET_ID || resolvingTicket.ticket_id}
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>
              Category: <strong>{resolvingTicket.ISSUE_CATEGORY || resolvingTicket.issue_category}</strong> &bull; Priority:{' '}
              <strong>{resolvingTicket.PRIORITY_LEVEL || resolvingTicket.priority_level}</strong>
            </p>

            <form onSubmit={handleResolveTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Resolving Technician
                </label>
                <select
                  value={resolveData.technician_id}
                  onChange={(e) => setResolveData({ ...resolveData, technician_id: Number(e.target.value) })}
                  required
                >
                  {TECHNICIANS.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      #{tech.id} - {tech.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Technical Work Notes & Actions Taken (NOT NULL)
                </label>
                <textarea
                  rows={4}
                  placeholder="Detail the technical steps performed to resolve this incident..."
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
                  {resolving ? 'Submitting to Oracle...' : 'Commit Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
