const http=require('http');
function get(path){return new Promise((res,rej)=>{http.get('http://gmaps-scraper:8080'+path,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d))}).on('error',rej)})}
function parseCSV(csvText){
  const rows=[]; let cur=''; let row=[]; let inQuote=false;
  for(let i=0;i<csvText.length;i++){
    const c=csvText[i]; const next=csvText[i+1];
    if(c==='"'){ if(inQuote && next==='"'){cur+='"'; i++;} else {inQuote=!inQuote;}}
    else if(c===',' && !inQuote){row.push(cur); cur='';}
    else if((c==='\n' || c==='\r') && !inQuote){
      if(c==='\r' && next==='\n') i++;
      row.push(cur); cur='';
      if(row.length>1 || row[0]!=='') rows.push(row);
      row=[];
    } else cur+=c;
  }
  if(cur!=='' || row.length>0){row.push(cur); rows.push(row);}
  return rows;
}
async function analyze(id,label){
  const csv=await get('/api/v1/jobs/'+id+'/download');
  if(csv.includes('csv file not found')) return {id,label,error:'not ready',bytes:csv.length};
  const rows=parseCSV(csv);
  if(rows.length===0) return {id,label,total:0};
  const header=rows[0];
  const websiteIdx=header.findIndex(c=>c.toLowerCase().includes('website'));
  const emailsIdx=header.findIndex(c=>c.toLowerCase()==='emails');
  let total=0,withWebsite=0,withoutWebsite=0,gmail=0,gmailWithSite=0,gmailWithoutSite=0;
  let gmailSet=new Set();
  for(let i=1;i<rows.length;i++){
    const r=rows[i]; if(r.length<=1||!r[2]) continue;
    total++;
    const website=(r[websiteIdx]||'').trim();
    const hasWebsite=website.length>0 && website.startsWith('http');
    if(hasWebsite) withWebsite++; else withoutWebsite++;
    const emailsRaw=(r[emailsIdx]||'').trim();
    const hasGmail=/gmail\.com/i.test(emailsRaw);
    if(hasGmail){
      gmail++;
      if(hasWebsite) gmailWithSite++; else gmailWithoutSite++;
      const ms=emailsRaw.match(/[A-Za-z0-9._%+-]+@gmail\.com/gi);
      if(ms) ms.forEach(m=>gmailSet.add(m.toLowerCase()));
    }
  }
  return {id,label,total,withWebsite,withoutWebsite,gmail,gmailWithSite,gmailWithoutSite,uniqueGmailCount:gmailSet.size,bytes:csv.length,rows:rows.length};
}
(async()=>{
  const txt=await get('/api/v1/jobs');
  const jobs=JSON.parse(txt);
  console.log('TOTAL JOBS',jobs.length);
  const chennaiJobs=jobs.filter(j=>/chennai/i.test(j.Name) && /dental|dentist/i.test(j.Name));
  console.log('Chennai dental jobs',chennaiJobs.length);
  chennaiJobs.forEach(j=> console.log(j.ID, j.Status, j.Date, j.Name));
  console.log('\n--- analyzing each ---');
  let agg={total:0,withWebsite:0,withoutWebsite:0,gmail:0,gmailWithSite:0,gmailWithoutSite:0,uniqueGmail:0};
  let allGmailSet=new Set();
  const results=[];
  for(const j of chennaiJobs){
    const r=await analyze(j.ID, j.Name);
    console.log(JSON.stringify(r,null,2));
    results.push(r);
    if(!r.error){
      agg.total+=r.total||0;
      agg.withWebsite+=r.withWebsite||0;
      agg.withoutWebsite+=r.withoutWebsite||0;
      agg.gmail+=r.gmail||0;
      agg.gmailWithSite+=r.gmailWithSite||0;
      agg.gmailWithoutSite+=r.gmailWithoutSite||0;
    }
  }
  // Also check non-Chennai but still relevant? The phase1 job is included
  console.log('\n=== AGGREGATE Chennai dental (only jobs with dental+chennai) ===');
  console.log(JSON.stringify(agg,null,2));
  // Now deduplicate titles? But we can also check for overlapping clinics across jobs (duplicate titles)
  // Let's also count unique titles across all
  const titleSet=new Set();
  for(const j of chennaiJobs){
    try{
      const csv=await get('/api/v1/jobs/'+j.ID+'/download');
      if(csv.includes('csv file not found')) continue;
      const rows=parseCSV(csv);
      const titleIdx=rows[0].findIndex(c=>c==='title');
      for(let i=1;i<rows.length;i++) if(rows[i][titleIdx]) titleSet.add(rows[i][titleIdx].trim().toLowerCase());
    }catch(e){}
  }
  console.log('unique title count across chennai dental jobs',titleSet.size);
  console.log([...titleSet].slice(0,20));
})();
