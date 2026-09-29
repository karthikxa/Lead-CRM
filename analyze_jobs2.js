const http=require('http');
function get(path){return new Promise((res,rej)=>{http.get('http://gmaps-scraper:8080'+path,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d))}).on('error',rej)})}

// Proper CSV parser handling quoted fields
function parseCSV(csvText){
  const rows=[];
  let cur='';
  let row=[];
  let inQuote=false;
  for(let i=0;i<csvText.length;i++){
    const c=csvText[i];
    const next=csvText[i+1];
    if(c==='"'){
      if(inQuote && next==='"'){ cur+='"'; i++; }
      else { inQuote=!inQuote; }
    } else if(c===',' && !inQuote){
      row.push(cur); cur='';
    } else if((c==='\n' || c==='\r') && !inQuote){
      if(c==='\r' && next==='\n') i++;
      row.push(cur); cur='';
      if(row.length>1 || row[0]!=='') rows.push(row);
      row=[];
    } else {
      cur+=c;
    }
  }
  if(cur!=='' || row.length>0){ row.push(cur); rows.push(row); }
  return rows;
}

async function analyze(id,label){
  try{
    const csv=await get('/api/v1/jobs/'+id+'/download');
    if(csv.length<200 && csv.includes('csv file not found')){
      console.log('===',label,id,'NOT READY',csv.trim());
      return null;
    }
    console.log('===',label,id,'bytes',csv.length);
    const rows=parseCSV(csv);
    console.log('parsed rows',rows.length,'cols',rows[0].length);
    const header=rows[0];
    console.log('header',header);
    const websiteIdx = header.findIndex(c=>c.toLowerCase().includes('website'));
    const emailsIdx = header.findIndex(c=>c.toLowerCase()==='emails');
    console.log('websiteIdx',websiteIdx,'emailsIdx',emailsIdx);
    // print few rows for verification
    for(let i=1;i<Math.min(4,rows.length);i++){
      const r=rows[i];
      console.log(`row${i} title=${r[2]?.slice(0,60)} website=${r[websiteIdx]?.slice(0,80)} emails=${r[emailsIdx]?.slice(0,200)}`);
    }
    let total=0, withWebsite=0, withoutWebsite=0, gmail=0, gmailWithSite=0, gmailWithoutSite=0;
    let uniqueEmails=new Set();
    let gmailList=[];
    for(let i=1;i<rows.length;i++){
      const r=rows[i];
      if(r.length<=1) continue;
      // skip empty title?
      if(!r[2]) continue;
      total++;
      const website=(r[websiteIdx]||'').trim();
      const hasWebsite = website.length>0 && website.startsWith('http');
      if(hasWebsite) withWebsite++; else withoutWebsite++;
      const emailsRaw=(r[emailsIdx]||'').trim();
      // emails field may look like "[email]" or "a@gmail.com, b@gmail.com" or "[]"
      const hasGmail = /gmail\.com/i.test(emailsRaw);
      // Also check other columns for gmail? But spec says email:true scrapes emails column
      if(hasGmail){
        gmail++;
        if(hasWebsite) gmailWithSite++; else gmailWithoutSite++;
        // extract emails
        const matches=emailsRaw.match(/[A-Za-z0-9._%+-]+@gmail\.com/gi);
        if(matches) matches.forEach(m=>{ uniqueEmails.add(m.toLowerCase()); gmailList.push({title:r[2], website, email:m}); });
      }
    }
    console.log(JSON.stringify({label,total,withWebsite,withoutWebsite,gmail,gmailWithSite,gmailWithoutSite, uniqueGmailCount: uniqueEmails.size},null,2));
    if(gmailList.length>0){
      console.log('--- gmail samples ---');
      gmailList.slice(0,20).forEach(g=> console.log(g.email,' | ',g.title,' | ',g.website));
    }
    return {id,label,total,withWebsite,withoutWebsite,gmail,gmailWithSite,gmailWithoutSite, uniqueGmailCount: uniqueEmails.size, gmailList};
  }catch(e){console.error(e); return null}
}

(async()=>{
  const ids=[
    ['476b27fb-26de-4bdb-8037-c384b0bc5da5','Anna Nagar ok (476b)'],
    ['58661038-08fe-49b6-b107-703aeb6a77d0','Phase1 Chennai Dental 450 (5866)'],
    ['db0c8a06-5868-4e99-b3f8-d421a33654c4','T Nagar working (db0c)'],
  ];
  const results=[];
  for(const [id,label] of ids){
    const r=await analyze(id,label);
    results.push(r);
    console.log('------------------------------------\n');
  }
  // also list all jobs summary
  const txt=await get('/api/v1/jobs');
  const jobs=JSON.parse(txt);
  console.log('ALL JOBS SUMMARY latest 10');
  jobs.slice(0,10).forEach(j=> console.log(j.ID.slice(0,8), j.Status, j.Name, JSON.stringify(j.Data.keywords).slice(0,120)));

  // aggregate totals for completed Chennai dental jobs
  const completed = results.filter(r=>r);
  let sumTotal=0,sumWith=0,sumWithout=0,sumGmail=0,sumGmailWith=0,sumGmailWithout=0;
  completed.forEach(r=>{ sumTotal+=r.total; sumWith+=r.withWebsite; sumWithout+=r.withoutWebsite; sumGmail+=r.gmail; sumGmailWith+=r.gmailWithSite; sumGmailWithout+=r.gmailWithoutSite; });
  console.log('AGGREGATE completed',JSON.stringify({sumTotal,sumWith,sumWithout,sumGmail,sumGmailWith,sumGmailWithout},null,2));
})();
