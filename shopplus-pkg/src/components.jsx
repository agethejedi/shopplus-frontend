import { useState } from 'react';

const s = {
  // Layout
  screen: {
    display: 'flex', flexDirection: 'column', height: '100%',
    background: 'var(--bg)', color: 'var(--text)',
  },
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px 10px',
    borderBottom: '0.5px solid var(--border)',
    flexShrink: 0,
  },
  topbarTitle: { fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 'var(--radius-sm)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text2)', fontSize: 20, cursor: 'pointer',
    background: 'transparent', border: 'none',
  },
  body: { flex: 1, padding: '14px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 },

  // Cards
  card: {
    background: 'var(--bg2)', border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '12px 14px',
  },

  // Badges
  badge: (color) => ({
    display: 'inline-block', fontSize: 10, fontWeight: 600,
    padding: '2px 7px', borderRadius: 20,
    background: `var(--${color}-bg)`,
    color: `var(--${color})`,
    border: `0.5px solid var(--${color}-border)`,
    letterSpacing: '0.02em',
  }),

  // Section label
  sectionLabel: {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: 'var(--text3)',
    padding: '4px 0 2px',
  },

  // Metric
  metric: {
    background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '10px 12px',
  },
  metricLabel: { fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 },
  metricVal: { fontSize: 22, fontWeight: 600 },
  metricSub: { fontSize: 10, color: 'var(--text2)', marginTop: 2 },

  // Buttons
  btnPrimary: {
    width: '100%', padding: '13px', borderRadius: 'var(--radius)',
    background: 'var(--text)', color: 'var(--bg)',
    fontSize: 14, fontWeight: 600, letterSpacing: '-0.2px',
    cursor: 'pointer', border: 'none',
    transition: 'opacity 0.15s',
  },
  btnSecondary: {
    width: '100%', padding: '12px', borderRadius: 'var(--radius)',
    background: 'transparent', color: 'var(--text)',
    fontSize: 14, fontWeight: 500,
    border: '0.5px solid var(--border2)',
    cursor: 'pointer',
  },
  btnAccent: {
    width: '100%', padding: '13px', borderRadius: 'var(--radius)',
    background: 'var(--accent)', color: '#000',
    fontSize: 14, fontWeight: 700,
    border: 'none', cursor: 'pointer',
  },

  // Product row
  productRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 0', borderBottom: '0.5px solid var(--border)',
  },
  productImg: {
    width: 40, height: 40, borderRadius: 'var(--radius-sm)',
    background: 'var(--bg3)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0, fontSize: 20,
  },
  productName: { fontSize: 13, fontWeight: 500, lineHeight: 1.3 },
  productMeta: { fontSize: 11, color: 'var(--text2)', marginTop: 2 },

  // Bottom nav
  bottomNav: {
    display: 'flex', borderTop: '0.5px solid var(--border)',
    padding: '8px 0 max(10px, env(safe-area-inset-bottom))',
    flexShrink: 0, background: 'var(--bg)',
  },
  bnItem: (active) => ({
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 3, fontSize: 10, cursor: 'pointer', padding: '2px 0',
    color: active ? 'var(--text)' : 'var(--text3)',
    fontWeight: active ? 600 : 400,
  }),
};

// ── Bottom Navigation ─────────────────────────────────────────────────────────

export function BottomNav({ active, onNav }) {
  const items = [
    { id: 'home', icon: '⌂', label: 'Home' },
    { id: 'scan', icon: '⬛', label: 'Scan' },
    { id: 'cart', icon: '◻', label: 'Cart' },
    { id: 'history', icon: '◈', label: 'History' },
    { id: 'settings', icon: '⚙', label: 'Settings' },
  ];

  return (
    <div style={s.bottomNav}>
      {items.map(item => (
        <button key={item.id} style={s.bnItem(active === item.id)} onClick={() => onNav(item.id)}>
          <NavIcon id={item.id} active={active === item.id} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function NavIcon({ id, active }) {
  const color = active ? 'var(--text)' : 'var(--text3)';
  const sz = 22;
  switch (id) {
    case 'home': return <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
    case 'scan': return <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>;
    case 'cart': return <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.99-1.83l1.18-9.27H6"/></svg>;
    case 'history': return <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
    case 'settings': return <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
    default: return null;
  }
}

// ── Top Bar ───────────────────────────────────────────────────────────────────

export function TopBar({ title, onBack, rightEl }) {
  return (
    <div style={s.topbar}>
      <div style={{ width: 36 }}>
        {onBack && (
          <button style={s.iconBtn} onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}
      </div>
      <span style={s.topbarTitle}>{title}</span>
      <div style={{ width: 36 }}>{rightEl}</div>
    </div>
  );
}

// ── Alert Banner ──────────────────────────────────────────────────────────────

export function AlertBanner({ type, title, desc, onTap }) {
  const color = type === 'surge' ? 'red' : 'accent';
  return (
    <div onClick={onTap} style={{
      background: `var(--${color}-bg)`, border: `0.5px solid var(--${color}-border)`,
      borderRadius: 'var(--radius)', padding: '10px 12px',
      display: 'flex', gap: 10, alignItems: 'flex-start', cursor: onTap ? 'pointer' : 'default',
    }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
        {type === 'surge' ? '↑' : '↓'}
      </span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: `var(--${color})` }}>{title}</div>
        <div style={{ fontSize: 11, color: `var(--${color})`, opacity: 0.8, marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── Metric Grid ───────────────────────────────────────────────────────────────

export function MetricGrid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={s.metric}>
          <div style={s.metricLabel}>{item.label}</div>
          <div style={{ ...s.metricVal, color: item.color || 'var(--text)' }}>{item.value}</div>
          {item.sub && <div style={s.metricSub}>{item.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ── Loading spinner ───────────────────────────────────────────────────────────

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '2px solid var(--border2)',
        borderTopColor: 'var(--text)',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────

export function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{
      width: 44, height: 26, borderRadius: 13,
      background: on ? 'var(--accent)' : 'var(--bg4)',
      border: `0.5px solid ${on ? 'var(--accent)' : 'var(--border2)'}`,
      position: 'relative', cursor: 'pointer', flexShrink: 0,
      transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: on ? '#000' : 'var(--text3)',
        transition: 'left 0.2s',
      }} />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>{sub}</div>
    </div>
  );
}

// ── Error message ─────────────────────────────────────────────────────────────

export function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background: 'var(--red-bg)', border: '0.5px solid var(--red-border)',
      borderRadius: 'var(--radius-sm)', padding: '10px 12px',
      fontSize: 12, color: 'var(--red)',
    }}>{msg}</div>
  );
}

export { s };
