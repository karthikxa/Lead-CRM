const fs=require('fs');
const p='/app/packages/twenty-server/dist/main.js';
let data=fs.readFileSync(p,'utf8');
if(data.includes('/api/admin/people/list')){
  console.log('already');
  process.exit(0);
}
const ins = `
        app.use('/api/admin/people/list', async (req, res) => {
            try {
                const client = await leadScraperService.getDbClient();
                const schema = await leadScraperService.getWorkspaceSchema(client);
                const peopleRes = await client.query('SELECT p.id, p."nameFirstName", p."nameLastName", p."emailsPrimaryEmail", p."phonesPrimaryPhoneNumber", p."jobTitle", p."leadStatus", p."assignedToId" FROM "' + schema + '"."person" p WHERE p."deletedAt" IS NULL ORDER BY p."createdAt" DESC LIMIT 100');
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
                res.json({ success: true, updatedCount: upd.rowCount });
            } catch (e) { res.status(500).json({ success: false, error: e.message }); }
        });
`;
data=data.replace("console.log('[Zed] Mounted Admin Lead Scraper", ins + "console.log('[Zed] Mounted Admin Lead Scraper");
fs.writeFileSync(p,data,'utf8');
console.log('patched');
