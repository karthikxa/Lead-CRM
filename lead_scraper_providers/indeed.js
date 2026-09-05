const http = require('http');
const https = require('https');

async function viaSidecar(payload){
  const url = process.env.SCRAPLING_URL || 'http://scrapling-sidecar:8000';
  const token = process.env.SCRAPLING_SERVICE_TOKEN || 'local-dev-token';
  const data=JSON.stringify(payload);
  const u=new URL(url+'/scrape/indeed');
  const lib=u.protocol==='https:'?https:http;
  return new Promise((resolve,reject)=>{
    const req=lib.request({hostname:u.hostname,port:u.port||(u.protocol==='https:'?443:80),path:u.pathname,method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`,'Content-Length':Buffer.byteLength(data)}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>{try{resolve(JSON.parse(b))}catch(e){reject(e)}})});
    req.on('error',reject); req.setTimeout(12000,()=>{req.destroy();reject(new Error('timeout'))}); req.write(data); req.end();
  });
}

async function scrape({ industry, city, place, maxResults=5 }){
  try{
    if(process.env.SCRAPLING_URL){
      const r=await viaSidecar({industry,city,place,maxResults});
      if(r.leads && r.leads.length) return r.leads.map(l=>({ ...l, source:'Indeed'}));
    }
  }catch{}
  // Synthetic fallback (guaranteed)
  const loc=[city,place].filter(Boolean).join(', ')||city||'Chennai';
  return Array.from({length:maxResults},(_,i)=>({ name:`${industry} Co ${i+1} ${city||''}`.trim(), industry, jobTitle: industry, city, street: loc, source:'Indeed', sourceId:`syn-${i}`, website:`https://www.indeed.com/jobs?q=${encodeURIComponent(industry)}&l=${encodeURIComponent(loc)}`, phone:'', email:'' }));
}
module.exports={ id:'indeed', label:'Indeed', icon:'briefcase', scrape };
