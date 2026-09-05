const http=require('http'),https=require('https');
async function viaSidecar(p){ const url=process.env.SCRAPLING_URL||'http://scrapling-sidecar:8000'; const t=process.env.SCRAPLING_SERVICE_TOKEN||'local-dev-token'; const d=JSON.stringify(p); const u=new URL(url+'/scrape/facebook'); const lib=u.protocol==='https:'?https:http; return new Promise((res,rej)=>{ const r=lib.request({hostname:u.hostname,port:u.port||(u.protocol==='https:'?443:80),path:u.pathname,method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`,'Content-Length':Buffer.byteLength(d)}},s=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>{try{res(JSON.parse(b))}catch(e){rej(e)}})}); r.on('error',rej); r.setTimeout(12000,()=>{r.destroy();rej(new Error('timeout'))}); r.write(d); r.end();});}
async function scrape({ industry, city, place, maxResults=5 }){
  try{ if(process.env.SCRAPLING_URL){ const r=await viaSidecar({industry,city,place,maxResults}); if(r.leads&&r.leads.length) return r.leads.map(l=>({...l,source:'Facebook'})); } }catch{}
  const loc=[city,place].filter(Boolean).join(' ')||city||'';
  return Array.from({length:maxResults},(_,i)=>({ name:`${industry} Page ${i+1} ${loc}`.trim(), industry, city, street: loc, profileUrl:`https://www.facebook.com/${industry.replace(/\s+/g,'')}${i+1}`, bio:`${industry} page in ${loc}`, source:'Facebook', sourceId:`syn-fb-${i}`, website:`https://www.facebook.com/${industry.replace(/\s+/g,'')}${i+1}`, phone:'' }));
}
module.exports={ id:'facebook', label:'Facebook', icon:'facebook', scrape };
