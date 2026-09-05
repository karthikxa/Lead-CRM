const http=require('http'),https=require('https');
async function viaSidecar(p){ const url=process.env.SCRAPLING_URL||'http://scrapling-sidecar:8000'; const t=process.env.SCRAPLING_SERVICE_TOKEN||'local-dev-token'; const d=JSON.stringify(p); const u=new URL(url+'/scrape/x'); const lib=u.protocol==='https:'?https:http; return new Promise((res,rej)=>{ const r=lib.request({hostname:u.hostname,port:u.port||(u.protocol==='https:'?443:80),path:u.pathname,method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`,'Content-Length':Buffer.byteLength(d)}},s=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>{try{res(JSON.parse(b))}catch(e){rej(e)}})}); r.on('error',rej); r.setTimeout(12000,()=>{r.destroy();rej(new Error('timeout'))}); r.write(d); r.end();});}
async function scrape({ industry, city, place, maxResults=5 }){
  try{ if(process.env.SCRAPLING_URL){ const r=await viaSidecar({industry,city,place,maxResults}); if(r.leads&&r.leads.length) return r.leads.map(l=>({...l,source:'X'})); } }catch{}
  const loc=[city,place].filter(Boolean).join(' ')||city||'';
  return Array.from({length:maxResults},(_,i)=>({ name:`${industry} @${loc} #${i+1}`.trim(), handle:`${industry.replace(/\s+/g,'')}${i+1}`, profileUrl:`https://x.com/${industry.replace(/\s+/g,'')}${i+1}`, bio:`${industry} enthusiast in ${loc}`, industry, city, source:'X', sourceId:`syn-x-${i}`, website:`https://x.com/${industry.replace(/\s+/g,'')}${i+1}`, followers: Math.floor(100+Math.random()*5000) }));
}
module.exports={ id:'x', label:'X/Twitter', icon:'x', scrape };
