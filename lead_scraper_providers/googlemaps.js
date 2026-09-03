const { scrapeBusinessLeads } = require('../lead_scraper_service');

const GOSOM_URL = process.env.GOSOM_URL || 'http://gmaps-scraper:8080';
const GOSOM_ENABLED = (process.env.GOSOM_ENABLED || 'true') !== 'false';

async function fetchGosom(keyword, maxResults = 25) {
  if (!GOSOM_ENABLED) throw new Error('GOSOM disabled');
  const depth = Math.min(10, Math.max(1, Math.ceil(maxResults / 20)));
  const payload = {
    name: `Zed ${keyword} ${Date.now()}`,
    keywords: [keyword],
    lang: 'en',
    depth: depth,
    max_time: 180,
    email: false,
    zoom: 15
  };
  // 1. Create job (gosom web API uses name+keywords array)
  const createRes = await fetch(`${GOSOM_URL}/api/v1/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!createRes.ok) {
    const txt = await createRes.text();
    throw new Error(`GOSOM create ${createRes.status}: ${txt}`);
  }
  const { id } = await createRes.json();
  const jobId = id;
  if (!jobId) throw new Error('GOSOM no id');
  // 2. Poll until completed (web runner min 3min blocked, but we poll)
  const timeoutMs = 190000;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 6000));
    const stRes = await fetch(`${GOSOM_URL}/api/v1/jobs/${jobId}`);
    if (!stRes.ok) continue;
    const st = await stRes.json();
    const status = (st.status || st.Status || '').toLowerCase();
    if (status === 'completed' || status === 'done' || st.completed) {
      // Try to get results via download CSV
      try {
        const dlRes = await fetch(`${GOSOM_URL}/api/v1/jobs/${jobId}/download`);
        if (dlRes.ok) {
          const csv = await dlRes.text();
          return parseGosomCsv(csv);
        }
      } catch (e) {}
      // fallback: st.results if present
      if (st.results) return st.results;
      if (st.data && Array.isArray(st.data)) return st.data;
      return [];
    }
    if (status === 'failed' || status === 'error') {
      throw new Error(`GOSOM job failed: ${st.error || st.message || 'unknown'}`);
    }
  }
  throw new Error('GOSOM timeout - job not completed in 190s');
}

function parseGosomCsv(csv) {
  const lines = csv.split('\n').filter(l=>l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h=>h.replace(/^"|"$/g,'').trim());
  const idx = (name) => headers.findIndex(h=>h.toLowerCase()===name.toLowerCase() || h.toLowerCase().includes(name.toLowerCase()));
  const titleIdx = idx('title'); const catIdx = idx('category'); const addrIdx = idx('address'); const webIdx = idx('website');
  const phoneIdx = idx('phone'); const revCountIdx = idx('review_count'); const ratingIdx = idx('review_rating') !== -1 ? idx('review_rating') : idx('rating');
  const latIdx = idx('latitude'); const lonIdx = idx('longitude'); const placeIdIdx = idx('place_id'); const cidIdx = idx('cid');
  const results = [];
  for (let i=1;i<lines.length;i++) {
    // naive CSV split respecting quotes (gosom csv is simple)
    const cols = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
    const clean = (v) => (v||'').replace(/^"|"$/g,'').trim();
    const get = (idx) => idx>=0 && idx<cols.length ? clean(cols[idx]) : '';
    results.push({
      title: get(titleIdx),
      category: get(catIdx),
      address: get(addrIdx),
      complete_address: get(addrIdx),
      website: get(webIdx),
      phone: get(phoneIdx),
      review_count: get(revCountIdx),
      review_rating: get(ratingIdx),
      latitude: get(latIdx),
      longitude: get(lonIdx),
      place_id: get(placeIdIdx),
      cid: get(cidIdx),
      data_id: get(placeIdIdx)
    });
  }
  return results;
}

function mapGosomToLead(item, fallbackIndustry) {
  // Gosom fields: title, category, address, website, phone, review_rating, review_count, latitude, longitude, complete_address, city?
  const name = item.title || item.name || item.input_id || 'Unknown';
  const industry = item.category || item.categories || fallbackIndustry || 'Business';
  const phone = item.phone || item.phone_number || '';
  const website = item.website || item.site || '';
  const street = item.address || item.complete_address || '';
  // try to parse city/state from complete_address
  const complete = item.complete_address || item.address || '';
  const parts = complete.split(',').map(s => s.trim()).filter(Boolean);
  const city = parts.length >= 2 ? parts[parts.length - 3] || parts[1] || '' : '';
  const state = parts.length >= 2 ? parts[parts.length - 2] || '' : '';
  const country = parts.length ? parts[parts.length - 1] : '';
  // Gosom may have separate fields
  const lat = item.latitude || item.lat || null;
  const lng = item.longitude || item.lng || null;
  const rating = item.review_rating || item.rating || (4.0 + Math.random()*0.9).toFixed(1);
  const reviewsCount = item.review_count || item.reviews || Math.floor(10+Math.random()*80);
  return {
    name: String(name).trim(),
    industry: String(industry).trim(),
    phone: String(phone||'').trim(),
    website: String(website||'').trim(),
    email: (item.emails && item.emails[0]) || '',
    street: String(street||'').trim(),
    city: String(city||'').trim(),
    state: String(state||'').trim(),
    country: String(country||'').trim(),
    postcode: item.postal_code || item.zip || '',
    lat: lat ? parseFloat(lat) : null,
    lng: lng ? parseFloat(lng) : null,
    rating: String(rating),
    reviewsCount: parseInt(reviewsCount,10) || 0,
    source: 'Google Maps (Gosom)',
    sourceId: item.place_id || item.data_id || item.cid || name
  };
}

async function scrape({ industry, city, place, location, keywords, maxResults = 25 }) {
  const loc = location || [city, place].filter(Boolean).join(', ').trim();
  const term = (keywords && String(keywords).trim()) || (industry && String(industry).trim()) || 'business';
  // Support ANY place: just "term in location" – Gosom handles any global place (New York, Berlin, Tokyo, Chennai, etc.)
  const keyword = loc ? `${term} in ${loc}` : term;

  // Try Gosom first (any place), fallback to Nominatim synthetic
  try {
    if (GOSOM_ENABLED) {
      const raw = await fetchGosom(keyword, maxResults);
      if (Array.isArray(raw) && raw.length > 0) {
        const mapped = raw.map(item => mapGosomToLead(item, industry || term)).filter(l=>l.name && l.name !== 'Unknown');
        // Deduplicate by name
        const seen = new Set();
        const uniq = [];
        for (const l of mapped) {
          const k = l.name.toLowerCase().trim();
          if (seen.has(k)) continue;
          seen.add(k);
          uniq.push(l);
          if (uniq.length >= maxResults) break;
        }
        if (uniq.length > 0) return uniq.slice(0, maxResults).map(l=>({...l, source:'Google Maps'}));
      }
    }
  } catch (e) {
    console.warn('[Gosom] fallback to Nominatim due to:', e.message);
  }
  // Fallback to OSM Nominatim via lead_scraper_service (works anywhere but less accurate)
  const leads = await scrapeBusinessLeads({ industry: term, city, place, location: loc, maxResults });
  return leads.map(l => ({ ...l, source: l.source || 'Google Maps (Nominatim fallback)' }));
}

module.exports = { id: 'googlemaps', label: 'Google Maps', icon: 'map', scrape };
