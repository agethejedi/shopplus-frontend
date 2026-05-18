import { useState, useEffect } from 'react';
import { api } from '../api';
import { TopBar, Toggle, Spinner, ErrorMsg, s } from '../components';

const RETAILERS = ['walmart', 'target', 'amazon'];
const RETAILER_LABELS = { walmart: 'Walmart', target: 'Target', amazon: 'Amazon' };

export default function ProductScreen({ onNav, onBack, product, upc, onAddToCart }) {
  const [compare, setCompare] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertOn, setAlertOn] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addedMsg, setAddedMsg] = useState('');
  const [error, setError] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState('walmart');

  useEffect(() => {
    if (!product) return;
    Promise.all([
      api.comparePrices(upc, product.name).catch(() => null),
      upc ? api.getPrices(upc).catch(() => null) : Promise.resolve(null),
    ]).then(([c, h]) => {
      setCompare(c);
      setHistory(h);
      if (c?.best_retailer) setSelectedRetailer(c.best_retailer);
      setLoading(false);
    });
  }, [product, upc]);

  async function handleAddToCart() {
    setAdding(true);
    setError('');
    try {
      await api.addToCart(upc, product?.name, selectedRetailer, 1);
      onAddToCart({ product, upc, retailer: selectedRetailer, price: compare?.prices?.[selectedRetailer]?.price });
      setAddedMsg(`Added to ${RETAILER_LABELS[selectedRetailer]} cart`);
      setTimeout(() => setAddedMsg(''), 3000);
    } catch (e) {
      setError(e.message);
    }
    setAdding(false);
  }

  async function handleSetAlert(on) {
    setAlertOn(on);
    if (on && upc) {
      await api.setAlert(upc, {
        surge_threshold_pct: 15,
        deal_threshold_pct: 10,
        preferred_retailer: selectedRetailer,
      }).catch(() => {});
    } else if (!on && upc) {
      await api.deleteAlert(upc).catch(() => {});
    }
  }

  const prices = compare?.prices || {};
  const yourAvg = compare?.your_avg_paid;

  function statusColor(status) {
    if (status === 'surge') return 'var(--red)';
    if (status === 'deal') return 'var(--accent)';
    return 'var(--text2)';
  }
  function statusLabel(status, pct) {
    if (status === 'surge') return `↑ +${pct}%`;
    if (status === 'deal') return `↓ ${pct}%`;
    return 'avg';
  }

  if (!product) {
    return (
      <div style={s.screen}>
        <TopBar title="Product" onBack={onBack} />
        <div style={s.body}>
          <ErrorMsg msg="No product loaded. Go back and scan something." />
        </div>
      </div>
    );
  }

  return (
    <div style={s.screen}>
      <TopBar title="Product" onBack={onBack} />

      <div style={s.body} className="scroll">
        {/* Product identity card */}
        <div style={s.card}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--radius-sm)',
              background: 'var(--bg3)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 28, flexShrink: 0,
            }}>
              {product.image_url
                ? <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                : '📦'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, marginBottom: 3 }}>
                {product.name || 'Unknown product'}
              </div>
              {product.brand && (
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{product.brand}</div>
              )}
              {product.size && (
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{product.size}</div>
              )}
              {upc && (
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'monospace', marginTop: 4 }}>
                  UPC: {upc}
                </div>
              )}
              {product.from_photo && (
                <div style={{ fontSize: 10, color: 'var(--blue)', marginTop: 4 }}>
                  Identified by AI vision
                  {product.confidence && ` · ${product.confidence} confidence`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Your average */}
        {yourAvg != null && (
          <div style={{
            ...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your avg paid</div>
              <div style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>${yourAvg.toFixed(2)}</div>
            </div>
            {history?.prices?.walmart && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Price trend</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', marginTop: 2 }}>
                  {history.prices.walmart.history?.length > 1 ? '↓ trending down' : 'Tracking...'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Price comparison */}
        <div style={s.sectionLabel}>Price comparison</div>
        {loading ? <Spinner /> : (
          <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '0.5px solid var(--border)' }}>
            {Object.keys(prices).length === 0 ? (
              <div style={{ padding: '16px', color: 'var(--text2)', fontSize: 13, textAlign: 'center' }}>
                No live prices yet — Railway agent fetching...
              </div>
            ) : (
              RETAILERS.map((retailer, i) => {
                const info = prices[retailer];
                if (!info) return null;
                const isBest = compare?.best_retailer === retailer;
                const isSelected = selectedRetailer === retailer;
                return (
                  <div key={retailer} onClick={() => setSelectedRetailer(retailer)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 14px',
                    borderBottom: i < RETAILERS.length - 1 ? '0.5px solid var(--border)' : 'none',
                    background: isSelected ? 'var(--accent-bg)' : 'var(--bg2)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}>
                    {isSelected && (
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--accent)', flexShrink: 0,
                      }} />
                    )}
                    {!isSelected && <div style={{ width: 6 }} />}
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
                      {RETAILER_LABELS[retailer]}
                    </span>
                    {isBest && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 6px',
                        background: 'var(--accent-bg)', color: 'var(--accent)',
                        border: '0.5px solid var(--accent-border)', borderRadius: 10,
                        letterSpacing: '0.03em',
                      }}>BEST</span>
                    )}
                    {info.pct_vs_avg != null && (
                      <span style={{ fontSize: 11, color: statusColor(info.status) }}>
                        {statusLabel(info.status, info.pct_vs_avg)}
                      </span>
                    )}
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                      ${info.price?.toFixed(2)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Alert toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 0',
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Price alert</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
              Notify on surge ({'>'} 15%) or deal ({'>'} 10% off)
            </div>
          </div>
          <Toggle on={alertOn} onChange={handleSetAlert} />
        </div>

        <ErrorMsg msg={error} />

        {addedMsg && (
          <div style={{
            background: 'var(--accent-bg)', border: '0.5px solid var(--accent-border)',
            borderRadius: 'var(--radius-sm)', padding: '10px 14px',
            fontSize: 13, color: 'var(--accent)', fontWeight: 500, textAlign: 'center',
          }}>
            ✓ {addedMsg}
          </div>
        )}

        {/* Add to cart */}
        <button
          style={{ ...s.btnAccent, opacity: adding ? 0.6 : 1 }}
          onClick={handleAddToCart}
          disabled={adding || Object.keys(prices).length === 0}
        >
          {adding ? 'Adding...' : `Add to ${RETAILER_LABELS[selectedRetailer] || 'cart'}`}
        </button>

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
