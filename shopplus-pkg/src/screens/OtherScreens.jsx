import { useState, useEffect } from 'react';
import { api } from '../api';
import { TopBar, Toggle, Spinner, EmptyState, s } from '../components';

// ── Order Confirmation ────────────────────────────────────────────────────────

export function ConfirmScreen({ onNav, order, onClearCart }) {
  function handleHome() {
    onClearCart();
    onNav('home');
  }

  return (
    <div style={s.screen}>
      <TopBar title="Order confirmed" />
      <div style={{ ...s.body, alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16 }} className="scroll">
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--accent-bg)', border: '0.5px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Order placed!</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
            Your Walmart order has been submitted.{'\n'}
            {order?.fulfillment === 'pickup' ? 'Pick up at The Colony Supercenter.' : 'Delivery window confirmed.'}
          </div>
        </div>

        <div style={{ ...s.card, width: '100%', textAlign: 'left' }}>
          {[
            { label: 'Order #', val: order?.order_id || '—', mono: true },
            { label: 'Fulfillment', val: order?.fulfillment === 'pickup' ? 'Pickup' : 'Delivery' },
            order?.pickup_time && { label: 'Ready by', val: order.pickup_time },
            order?.pickup_location && { label: 'Location', val: order.pickup_location },
            order?.delivery_window && { label: 'Delivery', val: order.delivery_window },
            { label: 'Total', val: order?.total ? `$${order.total.toFixed(2)}` : '—', bold: true },
          ].filter(Boolean).map((row, i, arr) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: i < arr.length - 1 ? '0.5px solid var(--border)' : 'none',
              fontSize: 13,
            }}>
              <span style={{ color: 'var(--text2)' }}>{row.label}</span>
              <span style={{
                fontFamily: row.mono ? 'monospace' : 'inherit',
                fontWeight: row.bold ? 700 : 500,
                fontSize: row.mono ? 11 : 13,
              }}>{row.val}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
          Payment processed via Walmart checkout · Logged to purchase history
        </div>

        <button style={{ ...s.btnAccent, marginTop: 4 }} onClick={handleHome}>
          Back to home
        </button>
        <button style={s.btnSecondary} onClick={() => onNav('history')}>
          View purchase history
        </button>
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}

// ── Price History / Intelligence ──────────────────────────────────────────────

