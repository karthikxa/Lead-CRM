const http = require('http');

async function graphql(query, variables = {}, headers = {}, endpoint = '/metadata') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });
    const req = http.request(`http://localhost:3000${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function test() {
  const token = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjZjZWQ4ZDE4LTRhZjMtNGQ5OC1hZjc2LTJjYmQyYTNmNGI0OCJ9.eyJ0eXBlIjoiTE9HSU4iLCJzdWIiOiJiYWx1bml0aHlhcHJpeWFAZ21haWwuY29tIiwid29ya3NwYWNlSWQiOiI2ODAyNzZhNS02MWRiLTRjNTMtYTc3Zi0wZDUzOTUwYzMwNGQiLCJhdXRoUHJvdmlkZXIiOiJnb29nbGUiLCJpYXQiOjE3ODgwNjQzNzAsImV4cCI6MTc4ODA2NTI3MH0.dEw7Wklu7XMM67xOWYq8ClomO6UptLzOz8OvxyH5TwtpUSDEKN-4izj3ztFFVUFsvVyBQR45pLJGVZzbP3lk5A';

  console.log('--- 1. Testing getAuthTokensFromLoginToken ---');
  const query1 = `
    mutation GetAuthTokensFromLoginToken($loginToken: String!, $origin: String!) {
      getAuthTokensFromLoginToken(loginToken: $loginToken, origin: $origin) {
        tokens {
          accessOrWorkspaceAgnosticToken {
            token
            expiresAt
          }
          refreshToken {
            token
            expiresAt
          }
        }
      }
    }
  `;
  const res1 = await graphql(query1, { loginToken: token, origin: 'http://localhost:3000' });
  console.log('Result 1:', JSON.stringify(res1.data, null, 2));

  if (!res1.data?.data?.getAuthTokensFromLoginToken?.tokens) {
    console.error('getAuthTokensFromLoginToken failed!');
    return;
  }

  const accessToken = res1.data.data.getAuthTokensFromLoginToken.tokens.accessOrWorkspaceAgnosticToken.token;

  console.log('--- 2. Testing CurrentUser query with Access Token on /metadata ---');
  const query2 = `
    query CurrentUser {
      currentUser {
        id
        email
        onboardingStatus
        currentWorkspace {
          id
          displayName
        }
      }
    }
  `;
  const res2 = await graphql(query2, {}, {
    'Authorization': `Bearer ${accessToken}`
  }, '/metadata');
  console.log('Result 2:', JSON.stringify(res2.data, null, 2));

  console.log('--- 3. Testing People query on /graphql ---');
  const query3 = `
    query FindManyPeople {
      people {
        edges {
          node {
            id
            name {
              firstName
              lastName
            }
          }
        }
      }
    }
  `;
  const res3 = await graphql(query3, {}, {
    'Authorization': `Bearer ${accessToken}`
  }, '/graphql');
  console.log('Result 3:', JSON.stringify(res3.data, null, 2));
}

test().catch(console.error);
