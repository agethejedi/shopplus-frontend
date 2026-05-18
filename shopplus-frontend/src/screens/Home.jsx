import { useState, useEffect } from 'react';
import { api } from '../api';
import { AlertBanner, MetricGrid, Spinner, s } from '../components';

export default function HomeScreen({ onNav, cartCount }) {
  const [dash, setDash] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDashboard().catch(() => null),
      api.getSurgeEvents(10).catch(() => ({ events: [] })),
    ]).then(([d, e]) => {
      setDash(d);
      setEvents(e?.events || []);
      setLoading(false);
    });
  }, []);

  const surges = events.filter(e => e.event_type === 'surge').slice(0, 2);
  const deals = events.filter(e => e.event_type === 'deal').slice(0, 2);

  return (
    <div style={s.screen}>
      {/* Header */}
      <div style={{ ...s.topbar, padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30,
            background: 'var(--text)', borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--bg)">
              <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6L12 2z"/>
              <path d="M9 12l2 2 4-4" stroke="var(--bg)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.4px', lineHeight: 1 }}>
              Shop<span style={{ color: 'var(--accent)' }}>(+)</span>Plus
            </div>
          </div>
        </div>
        <button style={s.iconBtn} onClick={() => onNav('settings')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>
      </div>

      <div style={s.body} className="scroll">
        {loading ? <Spinner /> : (
          <>
            {/* Alert banners */}
            {surges.map((e, i) => (
              <AlertBanner key={i} type="surge"
                title={`Surge — ${e.retailer} +${e.pct_change}%`}
                desc={`Current $${e.current_price?.toFixed(2)} vs avg $${e.avg_30d?.toFixed(2)}`}
              />
            ))}
            {deals.map((e, i) => (
              <AlertBanner key={i} type="deal"
                title={`Price drop at ${e.retailer}`}
                desc={`Now $${e.current_price?.toFixed(2)} — ${Math.abs(e.pct_change)}% below avg`}
                onTap={() => onNav('scan')}
              />
            ))}

            {/* Metrics */}
            <MetricGrid items={[
              { label: 'Tracked items', value: dash?.tracked_products ?? '—', sub: 'with price alerts' },
              {
                label: 'Saved this month',
                value: dash?.estimated_savings != null ? `$${dash.estimated_savings.toFixed(2)}` : '—',
                color: 'var(--accent)',
                sub: 'vs avg price paid',
              },
              {
                label: 'Orders placed',
                value: dash?.purchases_this_month ?? '—',
                sub: 'this month',
              },
              {
                label: 'Spent this month',
                value: dash?.total_spent_this_month != null ? `$${dash.total_spent_this_month.toFixed(2)}` : '—',
                sub: 'across all retailers',
              },
            ]} />

            {/* Quick actions */}
            <div style={{ ...s.sectionLabel }}>Quick actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button style={{
                ...s.btnAccent, padding: '13px 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }} onClick={() => onNav('scan')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><line x1="3" y1="12" x2="21" y2="12"/>
                </svg>
                Scan item
              </button>
              <button style={{
                ...s.btnSecondary, padding: '13px 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }} onClick={() => onNav('cart')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.99-1.83l1.18-9.27H6"/>
                </svg>
                Cart {cartCount > 0 ? `(${cartCount})` : ''}
              </button>
            </div>

            {/* Recent price events */}
            {events.length > 0 && (
              <>
                <div style={s.sectionLabel}>Recent price events</div>
                <div style={s.card}>
                  {events.slice(0, 5).map((e, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      padding: '9px 0',
                      borderBottom: i < 4 ? '0.5px solid var(--border)' : 'none',
                    }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                        background: e.event_type === 'surge' ? 'var(--red)' : 'var(--accent)',
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>
                          {e.event_type === 'surge' ? 'Surge' : 'Deal'} at {e.retailer}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                          ${e.current_price?.toFixed(2)} · {e.pct_change > 0 ? '+' : ''}{e.pct_change}% vs avg
                        </div>
                      </div>
                      <div style={{
                        fontSize: 12, fontWeight: 600,
                        color: e.event_type === 'surge' ? 'var(--red)' : 'var(--accent)',
                      }}>
                        {e.event_type === 'surge' ? '+' : '−'}${Math.abs(((e.current_price - e.avg_30d))).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Tip when empty */}
            {events.length === 0 && !loading && (
              <div style={{
                ...s.card, textAlign: 'center', padding: '24px',
                color: 'var(--text2)', fontSize: 13, lineHeight: 1.6,
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No products tracked yet</div>
                Scan a barcode to start tracking prices and detecting surges.
              </div>
            )}

            <div style={{ height: 8 }} />
          </>
        )}
      </div>
    </div>
  );
}
