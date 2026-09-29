const http=require('http');
function get(path){return new Promise((res,rej)=>{http.get('http://gmaps-scraper:8080'+path,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d))}).on('error',rej)})}
async function analyze(id,label){
  try{
    const csv=await get('/api/v1/jobs/'+id+'/download');
    console.log('===',label, id,'bytes',csv.length);
    const lines=csv.split('\n');
    console.log('lines total inc header',lines.length);
    const header=lines[0]||'';
    console.log('header',header.slice(0,1200));
    const cols=header.split(',');
    console.log('cols',cols);
    let websiteIdx = cols.findIndex(c=>/website/i.test(c));
    let emailIdx = cols.findIndex(c=>/^"?email"?$/i.test(c));
    console.log('websiteIdx',websiteIdx, 'emailIdx',emailIdx, 'colNameWebsite', cols[websiteIdx], 'colNameEmail', cols[emailIdx]);
    for(let i=1;i<Math.min(4,lines.length);i++) console.log('row'+i, lines[i].slice(0,1000));
    let total=0, withWebsite=0, withoutWebsite=0, gmail=0, gmailWithSite=0, gmailWithoutSite=0;
    for(let i=1;i<lines.length;i++){
      const line=lines[i].trim(); if(!line) continue;
      total++;
      const hasGmail = /gmail\.com/i.test(line);
      if(hasGmail) gmail++;
      const httpWebsite = /https?:\/\//.test(line);
      if(httpWebsite) withWebsite++; else withoutWebsite++;
      if(hasGmail && httpWebsite) gmailWithSite++;
      else if(hasGmail) gmailWithoutSite++;
    }
    console.log(JSON.stringify({total, withWebsite, withoutWebsite, gmail, gmailWithSite, gmailWithoutSite},null,2));
    return {id,label,csvBytes:csv.length,total,withWebsite,withoutWebsite,gmail,gmailWithSite,gmailWithoutSite};
  }catch(e){console.error(e.message); return null}
}
(async()=>{
  const r1=await analyze('476b27fb-26de-4bdb-8037-c384b0bc5da5','Anna Nagar ok');
  const r2=await analyze('58661038-08fe-49b6-b107-703aeb6a77d0','Phase1 Chennai Dental 450');
  const r3=await analyze('db0c8a06-5868-4e99-b3f8-d421a33654c4','T Nagar working');
  const r4=await analyze('bb5c2e9c-c28b-4326-868c-7927901bfcd3','Anna pending duplicate');
  console.log('SUMMARY',JSON.stringify([r1,r2,r3,r4],null,2));
})();
