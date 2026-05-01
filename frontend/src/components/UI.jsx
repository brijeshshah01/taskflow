import { useState } from 'react';

// Button
export function Button({ children, variant = 'primary', size = 'md', loading, disabled, onClick, type = 'button', style }) {
  const styles = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: 'var(--font-display)', fontWeight: 600,
    border: 'none', borderRadius: 'var(--radius)', cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s', opacity: disabled || loading ? 0.6 : 1,
    padding: size === 'sm' ? '6px 14px' : size === 'lg' ? '12px 28px' : '9px 20px',
    fontSize: size === 'sm' ? '13px' : size === 'lg' ? '15px' : '14px',
    ...(variant === 'primary' ? {
      background: 'linear-gradient(135deg, var(--accent), #9b6df7)',
      color: '#fff',
      boxShadow: '0 0 20px var(--accent-glow)',
    } : variant === 'ghost' ? {
      background: 'transparent', color: 'var(--text2)',
      border: '1px solid var(--border)',
    } : variant === 'danger' ? {
      background: 'rgba(239,68,68,0.15)', color: 'var(--red)',
      border: '1px solid rgba(239,68,68,0.3)',
    } : {
      background: 'var(--bg3)', color: 'var(--text)',
      border: '1px solid var(--border)',
    }),
    ...style
  };
  return (
    <button type={type} style={styles} onClick={onClick} disabled={disabled || loading}>
      {loading ? <Spinner size={14} /> : null}
      {children}
    </button>
  );
}

// Input
export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>{label}</label>}
      <input style={{
        background: 'var(--bg3)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', padding: '9px 14px', color: 'var(--text)', fontSize: 14,
        outline: 'none', transition: 'border-color 0.2s',
        width: '100%',
      }}
        onFocus={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)'}
        {...props}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}

// Textarea
export function Textarea({ label, error, rows = 3, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>{label}</label>}
      <textarea style={{
        background: 'var(--bg3)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', padding: '9px 14px', color: 'var(--text)', fontSize: 14,
        outline: 'none', resize: 'vertical', rows,
        fontFamily: 'var(--font)', width: '100%',
      }}
        rows={rows}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
        {...props}
      />
    </div>
  );
}

// Select
export function Select({ label, children, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>{label}</label>}
      <select style={{
        background: 'var(--bg3)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', padding: '9px 14px', color: 'var(--text)', fontSize: 14,
        outline: 'none', width: '100%', cursor: 'pointer',
      }} {...props}>
        {children}
      </select>
    </div>
  );
}

// Card
export function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px',
      transition: 'border-color 0.2s, transform 0.2s',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}
      onMouseEnter={onClick ? e => { e.currentTarget.style.borderColor = 'var(--accent)'; } : undefined}
      onMouseLeave={onClick ? e => { e.currentTarget.style.borderColor = 'var(--border)'; } : undefined}
    >
      {children}
    </div>
  );
}

// Modal
export function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, backdropFilter: 'blur(4px)',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: width,
        maxHeight: '90vh', overflowY: 'auto',
        animation: 'fadeIn 0.2s ease',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text3)',
            fontSize: 20, lineHeight: 1, cursor: 'pointer', padding: '2px 6px',
            borderRadius: 6,
          }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// Spinner
export function Spinner({ size = 20, color = 'var(--accent)' }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid transparent`,
      borderTop: `2px solid ${color}`, borderRadius: '50%',
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}

// Badge
export function Badge({ children, color = 'var(--accent)', bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600,
      color, background: bg || color + '22',
      border: `1px solid ${color}44`,
    }}>
      {children}
    </span>
  );
}

// Avatar
export function Avatar({ name, color = '#6366f1', size = 32 }) {
  const initials = name?.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, fontFamily: 'var(--font-display)',
      flexShrink: 0, userSelect: 'none',
    }}>
      {initials}
    </div>
  );
}

// Priority Badge
export function PriorityBadge({ priority }) {
  const map = {
    urgent: { label: '🔴 Urgent', color: 'var(--red)' },
    high: { label: '🟠 High', color: 'var(--orange)' },
    medium: { label: '🟡 Medium', color: 'var(--yellow)' },
    low: { label: '⚪ Low', color: 'var(--text3)' },
  };
  const { label, color } = map[priority] || map.medium;
  return <Badge color={color}>{label}</Badge>;
}

// Status Badge
export function StatusBadge({ status }) {
  const map = {
    todo: { label: 'To Do', color: 'var(--text2)' },
    in_progress: { label: 'In Progress', color: 'var(--blue)' },
    review: { label: 'In Review', color: 'var(--yellow)' },
    done: { label: 'Done', color: 'var(--green)' },
  };
  const { label, color } = map[status] || map.todo;
  return <Badge color={color}>{label}</Badge>;
}

// Alert
export function Alert({ message, type = 'error', onClose }) {
  if (!message) return null;
  const color = type === 'error' ? 'var(--red)' : type === 'success' ? 'var(--green)' : 'var(--yellow)';
  return (
    <div style={{
      background: color + '18', border: `1px solid ${color}44`,
      borderRadius: 'var(--radius)', padding: '10px 16px',
      color, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span>{message}</span>
      {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color, cursor: 'pointer', marginLeft: 8 }}>×</button>}
    </div>
  );
}

// Empty state
export function EmptyState({ icon, title, desc, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text3)' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon || '📭'}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>{title}</div>
      {desc && <div style={{ fontSize: 14, marginBottom: 20 }}>{desc}</div>}
      {action}
    </div>
  );
}

// Stat card
export function StatCard({ label, value, icon, color = 'var(--accent)' }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px 24px',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: color + '22', color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', color }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

// Confirm dialog
export function Confirm({ message, onConfirm, onCancel, danger }) {
  return (
    <Modal title="Confirm Action" onClose={onCancel} width={380}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <p style={{ color: 'var(--text2)', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </Modal>
  );
}
