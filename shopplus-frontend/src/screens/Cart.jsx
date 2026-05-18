import { useState } from 'react';
import { api } from '../api';
import { TopBar, ErrorMsg, s } from '../components';

export default function CartScreen({ onNav, cartItems, onUpdateCart, onOrderPlaced }) {
  const [fulfillment, setFulfillment] = useState('pickup');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const subtotal = cartItems.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);
  const tax = subtotal * 0.0825; // Texas sales tax
  const deliveryFee = fulfillment === 'delivery' ? 7.95 : 0;
  const total = subtotal + tax + deliveryFee;

  function updateQty(idx, delta) {
    const updated = cartItems.map((item, i) => {
      if (i !== idx) return item;
      const qty = item.quantity + delta;
      return qty <= 0 ? null : { ...item, quantity: qty };
    }).filter(Boolean);
    onUpdateCart(updated);
  }

  async function handlePlaceOrder() {
    if (cartItems.length === 0) return;
    setPlacing(true);
    setError('');
    try {
      const result = await api.placeOrder('walmart', fulfillment);
      onOrderPlaced(result.order);
      onNav('confirm');
    } catch (e) {
      setError(e.message || 'Order failed — check Railway agent is running');
      setPlacing(false);
    }
  }

  return (
    <div style={s.screen}>
      <TopBar
        title={`Cart · ${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}`}
        rightEl={
          cartItems.length > 0 && (
            <button style={{ fontSize: 12, color: 'var(--red)', padding: '4px' }}
              onClick={() => onUpdateCart([])}>
              Clear
            </button>
          )
        }
      />

      <div style={s.body} className="scroll">
        {cartItems.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '40px 20px', color: 'var(--text2)',
          }}>
            <svg style={{ marginBottom: 16, opacity: 0.3 }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.99-1.83l1.18-9.27H6"/>
            </svg>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Cart is empty</div>
            <div style={{ fontSize: 13 }}>Scan a product to add it here</div>
            <button style={{ ...s.btnAccent, marginTop: 20, width: 'auto', padding: '11px 24px' }}
              onClick={() => onNav('scan')}>
              Scan item
            </button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div style={s.card}>
              {cartItems.map((item, idx) => (
                <div key={idx} style={{
                  ...s.productRow,
                  borderBottom: idx < cartItems.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}>
                  <div style={s.productImg}>📦</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.productName}>{item.product?.name || item.name || 'Product'}</div>
                    <div style={s.productMeta}>{item.retailer || 'Walmart'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <button onClick={() => updateQty(idx, -1)} style={{
                        width: 24, height: 24, borderRadius: 6,
                        border: '0.5px solid var(--border2)', background: 'var(--bg3)',
                        color: 'var(--text)', fontSize: 14, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>−</button>
                      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 16, textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button onClick={() => updateQty(idx, 1)} style={{
                        width: 24, height: 24, borderRadius: 6,
                        border: '0.5px solid var(--border2)', background: 'var(--bg3)',
                        color: 'var(--text)', fontSize: 14, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>+</button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      ${((item.price || 0) * item.quantity).toFixed(2)}
                    </div>
                    {item.quantity > 1 && (
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                        ${(item.price || 0).toFixed(2)} each
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Fulfillment */}
            <div style={s.sectionLabel}>Fulfillment</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'pickup', label: 'Pickup', sub: 'Ready today · The Colony Supercenter', price: 'Free' },
                { id: 'delivery', label: 'Delivery', sub: 'Tomorrow 10 AM – 2 PM window', price: '$7.95' },
              ].map(opt => (
                <div key={opt.id} onClick={() => setFulfillment(opt.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 'var(--radius)',
                  border: `0.5px solid ${fulfillment === opt.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: fulfillment === opt.id ? 'var(--accent-bg)' : 'var(--bg2)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${fulfillment === opt.id ? 'var(--accent)' : 'var(--text3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {fulfillment === opt.id && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: fulfillment === opt.id ? 'var(--accent)' : 'var(--text)' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{opt.sub}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: opt.id === 'pickup' ? 'var(--accent)' : 'var(--text)' }}>
                    {opt.price}
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div style={{ ...s.card, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: `Subtotal (${cartItems.reduce((s, i) => s + i.quantity, 0)} items)`, val: `$${subtotal.toFixed(2)}` },
                { label: 'Tax (8.25% TX)', val: `$${tax.toFixed(2)}` },
                { label: fulfillment === 'delivery' ? 'Delivery' : 'Pickup', val: fulfillment === 'delivery' ? '$7.95' : 'Free', color: 'var(--accent)' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text2)' }}>{row.label}</span>
                  <span style={{ color: row.color || 'var(--text)' }}>{row.val}</span>
                </div>
              ))}
              <div style={{ height: 0.5, background: 'var(--border)', margin: '2px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <ErrorMsg msg={error} />

            <button
              style={{ ...s.btnAccent, opacity: placing ? 0.6 : 1 }}
              onClick={handlePlaceOrder}
              disabled={placing}
            >
              {placing ? 'Placing order...' : 'Place order at Walmart'}
            </button>

            <div style={{ height: 8 }} />
          </>
        )}
      </div>
    </div>
  );
}
