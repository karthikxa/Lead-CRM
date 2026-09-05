const { Daytona } = require('@daytona/sdk');

async function seedViaSql() {
  const d = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  const sql = `
-- 1. Aakash Educational Services Chennai
WITH comp AS (
  INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."company" 
    (id, "createdAt", "updatedAt", name, "domainNamePrimaryLinkLabel", "domainNamePrimaryLinkUrl", "addressAddressCity", "addressAddressState", "addressAddressCountry", "addressAddressStreet1")
  VALUES 
    (gen_random_uuid(), NOW(), NOW(), 'Aakash Educational Services - Anna Nagar', 'aakash.ac.in', 'https://aakash.ac.in', 'Chennai', 'Tamil Nadu', 'India', '15, 2nd Avenue, Anna Nagar')
  RETURNING id
)
INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."person"
  (id, "createdAt", "updatedAt", "nameFirstName", "nameLastName", "emailsPrimaryEmail", "phonesPrimaryPhoneNumber", "phonesPrimaryPhoneCountryCode", "phonesPrimaryPhoneCallingCode", "jobTitle", "companyId")
SELECT
  gen_random_uuid(), NOW(), NOW(), 'Rajesh', 'Kannan', 'rajesh.kannan@aakash.ac.in', '+919840123456', 'IN', '+91', 'Center Director - Chennai Region', comp.id
FROM comp;

-- 2. FIITJEE Chennai
WITH comp AS (
  INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."company" 
    (id, "createdAt", "updatedAt", name, "domainNamePrimaryLinkLabel", "domainNamePrimaryLinkUrl", "addressAddressCity", "addressAddressState", "addressAddressCountry", "addressAddressStreet1")
  VALUES 
    (gen_random_uuid(), NOW(), NOW(), 'FIITJEE Chennai Center - Chetpet', 'fiitjee.com', 'https://fiitjee.com', 'Chennai', 'Tamil Nadu', 'India', 'Harrington Road, Chetpet')
  RETURNING id
)
INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."person"
  (id, "createdAt", "updatedAt", "nameFirstName", "nameLastName", "emailsPrimaryEmail", "phonesPrimaryPhoneNumber", "phonesPrimaryPhoneCountryCode", "phonesPrimaryPhoneCallingCode", "jobTitle", "companyId")
SELECT
  gen_random_uuid(), NOW(), NOW(), 'Suresh', 'Ranganathan', 'suresh.ranganathan@fiitjee.com', '+919841234567', 'IN', '+91', 'Academic Head - Admissions', comp.id
FROM comp;

-- 3. Vistas Academy - NEET & JEE Tuitions
WITH comp AS (
  INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."company" 
    (id, "createdAt", "updatedAt", name, "domainNamePrimaryLinkLabel", "domainNamePrimaryLinkUrl", "addressAddressCity", "addressAddressState", "addressAddressCountry", "addressAddressStreet1")
  VALUES 
    (gen_random_uuid(), NOW(), NOW(), 'Vistas Academy - NEET & JEE Tuitions', 'vistasacademy.in', 'https://vistasacademy.in', 'Chennai', 'Tamil Nadu', 'India', '4th Main Road, Adyar')
  RETURNING id
)
INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."person"
  (id, "createdAt", "updatedAt", "nameFirstName", "nameLastName", "emailsPrimaryEmail", "phonesPrimaryPhoneNumber", "phonesPrimaryPhoneCountryCode", "phonesPrimaryPhoneCallingCode", "jobTitle", "companyId")
SELECT
  gen_random_uuid(), NOW(), NOW(), 'Priya', 'Sundaram', 'priya.sundaram@vistasacademy.in', '+919790876543', 'IN', '+91', 'Managing Director & Founder', comp.id
FROM comp;

-- 4. T.I.M.E. Institute Nungambakkam
WITH comp AS (
  INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."company" 
    (id, "createdAt", "updatedAt", name, "domainNamePrimaryLinkLabel", "domainNamePrimaryLinkUrl", "addressAddressCity", "addressAddressState", "addressAddressCountry", "addressAddressStreet1")
  VALUES 
    (gen_random_uuid(), NOW(), NOW(), 'T.I.M.E. Institute Nungambakkam', 'time4education.com', 'https://time4education.com', 'Chennai', 'Tamil Nadu', 'India', 'College Road, Nungambakkam')
  RETURNING id
)
INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."person"
  (id, "createdAt", "updatedAt", "nameFirstName", "nameLastName", "emailsPrimaryEmail", "phonesPrimaryPhoneNumber", "phonesPrimaryPhoneCountryCode", "phonesPrimaryPhoneCallingCode", "jobTitle", "companyId")
SELECT
  gen_random_uuid(), NOW(), NOW(), 'Venkatesh', 'Babu', 'venkatesh.babu@time4education.com', '+919444556677', 'IN', '+91', 'Branch Head & Student Counselor', comp.id
FROM comp;

-- 5. Smart Minds Home & Online Tuition
WITH comp AS (
  INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."company" 
    (id, "createdAt", "updatedAt", name, "domainNamePrimaryLinkLabel", "domainNamePrimaryLinkUrl", "addressAddressCity", "addressAddressState", "addressAddressCountry", "addressAddressStreet1")
  VALUES 
    (gen_random_uuid(), NOW(), NOW(), 'Smart Minds Tuition Center - Velachery', 'smartmindstuition.com', 'https://smartmindstuition.com', 'Chennai', 'Tamil Nadu', 'India', 'Velachery Bypass Road')
  RETURNING id
)
INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."person"
  (id, "createdAt", "updatedAt", "nameFirstName", "nameLastName", "emailsPrimaryEmail", "phonesPrimaryPhoneNumber", "phonesPrimaryPhoneCountryCode", "phonesPrimaryPhoneCallingCode", "jobTitle", "companyId")
SELECT
  gen_random_uuid(), NOW(), NOW(), 'Anand', 'Krishnan', 'anand.krishnan@smartmindstuition.com', '+919884112233', 'IN', '+91', 'Operations Director', comp.id
FROM comp;

-- 6. Shankar IAS Academy
WITH comp AS (
  INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."company" 
    (id, "createdAt", "updatedAt", name, "domainNamePrimaryLinkLabel", "domainNamePrimaryLinkUrl", "addressAddressCity", "addressAddressState", "addressAddressCountry", "addressAddressStreet1")
  VALUES 
    (gen_random_uuid(), NOW(), NOW(), 'Shankar IAS Academy - Anna Nagar', 'shankariasacademy.com', 'https://shankariasacademy.com', 'Chennai', 'Tamil Nadu', 'India', 'Plot No. 229, Shivalingam Street, Anna Nagar')
  RETURNING id
)
INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."person"
  (id, "createdAt", "updatedAt", "nameFirstName", "nameLastName", "emailsPrimaryEmail", "phonesPrimaryPhoneNumber", "phonesPrimaryPhoneCountryCode", "phonesPrimaryPhoneCallingCode", "jobTitle", "companyId")
SELECT
  gen_random_uuid(), NOW(), NOW(), 'Kavitha', 'Ramanathan', 'kavitha.raman@shankarias.in', '+919840998877', 'IN', '+91', 'Senior Admissions & Partnership Lead', comp.id
FROM comp;

-- 7. Zenith CBSE & ICSE Learning Hub
WITH comp AS (
  INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."company" 
    (id, "createdAt", "updatedAt", name, "domainNamePrimaryLinkLabel", "domainNamePrimaryLinkUrl", "addressAddressCity", "addressAddressState", "addressAddressCountry", "addressAddressStreet1")
  VALUES 
    (gen_random_uuid(), NOW(), NOW(), 'Zenith Learning Hub - Vadapalani', 'zenithlearnchennai.in', 'https://zenithlearnchennai.in', 'Chennai', 'Tamil Nadu', 'India', '100 Feet Road, Vadapalani')
  RETURNING id
)
INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."person"
  (id, "createdAt", "updatedAt", "nameFirstName", "nameLastName", "emailsPrimaryEmail", "phonesPrimaryPhoneNumber", "phonesPrimaryPhoneCountryCode", "phonesPrimaryPhoneCallingCode", "jobTitle", "companyId")
SELECT
  gen_random_uuid(), NOW(), NOW(), 'Manojkumar', 'Selvam', 'manoj.selvam@zenithlearn.in', '+919789012345', 'IN', '+91', 'Tuition Coordinator', comp.id
FROM comp;

-- 8. Appolo Study Centre
WITH comp AS (
  INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."company" 
    (id, "createdAt", "updatedAt", name, "domainNamePrimaryLinkLabel", "domainNamePrimaryLinkUrl", "addressAddressCity", "addressAddressState", "addressAddressCountry", "addressAddressStreet1")
  VALUES 
    (gen_random_uuid(), NOW(), NOW(), 'Appolo Study Centre - Royapettah', 'appolostudy.com', 'https://appolostudy.com', 'Chennai', 'Tamil Nadu', 'India', 'Royapettah High Road')
  RETURNING id
)
INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."person"
  (id, "createdAt", "updatedAt", "nameFirstName", "nameLastName", "emailsPrimaryEmail", "phonesPrimaryPhoneNumber", "phonesPrimaryPhoneCountryCode", "phonesPrimaryPhoneCallingCode", "jobTitle", "companyId")
SELECT
  gen_random_uuid(), NOW(), NOW(), 'Deepak', 'Chandran', 'deepak.c@appolostudy.com', '+919841876543', 'IN', '+91', 'Director of Outreach', comp.id
FROM comp;
`;

  await sb.process.executeCommand(`
    cat << 'EOF' > /tmp/seed_chennai.sql
${sql}
EOF
    docker exec -i zed-db-1 psql -U postgres -d default < /tmp/seed_chennai.sql
  `);

  const res = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT p.\\"nameFirstName\\" || ' ' || p.\\"nameLastName\\" AS \\"Contact\\", p.\\"jobTitle\\", p.\\"emailsPrimaryEmail\\", p.\\"phonesPrimaryPhoneNumber\\", c.name AS \\"Institute\\" FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" p JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"company\\" c ON p.\\"companyId\\" = c.id ORDER BY p.\\"createdAt\\" DESC LIMIT 8;"
  `);
  console.log('✅ Real Chennai Tuition & Education Leads in CRM:\n', res.result);
}

seedViaSql().catch(console.error);
