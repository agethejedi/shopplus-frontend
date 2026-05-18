import { useState, useRef, useEffect } from 'react';
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
} from '@zxing/library';
import { api } from '../api';
import { TopBar, ErrorMsg, Spinner, s } from '../components';

// Supported barcode formats for retail products
const HINTS = new Map([
  [DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.ITF,
    BarcodeFormat.DATA_MATRIX,
    BarcodeFormat.QR_CODE,
  ]],
  [DecodeHintType.TRY_HARDER, true],
]);

export default function ScanScreen({ onNav, onProductFound }) {
  const [mode, setMode] = useState('barcode');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualUPC, setManualUPC] = useState('');
  const [detected, setDetected] = useState('');
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const fileRef = useRef(null);
  const processingRef = useRef(false);

  useEffect(() => {
    if (mode !== 'barcode') return;
    startScanner();
    return () => stopScanner();
  }, [mode]);

  async function startScanner() {
    try {
      setError('');
      setDetected('');
      processingRef.current = false;

      // Clean up any previous reader
      if (readerRef.current) {
        readerRef.current.reset();
      }

      const reader = new BrowserMultiFormatReader(HINTS, {
        delayBetweenScanAttempts: 150,
        delayBetweenScanSuccess: 500,
      });
      readerRef.current = reader;
      setScanning(true);

      // Get rear camera explicitly
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      const rearCamera = devices.find(d =>
        d.label.toLowerCase().includes('back') ||
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      ) || devices[devices.length - 1]; // fallback to last device (usually rear)

      const deviceId = rearCamera?.deviceId || undefined;

      await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        async (result, err) => {
          if (result && !processingRef.current) {
            processingRef.current = true;
            const text = result.getText();
            setDetected(text);
            stopScanner();
            await lookupUPC(text);
          }
        }
      );
    } catch (e) {
      console.error('Scanner error:', e);
      setError('Camera access denied or unavailable. Try Photo ID or manual entry.');
      setScanning(false);
    }
  }

  function stopScanner() {
    try {
      readerRef.current?.reset();
    } catch {}
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
      processingRef.current = false;
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
    const upc = manualUPC.trim();
    if (!upc) return;
    await lookupUPC(upc);
  }

  function toBase64(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  function handleModeChange(m) {
    stopScanner();
    setMode(m);
    setError('');
    setDetected('');
    setManualUPC('');
    processingRef.current = false;
  }

  return (
    <div style={s.screen}>
      <TopBar title="Scan product" />

      {/* Mode tabs */}
      <div style={{
        display: 'flex', gap: 0, padding: '10px 16px 0',
        borderBottom: '0.5px solid var(--border)', flexShrink: 0,
      }}>
        {[
          { id: 'barcode', label: 'Barcode' },
          { id: 'photo', label: 'Photo ID' },
          { id: 'manual', label: 'Manual' },
        ].map(m => (
          <button key={m.id} onClick={() => handleModeChange(m.id)} style={{
            padding: '7px 16px', fontSize: 13, fontWeight: 500,
            borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
            background: mode === m.id ? 'var(--bg3)' : 'transparent',
            color: mode === m.id ? 'var(--text)' : 'var(--text2)',
            borderBottom: mode === m.id ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
            {m.label}
          </button>
        ))}
      </div>

      <div style={s.body} className="scroll">

        <ErrorMsg msg={error} />
        {loading && <Spinner />}

        {/* ── Barcode scanner ── */}
        {!loading && mode === 'barcode' && (
          <>
            <div style={{
              position: 'relative', borderRadius: 'var(--radius)',
              overflow: 'hidden', background: '#000',
              aspectRatio: '4/3', flexShrink: 0,
            }}>
              <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                playsInline
                muted
                autoPlay
              />

              {/* Corner brackets */}
              {[
                { top: 16, left: 16, borderTop: true, borderLeft: true },
                { top: 16, right: 16, borderTop: true, borderRight: true },
                { bottom: 16, left: 16, borderBottom: true, borderLeft: true },
                { bottom: 16, right: 16, borderBottom: true, borderRight: true },
              ].map((c, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top: c.top, bottom: c.bottom,
                  left: c.left, right: c.right,
                  width: 28, height: 28,
                  borderTop: c.borderTop ? '3px solid var(--accent)' : 'none',
                  borderBottom: c.borderBottom ? '3px solid var(--accent)' : 'none',
                  borderLeft: c.borderLeft ? '3px solid var(--accent)' : 'none',
                  borderRight: c.borderRight ? '3px solid var(--accent)' : 'none',
                  borderRadius: c.borderTop && c.borderLeft ? '4px 0 0 0'
                    : c.borderTop && c.borderRight ? '0 4px 0 0'
                    : c.borderBottom && c.borderLeft ? '0 0 0 4px'
                    : '0 0 4px 0',
                }} />
              ))}

              {/* Animated scan line */}
              <div style={{
                position: 'absolute', left: 28, right: 28, height: 2,
                background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                animation: 'scanline 1.8s ease-in-out infinite',
                boxShadow: '0 0 6px var(--accent)',
              }} />

              {/* Detected flash */}
              {detected && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(74,222,128,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    background: 'var(--accent)', color: '#000',
                    padding: '8px 16px', borderRadius: 20,
                    fontSize: 13, fontWeight: 700,
                  }}>
                    ✓ {detected}
                  </div>
                </div>
              )}

              <style>{`
                @keyframes scanline {
                  0%, 100% { top: 18%; }
                  50% { top: 76%; }
                }
              `}</style>
            </div>

            {/* Tips */}
            <div style={{
              background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.7 }}>
                <div>• Hold steady with barcode <strong style={{ color: 'var(--text)' }}>flat and parallel</strong> to screen</div>
                <div>• Fill the middle of the frame with the barcode</div>
                <div>• Ensure good lighting — avoid shadows on label</div>
                <div>• Works with UPC-A, EAN-13, Code 128 and more</div>
              </div>
            </div>

            {scanning && (
              <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
                Scanner active — auto-detects on lock
              </div>
            )}
          </>
        )}

        {/* ── Photo ID ── */}
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
                borderRadius: 'var(--radius)', padding: '44px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 14, width: '100%', cursor: 'pointer',
              }}
              onClick={() => fileRef.current?.click()}
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 5 }}>Take a photo</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                  Claude AI identifies the product<br />from the packaging or label
                </div>
              </div>
            </button>

            <div style={{
              background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.7 }}>
                <div>• Photograph the <strong style={{ color: 'var(--text)' }}>front of the package</strong></div>
                <div>• Include brand name and product description</div>
                <div>• Works even without a visible barcode</div>
              </div>
            </div>
          </>
        )}

        {/* ── Manual UPC entry ── */}
        {!loading && mode === 'manual' && (
          <>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              Enter the UPC number printed below the barcode
            </div>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="e.g. 012345678901"
              value={manualUPC}
              onChange={e => setManualUPC(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleManual()}
              style={{
                width: '100%', padding: '14px', borderRadius: 'var(--radius)',
                background: 'var(--bg3)', border: '0.5px solid var(--border2)',
                color: 'var(--text)', fontSize: 18, letterSpacing: '0.08em',
                textAlign: 'center',
              }}
            />
            {manualUPC.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
                {manualUPC.length} digits entered
                {manualUPC.length === 12 && ' · UPC-A ✓'}
                {manualUPC.length === 13 && ' · EAN-13 ✓'}
              </div>
            )}
            <button
              style={{
                ...s.btnAccent,
                opacity: manualUPC.length >= 8 ? 1 : 0.4,
              }}
              onClick={handleManual}
              disabled={manualUPC.length < 8}
            >
              Look up product
            </button>
            <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5 }}>
              UPC is the 12-digit number printed beneath the barcode stripes.
              EAN-13 (13 digits) also works.
            </div>
          </>
        )}

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
