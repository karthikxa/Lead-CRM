const http=require('http');
function postJob(keywords){
  return new Promise((resolve,reject)=>{
    const data=JSON.stringify({name:`Chennai ${keywords[0]}`, keywords, lang:"en", depth:2, max_time:300, email:true});
    const req=http.request({hostname:'gmaps-scraper', port:8080, path:'/api/v1/jobs', method:'POST', headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}}, res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{resolve(JSON.parse(d))} catch(e){resolve({raw:d})} });
    });
    req.on('error',reject);
    req.write(data); req.end();
  });
}
function getJob(id){
  return new Promise((res,rej)=>{
    http.get(`http://gmaps-scraper:8080/api/v1/jobs/${id}`, r=>{
      let d=''; r.on('data',c=>d+=c); r.on('end',()=>{ try{res(JSON.parse(d))} catch(e){res({raw:d})} });
    }).on('error',rej);
  });
}
async function waitFor(id){
  for(let i=0;i<40;i++){
    await new Promise(r=>setTimeout(r,15000));
    const j=await getJob(id);
    console.log(new Date().toISOString().slice(11,19), 'poll', j.Status||j.status);
    if((j.Status||j.status)==='ok' || (j.Status||j.status)==='completed') return j;
  }
  throw new Error('timeout');
}
async function main(){
  const locations=[
    "Ambattur, Chennai",
    "Avadi, Chennai",
    "Perungudi, Chennai",
    "Mylapore, Chennai"
  ];
  const results=[];
  for(let loc of locations){
    const keywords=[`dentists in ${loc}`, `dental clinic in ${loc}`];
    console.log(`\n=== Scraping ${loc} ===`);
    try {
      const {id}=await postJob(keywords);
      console.log('job',id, keywords.join(' | '));
      const j=await waitFor(id);
      console.log('done',j.Status||j.status);
      const csv=await new Promise((res,rej)=>{
        http.get(`http://gmaps-scraper:8080/api/v1/jobs/${id}/download`, r=>{
          let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(d));
        }).on('error',rej);
      });
      console.log('csv bytes',csv.length);
      console.log('lines',csv.split('\n').length);
      results.push({loc, id, csvBytes:csv.length});
    } catch(e){ console.error('fail',loc,e.message); }
    await new Promise(r=>setTimeout(r,5000));
  }
  console.log(JSON.stringify(results,null,2));
}
main().catch(e=>console.error(e));
