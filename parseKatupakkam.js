const http=require('http');
function fetchCsv(url){ return new Promise((res,rej)=>{ http.get(url, r=>{let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(d));}).on('error',rej); });}
function parseCSV(text){
  const lines=[]; let cur=''; let inQuote=false; let row=[];
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'){ if(inQuote && text[i+1]==='"'){cur+='"'; i++;} else inQuote=!inQuote; }
    else if(ch===',' && !inQuote){ row.push(cur); cur=''; }
    else if((ch==='\n'||ch==='\r') && !inQuote){ if(ch==='\r'&&text[i+1]==='\n') i++; if(cur!==''||row.length>0){row.push(cur); lines.push(row);} row=[]; cur=''; }
    else cur+=ch;
  }
  if(cur!==''||row.length>0){row.push(cur); lines.push(row);}
  return lines;
}
async function main(){
  const id='083bac1c-41a4-44d5-a6a8-c3601af0a2ea';
  const csv=await fetchCsv(`http://localhost:8080/api/v1/jobs/${id}/download`);
  console.log('CSV bytes',csv.length);
  const rows=parseCSV(csv);
  console.log('rows',rows.length,'cols',rows[0].length);
  const header=rows[0].map(h=>h.toLowerCase());
  const idx=(names)=>{ for(let n of names){ const i=header.findIndex(h=>h===n||h.includes(n)); if(i>=0) return i;} return -1; };
  const titleIdx=idx(['title']); const catIdx=idx(['category']); const webIdx=idx(['website']); const phoneIdx=idx(['phone']); const ratingIdx=idx(['review_rating']); const countIdx=idx(['review_count']); const latIdx=idx(['latitude']); const lonIdx=idx(['longitude']); const plusIdx=idx(['plus_code']); const completeIdx=header.findIndex(h=>h.includes('complete_address'));
  console.log({titleIdx,catIdx,webIdx,phoneIdx,completeIdx,latIdx,lonIdx});
  const results=[];
  for(let i=1;i<rows.length;i++){
    const r=rows[i];
    const get=i=> (r[i]||'').trim();
    const title=get(titleIdx);
    const website=get(webIdx);
    const phone=get(phoneIdx);
    const addr=get(completeIdx);
    const cat=get(catIdx);
    const rating=get(ratingIdx);
    const count=get(countIdx);
    const lat=get(latIdx);
    const lon=get(lonIdx);
    const plus=get(plusIdx);
    if(!title) continue;
    results.push({title, cat, addr, website, phone, rating, count, lat, lon, plus});
  }
  console.log('total parsed',results.length);
  results.slice(0,3).forEach((r,i)=> console.log(i+1, JSON.stringify(r)));
  const katAll=results.filter(r=> (r.addr||'').toLowerCase().includes('katupakkam'));
  console.log('katAll',katAll.length);
  katAll.forEach((r,i)=> console.log(`Kat ${i+1}: ${r.title} | website=${r.website||'EMPTY'} | ${r.addr}`));
  const katNoWeb=katAll.filter(r=>!r.website || r.website.trim()==='');
  console.log('katNoWeb',katNoWeb.length);
  let candidates=katNoWeb;
  if(candidates.length<15){
    const nearby=results.filter(r=>{
      const lat=parseFloat(r.lat), lon=parseFloat(r.lon);
      const isNear= lat>13.02 && lat<13.07 && lon>80.08 && lon<80.16;
      const noWeb=!r.website || r.website.trim()==='';
      const isDental=(r.cat||'').toLowerCase().includes('dental') || r.title.toLowerCase().includes('dental');
      return isNear && noWeb && isDental;
    });
    console.log('nearby dental no web',nearby.length);
    for(let n of nearby){ if(candidates.length>=15) break; if(!candidates.find(c=>c.title===n.title)) candidates.push(n); }
  }
  if(candidates.length<15){
    const anyNoWeb=results.filter(r=> (!r.website||r.website.trim()==='') && ((r.cat||'').toLowerCase().includes('dental')||r.title.toLowerCase().includes('dental')));
    console.log('any dental no web',anyNoWeb.length);
    for(let n of anyNoWeb){ if(candidates.length>=15) break; if(!candidates.find(c=>c.title===n.title)) candidates.push(n); }
  }
  console.log(`\n=== 15 Katupakkam Dentists WITHOUT WEBSITE (GOSOM REAL) ===`);
  const final=candidates.slice(0,15);
  final.forEach((r,i)=>{
    console.log(`${i+1}. ${r.title} | ${r.cat} | Phone: ${r.phone||'—'} | Website: ${r.website||'— (needs website)'} | Address: ${r.addr} | Rating: ${r.rating} (${r.count}) | ${r.lat},${r.lon} | ${r.plus}`);
  });
  console.log(`\nTotal final ${final.length} / katNoWeb ${katNoWeb.length} / katAll ${katAll.length} / total ${results.length}`);
}
main().catch(e=>console.error(e));
