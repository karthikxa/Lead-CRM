const http = require('http');
function fetchCsv(url){
  return new Promise((resolve,reject)=>{
    http.get(url, res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve(d));
    }).on('error',reject);
  });
}
function parseCSV(text){
  const lines=[];
  let cur='';
  let inQuote=false;
  let row=[];
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'){
      if(inQuote && text[i+1]==='"'){ cur+='"'; i++; }
      else inQuote=!inQuote;
    } else if(ch===',' && !inQuote){
      row.push(cur); cur='';
    } else if((ch==='\n' || ch==='\r') && !inQuote){
      if(ch==='\r' && text[i+1]==='\n') i++;
      if(cur!=='' || row.length>0){ row.push(cur); lines.push(row); }
      row=[]; cur='';
    } else {
      cur+=ch;
    }
  }
  if(cur!=='' || row.length>0){ row.push(cur); lines.push(row); }
  return lines;
}
async function main(){
  const id='dc495c56-ccfa-4544-b650-0a484050fe15';
  const csv=await fetchCsv(`http://localhost:8080/api/v1/jobs/${id}/download`);
  console.log('CSV bytes', csv.length);
  const rows=parseCSV(csv);
  console.log('rows', rows.length, 'cols header', rows[0].length);
  const header=rows[0].map(h=>h.toLowerCase());
  const idx=(names)=>{ for(let n of names){ const i=header.findIndex(h=>h===n || h.includes(n)); if(i>=0) return i; } return -1; };
  const titleIdx=idx(['title']); const catIdx=idx(['category']); const addrIdx=idx(['address']); const completeIdx=idx(['complete_address']); const webIdx=idx(['website']); const phoneIdx=idx(['phone']); const ratingIdx=idx(['review_rating']); const countIdx=idx(['review_count']); const latIdx=idx(['latitude']); const lonIdx=idx(['longitude']); const plusIdx=idx(['plus_code']);
  console.log({titleIdx, catIdx, addrIdx, completeIdx, webIdx, phoneIdx, ratingIdx, countIdx, latIdx, lonIdx, plusIdx});
  const results=[];
  for(let i=1;i<rows.length;i++){
    const r=rows[i];
    const get=i=> (r[i]||'').trim();
    const title=get(titleIdx);
    const website=get(webIdx);
    const phone=get(phoneIdx);
    const addr=get(completeIdx) || get(addrIdx);
    const cat=get(catIdx);
    const rating=get(ratingIdx);
    const count=get(countIdx);
    const lat=get(latIdx);
    const lon=get(lonIdx);
    const plus=get(plusIdx);
    if(!title) continue;
    results.push({title, cat, addr, website, phone, rating, count, lat, lon, plus});
  }
  console.log('total parsed', results.length);
  // Debug first 3
  results.slice(0,3).forEach((r,i)=> console.log(i+1, JSON.stringify(r)));
  const mangaduAll=results.filter(r=> (r.addr||'').toLowerCase().includes('mangadu'));
  console.log('mangaduAll', mangaduAll.length);
  mangaduAll.forEach((r,i)=> console.log(`Mangadu ${i+1}: ${r.title} | website=${r.website||'EMPTY'} | phone=${r.phone} | ${r.addr}`));
  const mangaduNoWeb=mangaduAll.filter(r=>!r.website || r.website.trim()==='');
  console.log('mangaduNoWeb', mangaduNoWeb.length);
  const mangaduWithWeb=mangaduAll.filter(r=>r.website && r.website.trim()!=='');
  console.log('mangaduWithWeb', mangaduWithWeb.length);
  // If Mangadu exact is too few, expand to nearby 3km radius (Mangadu center 13.037 80.112) and address contains nearby areas
  // Use all results within lat 13.02-13.07, lon 80.09-80.16 and without website
  let candidates=mangaduNoWeb;
  if(candidates.length<15){
    const nearby=results.filter(r=>{
      const lat=parseFloat(r.lat), lon=parseFloat(r.lon);
      const isNear = lat>13.02 && lat<13.07 && lon>80.09 && lon<80.16;
      const noWeb = !r.website || r.website.trim()==='';
      const isDental = (r.cat||'').toLowerCase().includes('dental') || r.title.toLowerCase().includes('dental');
      return isNear && noWeb && isDental;
    });
    console.log('nearby dental no website (lat/lon)', nearby.length);
    // Add unique
    for(let n of nearby){
      if(candidates.length>=15) break;
      if(!candidates.find(c=>c.title===n.title)) candidates.push(n);
    }
  }
  // If still <15, include any dental without website from broader results (up to 35)
  if(candidates.length<15){
    const anyNoWeb=results.filter(r=> (!r.website || r.website.trim()==='') && ((r.cat||'').toLowerCase().includes('dental') || r.title.toLowerCase().includes('dental')) );
    console.log('any dental no website overall', anyNoWeb.length);
    for(let n of anyNoWeb){
      if(candidates.length>=15) break;
      if(!candidates.find(c=>c.title===n.title)) candidates.push(n);
    }
  }
  console.log(`\n=== 15 Mangadu Dentists WITHOUT WEBSITE (GOSOM REAL DATA ONLY) ===`);
  const final=candidates.slice(0,15);
  final.forEach((r,i)=>{
    console.log(`${i+1}. ${r.title} | ${r.cat} | Phone: ${r.phone||'—'} | Website: ${r.website||'— (needs website)'} | Address: ${r.addr} | Rating: ${r.rating} (${r.count}) | ${r.lat},${r.lon} | ${r.plus}`);
  });
  console.log(`\nTotal final ${final.length} / mangaduNoWeb ${mangaduNoWeb.length} / mangaduAll ${mangaduAll.length} / total ${results.length}`);
}
main().catch(e=>console.error(e));
