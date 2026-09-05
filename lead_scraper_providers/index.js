const providers = {};
try { providers.googlemaps = require('./googlemaps'); } catch {}
try { providers.reddit = require('./reddit'); } catch {}
try { providers.indeed = require('./indeed'); } catch {}
try { providers.x = require('./x'); } catch {}
try { providers.instagram = require('./instagram'); } catch {}
try { providers.facebook = require('./facebook'); } catch {}
try { providers.linkedin = require('./linkedin'); } catch {}

async function scrapeUnified({ industry, city, place, location, keywords, maxResults = 25, sources }) {
  const loc = location || [city, place].filter(Boolean).join(', ');
  const total = parseInt(maxResults, 10) || 25;
  // Default sources: if none specified, only googlemaps (backward compat)
  let srcMap = sources;
  if (!srcMap || typeof srcMap !== 'object' || Object.keys(srcMap).length === 0) {
    srcMap = { googlemaps: total };
  }
  // Normalize: { googlemaps: 10, reddit: 5 } or { googlemaps: true } -> split equally
  const enabled = Object.entries(srcMap).filter(([k,v]) => v && providers[k]);
  if (enabled.length === 0) enabled.push(['googlemaps', total]);
  // Distribute maxResults proportionally if values are true/1
  let perSource = {};
  const hasNumeric = enabled.some(([k,v]) => typeof v === 'number' && v > 1);
  if (hasNumeric) {
    enabled.forEach(([k,v]) => perSource[k] = typeof v === 'number' ? v : Math.ceil(total / enabled.length));
  } else {
    const each = Math.ceil(total / enabled.length);
    enabled.forEach(([k]) => perSource[k] = each);
  }
  // Cap each to not exceed total, adjust last
  let sum = Object.values(perSource).reduce((a,b)=>a+b,0);
  if (sum > total) {
    const last = enabled[enabled.length-1][0];
    perSource[last] = Math.max(1, perSource[last] - (sum - total));
  }

  const results = await Promise.allSettled(enabled.map(async ([id]) => {
    const prov = providers[id];
    const n = perSource[id] || 5;
    try {
      const leads = await prov.scrape({ industry: industry || 'Business', city, place, location: loc, keywords, maxResults: n });
      return { id, leads: (leads||[]).slice(0,n).map(l=>({ ...l, source: l.source || prov.label })), error: null };
    } catch (e) {
      return { id, leads: [], error: e.message };
    }
  }));

  const allLeads = [];
  const perSourceCounts = {};
  const errors = {};
  const seen = new Set();
  results.forEach(r => {
    if (r.status === 'fulfilled') {
      const { id, leads, error } = r.value;
      perSourceCounts[id] = leads.length;
      if (error) errors[id] = error;
      leads.forEach(l => {
        const key = `${(l.name||'').toLowerCase().trim()}|${(l.handle||'').toLowerCase()}|${(l.website||'').replace(/https?:\/\//,'').replace(/\/.*$/,'').toLowerCase()}`;
        if (seen.has(key)) return;
        seen.add(key);
        allLeads.push(l);
      });
    } else {
      errors[r.reason?.id || 'unknown'] = r.reason?.message || String(r.reason);
    }
  });

  return { leads: allLeads.slice(0, total), perSourceCounts, errors };
}

module.exports = { providers, scrapeUnified };
