const { Daytona } = require('@daytona/sdk');

async function cleanRemainingEmoji() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Strip any remaining emoji from all opportunities
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"opportunity\\"
      SET name = regexp_replace(name, '^[🤝📞🗓️\\s]+', '');
    "
  `);

  const res = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT name, stage, \\"phones\\", \\"emails\\", (\\"amountAmountMicros\\"/1000000) as inr_amount, to_char(\\"closeDate\\", 'Mon DD, YYYY') as meeting_date
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"opportunity\\"
      ORDER BY \\"closeDate\\" ASC;
    "
  `);
  console.log('Final Clean Opportunities:\n', res.result);
}

cleanRemainingEmoji().catch(console.error);
