const fs=require('fs');
const p='/app/packages/twenty-server/dist/main.js';
let c=fs.readFileSync(p,'utf8');
if(!c.includes('/api/admin/people/list')){
  const ins = `
        app.use('/api/admin/people/list', async (req, res) => {
            try {
                const client = await leadScraperService.getDbClient();
                const schema = await leadScraperService.getWorkspaceSchema(client);
                const peopleRes = await client.query('SELECT p.id, p."nameFirstName", p."nameLastName", p."emailsPrimaryEmail", p."phonesPrimaryPhoneNumber", p."jobTitle", p."leadStatus", p."assignedToId", p."assignedById", p."companyId", c.name as "companyName", m."nameFirstName" as "assigneeFirst", m."nameLastName" as "assigneeLast", m."userEmail" as "assigneeEmail" FROM "' + schema + '"."person" p LEFT JOIN "' + schema + '"."company" c ON p."companyId"=c.id LEFT JOIN "' + schema + '"."workspaceMember" m ON p."assignedToId"=m.id WHERE p."deletedAt" IS NULL ORDER BY p."createdAt" DESC LIMIT 100'.replace(/'/g,"'"));
                await client.end();
                res.json({ success: true, people: peopleRes.rows });
            } catch (e) { res.status(500).json({ success: false, error: e.message }); }
        });
        app.use('/api/admin/people/assign', async (req, res) => {
            if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
            try {
                const { personIds, memberId } = req.body || {};
                if (!Array.isArray(personIds) || !memberId) return res.status(400).json({ success: false, error: 'personIds and memberId required' });
                const client = await leadScraperService.getDbClient();
                const schema = await leadScraperService.getWorkspaceSchema(client);
                const upd = await client.query('UPDATE "' + schema + '"."person" SET "assignedToId"=$1, "assignedById"=$1, "updatedAt"=NOW() WHERE id = ANY($2::uuid[]) RETURNING id', [memberId, personIds]);
                await client.end();
                res.json({ success: true, updatedCount: upd.rowCount, ids: upd.rows.map(r=>r.id) });
            } catch (e) { res.status(500).json({ success: false, error: e.message }); }
        });
        console.log('[Zed] Mounted people assign');
`;
  // This approach is fragile due to string replacement, use simpler: insert before the existing log
  c = c.replace("console.log('[Zed] Mounted Admin Lead Scraper & Deduplication API endpoints!');", ins + "\n        console.log('[Zed] Mounted Admin Lead Scraper & Deduplication API endpoints!');");
  fs.writeFileSync(p,c,'utf8');
  console.log('patched people api');
} else console.log('already patched');
