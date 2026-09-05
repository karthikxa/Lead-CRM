const { Client } = require('pg');
async function main(){
  const c=new Client({connectionString:process.env.PG_DATABASE_URL||'postgres://postgres:0d8ff9694687b3817867b2fc95511775@db:5432/default'});
  await c.connect();
  const sch=(await c.query(`SELECT table_schema FROM information_schema.tables WHERE table_schema LIKE 'workspace_%' AND table_name='task' LIMIT 1`)).rows[0].table_schema;
  // Check core metadata
  const fm=await c.query(`SELECT id, name, label, type, "isNullable" FROM core."fieldMetadata" WHERE "objectMetadataId"=(SELECT id FROM core."objectMetadata" WHERE "namePlural"='tasks' LIMIT 1) AND name='status'`);
  console.log('fieldMetadata status',fm.rows);
  if(fm.rows[0]){
    const opts=await c.query(`SELECT * FROM core."fieldMetadata" WHERE id=$1`, [fm.rows[0].id]);
    console.log('full',JSON.stringify(opts.rows[0],null,2).substring(0,1200));
  }
  const view=await c.query(`SELECT id, name FROM core."view" WHERE "objectMetadataId"=(SELECT id FROM core."objectMetadata" WHERE "namePlural"='tasks' LIMIT 1) LIMIT 5`);
  console.log('views for tasks',view.rows);
  for(let v of view.rows){
    const vf=await c.query(`SELECT "fieldMetadataId", "isVisible", position FROM core."viewField" WHERE "viewId"=$1 ORDER BY position`, [v.id]);
    console.log('view',v.name, vf.rows);
  }
  const taskCols=await c.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema=$1 AND table_name='task'`, [sch]);
  console.log('task columns', taskCols.rows.filter(r=>r.column_name.includes('status') || r.column_name==='title').map(r=>r.column_name+':'+r.data_type));
  await c.end();
}
main().catch(e=>console.error(e));
