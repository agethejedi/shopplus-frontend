import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { api } from '../api';
import { TopBar, ErrorMsg, Spinner, s } from '../components';

export default function ScanScreen({ onNav, onProductFound }) {
  const [mode, setMode] = useState('barcode'); // barcode | photo | manual
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualUPC, setManualUPC] = useState('');
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const fileRef = useRef(null);

  // Start barcode scanner
  useEffect(() => {
    if (mode !== 'barcode') return;
    startScanner();
    return () => stopScanner();
  }, [mode]);

  async function startScanner() {
    try {
      setError('');
      setScanning(true);
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      await reader.decodeFromVideoDevice(null, videoRef.current, async (result, err) => {
        if (result) {
          stopScanner();
          await lookupUPC(result.getText());
        }
      });
    } catch (e) {
      setError('Camera access denied. Try Photo ID or manual entry instead.');
      setScanning(false);
    }
  }

  function stopScanner() {
    readerRef.current?.reset();
    setScanning(false);
  }

  async function lookupUPC(upc) {
    setLoading(true);
    setError('');
    try {
      const data = await api.lookupUPC(upc);
      onProductFound(data.product, upc);
      onNav('product');
    } catch (e) {
      setError(`Product not found for UPC ${upc}. Try photo ID or manual entry.`);
      setLoading(false);
      if (mode === 'barcode') startScanner();
    }
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const base64 = await toBase64(file);
      const data = await api.identifyPhoto(base64, file.type);
      const identified = data.identified;
      // Build a product-like object from the identification
      const product = {
        name: `${identified.brand || ''} ${identified.name}`.trim(),
        brand: identified.brand,
        category: identified.category,
        upc: identified.estimated_upc,
        confidence: identified.confidence,
        from_photo: true,
      };
      onProductFound(product, identified.estimated_upc);
      onNav('product');
    } catch (e) {
      setError('Could not identify product. Try a clearer photo or manual entry.');
      setLoading(false);
    }
  }

  async function handleManual() {
    if (!manualUPC.trim()) return;
    await lookupUPC(manualUPC.trim());
  }

  function toBase64(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  return (
    <div style={s.screen}>
      <TopBar title="Scan product" />

      {/* Mode selector */}
      <div style={{
        display: 'flex', gap: 6, padding: '10px 16px 0',
        borderBottom: '0.5px solid var(--border)',
      }}>
        {['barcode', 'photo', 'manual'].map(m => (
          <button key={m} onClick={() => { stopScanner(); setMode(m); setError(''); }} style={{
            padding: '7px 14px', fontSize: 12, fontWeight: 500,
            borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
            background: mode === m ? 'var(--bg3)' : 'transparent',
            color: mode === m ? 'var(--text)' : 'var(--text2)',
            borderBottom: mode === m ? '2px solid var(--accent)' : '2px solid transparent',
          }}>
            {m === 'barcode' ? 'Barcode' : m === 'photo' ? 'Photo ID' : 'Manual'}
          </button>
        ))}
      </div>

      <div style={s.body} className="scroll">
        <ErrorMsg msg={error} />

        {loading && <Spinner />}

        {!loading && mode === 'barcode' && (
          <>
            <div style={{
              position: 'relative', borderRadius: 'var(--radius)',
              overflow: 'hidden', background: '#000',
              aspectRatio: '4/3',
            }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {/* Scanner corners */}
              {['tl','tr','bl','br'].map(c => (
                <div key={c} style={{
                  position: 'absolute',
                  top: c.startsWith('t') ? 16 : undefined,
                  bottom: c.startsWith('b') ? 16 : undefined,
                  left: c.endsWith('l') ? 16 : undefined,
                  right: c.endsWith('r') ? 16 : undefined,
                  width: 24, height: 24,
                  borderTop: c.startsWith('t') ? '2.5px solid var(--accent)' : 'none',
                  borderBottom: c.startsWith('b') ? '2.5px solid var(--accent)' : 'none',
                  borderLeft: c.endsWith('l') ? '2.5px solid var(--accent)' : 'none',
                  borderRight: c.endsWith('r') ? '2.5px solid var(--accent)' : 'none',
                }} />
              ))}
              {/* Scan line */}
              <div style={{
                position: 'absolute', left: 20, right: 20, height: 2,
                background: 'var(--accent)', opacity: 0.7,
                animation: 'scanline 1.8s ease-in-out infinite',
              }} />
              <style>{`
                @keyframes scanline {
                  0%, 100% { top: 20%; }
                  50% { top: 78%; }
                }
              `}</style>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center' }}>
              Point camera at barcode — auto-detects
            </p>
          </>
        )}

        {!loading && mode === 'photo' && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handlePhoto}
            />
            <button
              style={{
                background: 'var(--bg3)', border: '1.5px dashed var(--border2)',
                borderRadius: 'var(--radius)', padding: '40px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 12, width: '100%', cursor: 'pointer',
              }}
              onClick={() => fileRef.current?.click()}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Take a photo</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                  Claude AI will identify the product
                </div>
              </div>
            </button>
            <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5 }}>
              Works best with the product label or packaging clearly visible
            </div>
          </>
        )}

        {!loading && mode === 'manual' && (
          <>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
              Enter UPC barcode number
            </div>
            <input
              type="number"
              inputMode="numeric"
              placeholder="e.g. 012345678901"
              value={manualUPC}
              onChange={e => setManualUPC(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManual()}
              style={{
                width: '100%', padding: '13px 14px', borderRadius: 'var(--radius)',
                background: 'var(--bg3)', border: '0.5px solid var(--border2)',
                color: 'var(--text)', fontSize: 16, letterSpacing: '0.05em',
              }}
            />
            <button style={s.btnPrimary} onClick={handleManual} disabled={!manualUPC.trim()}>
              Look up product
            </button>
          </>
        )}
      </div>
    </div>
  );
}
