const http = require('http');
function fetchCsv(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}
async function main(){
  const id = 'dc495c56-ccfa-4544-b650-0a484050fe15';
  const csv = await fetchCsv(`http://localhost:8080/api/v1/jobs/${id}/download`);
  console.log('CSV len', csv.length);
  const lines = csv.split('\n').filter(l=>l.trim());
  console.log('lines', lines.length);
  const header = lines[0];
  const headers = header.split(',').map(h=>h.replace(/^"|"$/g,'').trim().toLowerCase());
  console.log(headers);
  const idx = (names) => {
    for(let n of names){
      const i = headers.findIndex(h=>h===n || h.includes(n));
      if(i>=0) return i;
    }
    return -1;
  };
  const titleIdx = idx(['title']);
  const catIdx = idx(['category']);
  const addrIdx = idx(['address']);
  const completeIdx = idx(['complete_address']);
  const webIdx = idx(['website']);
  const phoneIdx = idx(['phone']);
  const ratingIdx = idx(['review_rating']);
  const countIdx = idx(['review_count']);
  const latIdx = idx(['latitude']);
  const lonIdx = idx(['longitude']);
  const plusIdx = idx(['plus_code']);
  const results = [];
  for(let i=1;i<lines.length;i++){
    const line = lines[i];
    // use regex for csv with quotes
    const cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    // if cols length < headers length, fallback split
    const clean = v => (v||'').replace(/^"|"$/g,'').replace(/""/g,'"').trim();
    const get = idx => idx>=0 && idx<cols.length ? clean(cols[idx]) : '';
    const title = get(titleIdx);
    const website = get(webIdx);
    const phone = get(phoneIdx);
    const addr = get(completeIdx) || get(addrIdx);
    const cat = get(catIdx);
    const rating = get(ratingIdx);
    const count = get(countIdx);
    const lat = get(latIdx);
    const lon = get(lonIdx);
    const plus = get(plusIdx);
    if(!title) continue;
    // Filter to Mangadu (address contains Mangadu) and without website
    const isMangadu = (addr||'').toLowerCase().includes('mangadu');
    const hasNoWebsite = !website || website.trim() === '';
    // Keep for debugging
    results.push({title, cat, addr, website, phone, rating, count, lat, lon, plus, isMangadu, hasNoWebsite});
  }
  console.log('total parsed', results.length);
  const mangaduAll = results.filter(r=>r.isMangadu);
  console.log('mangadu total', mangaduAll.length);
  const mangaduNoWeb = mangaduAll.filter(r=>r.hasNoWebsite);
  console.log('mangadu NO website', mangaduNoWeb.length);
  const mangaduWithWeb = mangaduAll.filter(r=>!r.hasNoWebsite);
  console.log('mangadu WITH website', mangaduWithWeb.length);
  // Provide 15 without website, if not enough, include nearby but still Mangadu area?
  let selected = mangaduNoWeb.slice(0,15);
  // If less than 15, we can include also results that are very close to Mangadu (lat 13.03-13.05, lon 80.10-80.14) even if address doesn't contain Mangadu but is nearby Kundrathur etc.
  if(selected.length < 15){
    const nearby = results.filter(r=>{
      const lat = parseFloat(r.lat); const lon = parseFloat(r.lon);
      return lat>13.02 && lat<13.06 && lon>80.10 && lon<80.15 && r.hasNoWebsite && !selected.find(s=>s.title===r.title);
    });
    console.log('nearby no website (lat/lon filter)', nearby.length);
    for(let n of nearby){
      if(selected.length>=15) break;
      if(!selected.find(s=>s.title===n.title)) selected.push(n);
    }
  }
  console.log(`\n=== 15 Mangadu Dentists WITHOUT WEBSITE (GOSOM REAL DATA ONLY) ===`);
  selected.slice(0,15).forEach((r,i)=>{
    console.log(`${i+1}. ${r.title} | ${r.cat} | Phone: ${r.phone||'—'} | Website: ${r.website||'— (needs website)'} | Address: ${r.addr} | Rating: ${r.rating} (${r.count}) | ${r.lat},${r.lon} | ${r.plus}`);
  });
  console.log(`\nTotal Mangadu leads without website found: ${mangaduNoWeb.length} / ${mangaduAll.length} Mangadu total / ${results.length} overall`);
  // Also output with website for comparison
  if(mangaduNoWeb.length===0){
    console.log('No Mangadu without website found, showing first 5 with website for debug');
    mangaduWithWeb.slice(0,5).forEach((r,i)=>console.log(`${i+1}. ${r.title} | website ${r.website} | ${r.addr}`));
  }
}
main().catch(e=>console.error(e));
