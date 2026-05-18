/**
 * Shop(+)Plus API client
 * Worker URL is set in Settings screen and stored in localStorage.
 * You can also set VITE_WORKER_URL in a .env file at build time.
 */

function getBase() {
  return localStorage.getItem('shopplus_worker_url')
    || import.meta.env.VITE_WORKER_URL
    || '';
}

async function call(path, options = {}) {
  const base = getBase();
  if (!base) throw new Error('Worker URL not set — go to Settings to configure it');
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  lookupUPC: (upc) => call(`/product/lookup?upc=${encodeURIComponent(upc)}`),
  identifyPhoto: (image_base64, media_type = 'image/jpeg') =>
    call('/product/identify', { method: 'POST', body: JSON.stringify({ image_base64, media_type }) }),
  getPrices: (upc) => call(`/prices/${upc}`),
  comparePrices: (upc, name) => {
    const p = new URLSearchParams();
    if (upc) p.set('upc', upc);
    if (name) p.set('name', name);
    return call(`/prices/compare?${p}`);
  },
  addToCart: (upc, name, retailer = 'walmart', quantity = 1) =>
    call('/cart/add', { method: 'POST', body: JSON.stringify({ upc, name, retailer, quantity }) }),
  placeOrder: (retailer = 'walmart', fulfillment = 'pickup') =>
    call('/cart/place-order', { method: 'POST', body: JSON.stringify({ retailer, fulfillment }) }),
  getPurchases: (upc, limit = 50) => {
    const p = new URLSearchParams({ limit });
    if (upc) p.set('upc', upc);
    return call(`/purchases?${p}`);
  },
  setAlert: (upc, config) =>
    call('/alerts', { method: 'POST', body: JSON.stringify({ upc, ...config }) }),
  deleteAlert: (upc) => call(`/alerts/${upc}`, { method: 'DELETE' }),
  getDashboard: () => call('/dashboard'),
  getSurgeEvents: (limit = 20) => call(`/surge/events?limit=${limit}`),
};