export function HistoryScreen({ onNav }) {
  const [events, setEvents] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [tab, setTab] = useState('events');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getSurgeEvents(30).catch(() => ({ events: [] })),
      api.getPurchases().catch(() => ({ purchases: [] })),
    ]).then(([e, p]) => {
      setEvents(e.events || []);
      setPurchases(p.purchases || []);
      setLoading(false);
    });
  }, []);

  const surgesBlocked = events.filter(e => e.event_type === 'surge').length;
  const totalSaved = purchases.reduce((sum, p) => sum + (p.savings || 0), 0);

  return (
    <div style={s.screen}>
      <TopBar title="Price intelligence" />

      <div style={{ padding: '10px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Surge events</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--red)' }}>{surgesBlocked}</div>
            <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>detected this period</div>
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Orders logged</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{purchases.length}</div>
            <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>total purchases</div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)' }}>
          {['events', 'purchases'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '8px', fontSize: 12, fontWeight: 500,
              background: 'transparent', color: tab === t ? 'var(--text)' : 'var(--text3)',
              borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
              transition: 'all 0.15s',
            }}>
              {t === 'events' ? 'Price events' : 'Purchases'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }} className="scroll">
        {loading ? <Spinner /> : tab === 'events' ? (
          events.length === 0
            ? <EmptyState icon="📊" title="No events yet" sub="Price events appear here when surges or deals are detected on your tracked products." />
            : events.map((e, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '10px 0',
                borderBottom: i < events.length - 1 ? '0.5px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                  background: e.event_type === 'surge' ? 'var(--red)' : e.event_type === 'deal' ? 'var(--accent)' : 'var(--blue)',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {e.event_type === 'surge' ? 'Surge' : 'Deal'} · {e.retailer}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                    ${e.current_price?.toFixed(2)} · {e.pct_change > 0 ? '+' : ''}{e.pct_change}% vs 30-day avg
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>
                    {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: e.event_type === 'surge' ? 'var(--red)' : 'var(--accent)',
                }}>
                  {e.event_type === 'surge' ? '+' : '−'}${Math.abs((e.current_price - e.avg_30d)).toFixed(2)}
                </div>
              </div>
            ))
        ) : (
          purchases.length === 0
            ? <EmptyState icon="🛒" title="No purchases yet" sub="Your order history will appear here after you place orders through Shop(+)Plus." />
            : purchases.map((p, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '10px 0',
                borderBottom: i < purchases.length - 1 ? '0.5px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--blue)', flexShrink: 0, marginTop: 5,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name || 'Purchase'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                    {p.retailer} · {p.fulfillment || 'pickup'} · qty {p.quantity || 1}
                  </div>
                  {p.order_id && (
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'monospace', marginTop: 3 }}>
                      {p.order_id}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>
                    {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  ${p.total?.toFixed(2) || (p.price * (p.quantity || 1)).toFixed(2)}
                </div>
              </div>
            ))
        )}
        <div style={{ height: 12 }} />
      </div>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function SettingsScreen({ onNav }) {
  const [surgeAlerts, setSurgeAlerts] = useState(true);
  const [dealAlerts, setDealAlerts] = useState(true);
  const [reorderReminders, setReorderReminders] = useState(true);
  const [workerUrl, setWorkerUrl] = useState(
    localStorage.getItem('shopplus_worker_url') || ''
  );
  const [editing, setEditing] = useState(!workerUrl);
  const [saved, setSaved] = useState(false);

  function saveWorkerUrl() {
    localStorage.setItem('shopplus_worker_url', workerUrl);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    window.location.reload();
  }

  return (
    <div style={s.screen}>
      <TopBar title="Settings" />
      <div style={s.body} className="scroll">

        {/* Worker URL */}
        <div style={s.sectionLabel}>Cloudflare Worker URL</div>
        <div style={s.card}>
          {editing ? (
            <>
              <input
                value={workerUrl}
                onChange={e => setWorkerUrl(e.target.value)}
                placeholder="https://shopplus-api.YOUR.workers.dev"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg3)', border: '0.5px solid var(--border2)',
                  color: 'var(--text)', fontSize: 12, fontFamily: 'monospace',
                  marginBottom: 10,
                }}
              />
              <button style={{ ...s.btnAccent, padding: '10px' }} onClick={saveWorkerUrl}>
                Save & reload
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Connected to</div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--accent)', wordBreak: 'break-all' }}>
                  {workerUrl || 'Not set'}
                </div>
              </div>
              <button style={{ fontSize: 12, color: 'var(--text2)', padding: '4px 8px', border: '0.5px solid var(--border)', borderRadius: 6 }}
                onClick={() => setEditing(true)}>
                Edit
              </button>
            </div>
          )}
          {saved && <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 8 }}>✓ Saved</div>}
        </div>

        {/* Retailer connections */}
        <div style={s.sectionLabel}>Retailers</div>
        <div style={s.card}>
          {[
            { name: 'Walmart', connected: true, color: 'var(--accent)' },
            { name: 'Target', connected: false },
            { name: 'Amazon', connected: false },
          ].map((r, i, arr) => (
            <div key={r.name} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 0',
              borderBottom: i < arr.length - 1 ? '0.5px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: r.connected ? 'var(--accent-bg)' : 'var(--bg3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                color: r.connected ? 'var(--accent)' : 'var(--text3)',
              }}>
                {r.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: r.connected ? 'var(--accent)' : 'var(--text3)', marginTop: 2 }}>
                  {r.connected ? 'Connected via Worker secrets' : 'Add credentials in CF Worker secrets'}
                </div>
              </div>
              <div style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                background: r.connected ? 'var(--accent-bg)' : 'var(--bg3)',
                color: r.connected ? 'var(--accent)' : 'var(--text3)',
                border: `0.5px solid ${r.connected ? 'var(--accent-border)' : 'var(--border)'}`,
              }}>
                {r.connected ? 'Active' : 'Add'}
              </div>
            </div>
          ))}
        </div>

        {/* Alert settings */}
        <div style={s.sectionLabel}>Alerts</div>
        <div style={s.card}>
          {[
            { label: 'Surge alerts', sub: 'Price rises > 15% above avg', val: surgeAlerts, set: setSurgeAlerts },
            { label: 'Deal alerts', sub: 'Price drops > 10% below avg', val: dealAlerts, set: setDealAlerts },
            { label: 'Reorder reminders', sub: 'Based on purchase frequency', val: reorderReminders, set: setReorderReminders },
          ].map((row, i, arr) => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 0',
              borderBottom: i < arr.length - 1 ? '0.5px solid var(--border)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{row.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{row.sub}</div>
              </div>
              <Toggle on={row.val} onChange={row.set} />
            </div>
          ))}
        </div>

        {/* JARVIS */}
        <div style={s.sectionLabel}>JARVIS integration</div>
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: 'var(--amber-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>JARVIS MCP endpoint</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                POST /mcp with X-Jarvis-Secret header
              </div>
            </div>
            <div style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
              background: 'var(--accent-bg)', color: 'var(--accent)',
              border: '0.5px solid var(--accent-border)',
            }}>Live</div>
          </div>
        </div>

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
