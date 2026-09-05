const { Daytona } = require('@daytona/sdk');

async function removeDemoCompanies() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('Removing demo companies (Airbnb, Anthropic, Stripe, Figma, Notion)...');
  const res = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "DELETE FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"company\\" WHERE name IN ('Airbnb', 'Anthropic', 'Stripe', 'Figma', 'Notion');"
    docker exec zed-db-1 psql -U postgres -d default -c "DELETE FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" WHERE \\"emailsPrimaryEmail\\" IN ('chesky@airbnb.com', 'amodei@anthropic.com', 'collison@stripe.com', 'field@figma.com', 'zhao@notion.com');"
  `);
  console.log('Cleanup result:\n', res.result);

  const remaining = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c 'SELECT id, name FROM workspace_b4ai6k0t73ulj4l40gxarowdm."company";'
  `);
  console.log('Your actual Companies:\n', remaining.result);
}

removeDemoCompanies().catch(console.error);
