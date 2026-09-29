const http=require('http');
function get(p){return new Promise((res,rej)=>{http.get('http://gmaps-scraper:8080'+p,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d))}).on('error',rej)})}
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
  if(csv.includes('csv file not found')) return {id,label,error:'not ready'};
  const rows=parseCSV(csv);
  const header=rows[0];
  const websiteIdx=header.findIndex(c=>c.toLowerCase().includes('website'));
  const emailsIdx=header.findIndex(c=>c.toLowerCase()==='emails');
  const titleIdx=header.findIndex(c=>c==='title');
  let total=0,withWebsite=0,withoutWebsite=0,gmail=0,gmailWithSite=0,gmailWithoutSite=0;
  let gmailSet=new Set();
  let titleSet=new Set();
  let gmailList=[];
  for(let i=1;i<rows.length;i++){
    const r=rows[i]; if(!r[titleIdx] || r[titleIdx].trim()==='') continue;
    total++;
    const title=r[titleIdx].trim();
    titleSet.add(title.toLowerCase());
    const website=(r[websiteIdx]||'').trim();
    const hasWebsite=website.length>0 && website.startsWith('http');
    if(hasWebsite) withWebsite++; else withoutWebsite++;
    const emailsRaw=(r[emailsIdx]||'').trim();
    if(/gmail\.com/i.test(emailsRaw)){
      gmail++;
      if(hasWebsite) gmailWithSite++; else gmailWithoutSite++;
      const ms=emailsRaw.match(/[A-Za-z0-9._%+-]+@gmail\.com/gi);
      if(ms) ms.forEach(m=>{gmailSet.add(m.toLowerCase().replace('%20','').trim()); gmailList.push({title, website, email:m.toLowerCase()})});
    }
  }
  return {id,label,total,withWebsite,withoutWebsite,gmail,gmailWithSite,gmailWithoutSite,uniqueGmail:gmailSet.size,uniqueTitles:titleSet.size, bytes:csv.length, gmailList: gmailList.slice(0,3)};
}
(async()=>{
  const mapping=[
    ['04dde045-51f2-4c33-9c29-8d3980c3d130','Anna Nagar'],
    ['358103f9-31cc-4351-9abf-6d3d2b430df4','T Nagar'],
    ['e9483f83-6ade-42f5-ad4b-827ef6636ae3','Velachery'],
    ['8d787cc3-1a5f-417a-a751-7d9b855d804d','Adyar'],
    ['49295332-cc9f-4cff-8148-540a66495a89','Tambaram'],
    ['cd360661-587b-4379-af57-89e570938e2b','Porur'],
    ['908197f3-af6f-43e9-95db-b562695c3f29','Ambattur'],
    ['e9f2eb01-7a33-40b2-960e-a523df037701','Avadi'],
    ['fabea41e-0a9f-4dbe-a0d3-d9511f986c61','Perungudi'],
    ['0cc1766a-0d7f-42af-863b-c66a977d007f','Mylapore'],
  ];
  console.log('=== Per Location Breakdown (10 Chennai locations, depth2, email true, via gmaps-scraper:8080) ===');
  let aggTotal=0, aggWith=0, aggWithout=0, aggGmail=0, aggGmailWith=0, aggGmailWithout=0;
  let allGmailSet=new Set();
  let allTitleSet=new Set();
  let allGmailList=[];
  const results=[];
  for(const [id, loc] of mapping){
    const r=await analyze(id, loc);
    console.log(`\n--- ${loc} (${id.slice(0,8)}) ---`);
    console.log(JSON.stringify(r,null,2));
    results.push(r);
    aggTotal+=r.total||0;
    aggWith+=r.withWebsite||0;
    aggWithout+=r.withoutWebsite||0;
    aggGmail+=r.gmail||0;
    aggGmailWith+=r.gmailWithSite||0;
    aggGmailWithout+=r.gmailWithoutSite||0;
    // For dedup, need to fetch again? Instead collect titles and gmails from this run via re-parsing (we already have per-location sets but not global, so iterate again)
    // We'll do global dedup via fetching titles directly
    const csv=await get('/api/v1/jobs/'+id+'/download');
    const rows=parseCSV(csv);
    const header=rows[0];
    const titleIdx=header.findIndex(c=>c==='title');
    const emailsIdx=header.findIndex(c=>c.toLowerCase()==='emails');
    for(let i=1;i<rows.length;i++){
      const t=(rows[i][titleIdx]||'').trim().toLowerCase();
      if(t) allTitleSet.add(t);
      const em=(rows[i][emailsIdx]||'');
      const ms=em.match(/[A-Za-z0-9._%+-]+@gmail\.com/gi);
      if(ms) ms.forEach(m=>{allGmailSet.add(m.toLowerCase().replace('%20','').trim()); allGmailList.push(m.toLowerCase())});
    }
  }
  console.log('\n=== AGGREGATE 10 locations (raw sum, includes duplicates across locations) ===');
  console.log(JSON.stringify({aggTotal, aggWith, aggWithout, aggGmail, aggGmailWith, aggGmailWithout},null,2));
  console.log('\n=== DEDUPLICATED counts across 10 locations ===');
  console.log(`Unique clinic titles: ${allTitleSet.size} (out of raw sum ${aggTotal})`);
  console.log(`Unique gmail addresses: ${allGmailSet.size} (raw gmail entries ${aggGmail})`);
  console.log(`Unique gmail list sample 20:`, [...allGmailSet].slice(0,20));

  // Also include older Phase1 and other Chennai jobs for full picture vs 450 goal
  console.log('\n=== Additional Chennai jobs (Phase1 etc) for context ===');
  const extraIds=[
    ['58661038-08fe-49b6-b107-703aeb6a77d0','Phase1 Chennai Dental 450 (general)'],
    ['476b27fb-26de-4bdb-8037-c384b0bc5da5','Anna Nagar older'],
    ['607dd006-6175-4837-94db-05d7d8ab7cb9','East Tambaram Selaiyur'],
    ['c95ae858-5dbc-4ee7-8321-1f368455255e','Mangadu Katupakkam'],
  ];
  for(const [id,label] of extraIds){
    try{ const r=await analyze(id,label); console.log(label, JSON.stringify({total:r.total,withWebsite:r.withWebsite,withoutWebsite:r.withoutWebsite,gmail:r.gmail,uniqueGmail:r.uniqueGmail},null,2)); }catch(e){ console.log(label,'error',e.message)}
  }

  console.log('\n=== GOAL vs ACTUAL ===');
  console.log(`Goal: 450 dental gmails`);
  console.log(`Actual from 10-location scrape (unique gmail): ${allGmailSet.size}`);
  console.log(`Actual from 10-location scrape (gmail entries raw): ${aggGmail}`);
  console.log(`Total clinics scraped (dedup titles): ${allTitleSet.size}`);
  console.log(`Total clinics scraped (raw sum): ${aggTotal}`);
  console.log(`With website (raw): ${aggWith}, without website (raw): ${aggWithout}`);
  console.log(`Gmail with website (raw): ${aggGmailWith}, gmail without website (raw): ${aggGmailWithout}`);
  console.log('Note: All gmail entries are with website (none without). To reach 450 gmail, need ~'+Math.ceil(450 / (allGmailSet.size/10))+' locations at current yield (~'+(allGmailSet.size/10).toFixed(1)+' unique gmail per location) or deeper depth / more keywords.');
})();
