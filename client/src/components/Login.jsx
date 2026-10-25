import React, { useState } from 'react';

const DEMO_PERSONAS = [
  {
    key: 'USER',
    label: '👤 Demo User: Aarav',
    badge: 'Submitter',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@company.com',
    password: 'user',
    dept: 'Engineering',
    roleTag: 'USER Mode',
    accent: '#2563eb',
    bg: '#eff6ff'
  },
  {
    key: 'ENGINEER',
    label: '🛠️ Demo Engineer: Vikram',
    badge: 'Technician',
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@company.com',
    password: 'engineer',
    dept: 'IT Support',
    roleTag: 'ENGINEER Mode',
    accent: '#d97706',
    bg: '#fffbeb'
  },
  {
    key: 'ADMIN',
    label: '🛡️ Demo Admin: Suresh',
    badge: 'Superuser',
    name: 'Suresh Menon',
    email: 'suresh.menon@company.com',
    password: 'admin',
    dept: 'System Admin',
    roleTag: 'ADMIN Mode',
    accent: '#7c3aed',
    bg: '#f5f3ff'
  }
];

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedDemoKey, setSelectedDemoKey] = useState(null);

  const handleSelectDemo = (persona) => {
    setEmail(persona.email);
    setPassword(persona.password);
    setSelectedDemoKey(persona.key);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both corporate email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed. Please check credentials.');
      }

      // Persist session into localStorage
      localStorage.setItem('currentUser', JSON.stringify(data.data));
      if (onLoginSuccess) {
        onLoginSuccess(data.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to connect to authentication service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '24px'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '36px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          borderRadius: '12px',
          background: '#ffffff'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              fontSize: '28px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 8px 16px -2px rgba(37, 99, 235, 0.35)'
            }}
          >
            🏢
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            IT Service Desk
          </h1>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#2563eb', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Enterprise Single Sign-On
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            Oracle Cloud Autonomous Database (26ai) ATP Connected
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#991b1b',
              fontSize: '12.5px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}
          >
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Corporate Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSelectedDemoKey(null);
              }}
              placeholder="e.g. suresh.menon@company.com"
              required
              autoFocus
              style={{ fontSize: '13.5px', padding: '9px 12px' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', margin: 0 }}>
                Role Password
              </label>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Hint: <code>user</code> / <code>engineer</code> / <code>admin</code>
              </span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setSelectedDemoKey(null);
              }}
              placeholder="Enter role security password"
              required
              style={{ fontSize: '13.5px', padding: '9px 12px' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              marginTop: '6px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Authenticating with Oracle ATP...' : 'Sign In to Portal →'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0 18px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Quick Demo Login (Viva Preset)
          </span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* 1-Click Demo Login Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {DEMO_PERSONAS.map((p) => {
            const isSelected = selectedDemoKey === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => handleSelectDemo(p)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: isSelected ? `2px solid ${p.accent}` : '1px solid #e2e8f0',
                  background: isSelected ? p.bg : '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{p.label}</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>({p.name})</span>
                </div>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: p.bg,
                    color: p.accent,
                    border: `1px solid ${p.accent}40`
                  }}
                >
                  Pass: {p.password}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '22px' }}>
          <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: 0 }}>
            Corporate IT Incident &amp; Personnel Management System
          </p>
        </div>
      </div>
    </div>
  );
}
