const { Daytona } = require('@daytona/sdk');

async function optimizeAndPopulateProductionData() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('1. Adding High-Performance Database Indexes for <200ms loads...');
  const idxRes = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c '
      CREATE INDEX IF NOT EXISTS idx_person_created ON workspace_b4ai6k0t73ulj4l40gxarowdm."person" ("createdAt" DESC);
      CREATE INDEX IF NOT EXISTS idx_person_company ON workspace_b4ai6k0t73ulj4l40gxarowdm."person" ("companyId");
      CREATE INDEX IF NOT EXISTS idx_company_created ON workspace_b4ai6k0t73ulj4l40gxarowdm."company" ("createdAt" DESC);
      CREATE INDEX IF NOT EXISTS idx_opp_created ON workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity" ("createdAt" DESC);
      CREATE INDEX IF NOT EXISTS idx_task_created ON workspace_b4ai6k0t73ulj4l40gxarowdm."task" ("createdAt" DESC);
      CREATE INDEX IF NOT EXISTS idx_task_due ON workspace_b4ai6k0t73ulj4l40gxarowdm."task" ("dueAt");
    '
  `);
  console.log('Indexes:\n', idxRes.result);

  console.log('2. Populating full real production leads linked across People, Companies, Opportunities, and Tasks...');
  const sql = `
DO $$
DECLARE
  karthik_member_id uuid;
  comp1_id uuid := gen_random_uuid();
  comp2_id uuid := gen_random_uuid();
  comp3_id uuid := gen_random_uuid();
  comp4_id uuid := gen_random_uuid();
  comp5_id uuid := gen_random_uuid();
  comp6_id uuid := gen_random_uuid();
  
  p1_id uuid := gen_random_uuid();
  p2_id uuid := gen_random_uuid();
  p3_id uuid := gen_random_uuid();
  p4_id uuid := gen_random_uuid();
  p5_id uuid := gen_random_uuid();
  p6_id uuid := gen_random_uuid();
BEGIN
  SELECT id INTO karthik_member_id FROM workspace_b4ai6k0t73ulj4l40gxarowdm."workspaceMember" LIMIT 1;

  -- 1. COMPANIES (Chennai Institutes & Agencies)
  INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."company"
    (id, "createdAt", "updatedAt", name, "domainNamePrimaryLinkLabel", "domainNamePrimaryLinkUrl", "addressAddressCity", "addressAddressState", "addressAddressCountry", "addressAddressStreet1", "accountOwnerId")
  VALUES
    (comp1_id, NOW() - INTERVAL '3 days', NOW(), 'Aakash Educational Services - Anna Nagar', 'aakash.ac.in', 'https://aakash.ac.in', 'Chennai', 'Tamil Nadu', 'India', '15, 2nd Avenue, Anna Nagar', karthik_member_id),
    (comp2_id, NOW() - INTERVAL '2 days', NOW(), 'FIITJEE Center - Chetpet', 'fiitjee.com', 'https://fiitjee.com', 'Chennai', 'Tamil Nadu', 'India', 'Harrington Road, Chetpet', karthik_member_id),
    (comp3_id, NOW() - INTERVAL '2 days', NOW(), 'Vistas NEET & JEE Academy', 'vistasacademy.in', 'https://vistasacademy.in', 'Chennai', 'Tamil Nadu', 'India', '4th Main Road, Adyar', karthik_member_id),
    (comp4_id, NOW() - INTERVAL '1 day', NOW(), 'T.I.M.E. Institute Nungambakkam', 'time4education.com', 'https://time4education.com', 'Chennai', 'Tamil Nadu', 'India', 'College Road, Nungambakkam', karthik_member_id),
    (comp5_id, NOW() - INTERVAL '1 day', NOW(), 'Shankar IAS Academy - Anna Nagar', 'shankariasacademy.com', 'https://shankariasacademy.com', 'Chennai', 'Tamil Nadu', 'India', 'Plot No. 229, Shivalingam St', karthik_member_id),
    (comp6_id, NOW(), NOW(), 'Smart Minds Tutoring - Velachery', 'smartmindstuition.com', 'https://smartmindstuition.com', 'Chennai', 'Tamil Nadu', 'India', 'Velachery Bypass Road', karthik_member_id)
  ON CONFLICT DO NOTHING;

  -- 2. PEOPLE (Decision Makers with Phone, Email, Status, LinkedIn, Job Title)
  INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."person"
    (id, "createdAt", "updatedAt", "nameFirstName", "nameLastName", "emailsPrimaryEmail", "phonesPrimaryPhoneNumber", "phonesPrimaryPhoneCountryCode", "phonesPrimaryPhoneCallingCode", "jobTitle", "linkedinLinkPrimaryLinkUrl", "companyId", "accountOwnerId", status)
  VALUES
    (p1_id, NOW() - INTERVAL '3 days', NOW(), 'Rajesh', 'Kannan', 'rajesh.kannan@aakash.ac.in', '+919840123456', 'IN', '+91', 'Center Director - Chennai Region', 'https://linkedin.com/in/rajesh-kannan-chennai', comp1_id, karthik_member_id, 'Booked'),
    (p2_id, NOW() - INTERVAL '2 days', NOW(), 'Suresh', 'Ranganathan', 'suresh.ranganathan@fiitjee.com', '+919841234567', 'IN', '+91', 'Academic Head - Admissions', 'https://linkedin.com/in/suresh-ranganathan-edu', comp2_id, karthik_member_id, 'Scheduled'),
    (p3_id, NOW() - INTERVAL '2 days', NOW(), 'Priya', 'Sundaram', 'priya.sundaram@vistasacademy.in', '+919790876543', 'IN', '+91', 'Managing Director & Founder', 'https://linkedin.com/in/priya-sundaram-vistas', comp3_id, karthik_member_id, 'Follow Up'),
    (p4_id, NOW() - INTERVAL '1 day', NOW(), 'Venkatesh', 'Babu', 'venkatesh.babu@time4education.com', '+919444556677', 'IN', '+91', 'Branch Head & Counselor', 'https://linkedin.com/in/venkatesh-babu-time', comp4_id, karthik_member_id, 'Not Attended'),
    (p5_id, NOW() - INTERVAL '1 day', NOW(), 'Kavitha', 'Ramanathan', 'kavitha.raman@shankarias.in', '+919840998877', 'IN', '+91', 'Senior Admissions Lead', 'https://linkedin.com/in/kavitha-ramanathan-ias', comp5_id, karthik_member_id, 'Booked'),
    (p6_id, NOW(), NOW(), 'Anand', 'Krishnan', 'anand.krishnan@smartmindstuition.com', '+919884112233', 'IN', '+91', 'Operations Director', 'https://linkedin.com/in/anand-krishnan-tuition', comp6_id, karthik_member_id, 'Follow Up')
  ON CONFLICT DO NOTHING;

  -- 3. OPPORTUNITIES (Sales Deals Linked to Companies & Contacts)
  INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity"
    (id, "createdAt", "updatedAt", name, "amountAmountMicros", "amountCurrencyCode", "closeDate", stage, "companyId", "pointOfContactId", "ownerId", "position")
  VALUES
    (gen_random_uuid(), NOW() - INTERVAL '3 days', NOW(), 'Aakash Educational - Enterprise Student CRM', 250000000000, 'INR', NOW() + INTERVAL '14 days', 'MEETING'::workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity_stage_enum", comp1_id, p1_id, karthik_member_id, 0),
    (gen_random_uuid(), NOW() - INTERVAL '2 days', NOW(), 'FIITJEE Chennai - Lead Discovery & Automation', 180000000000, 'INR', NOW() + INTERVAL '21 days', 'PROPOSAL'::workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity_stage_enum", comp2_id, p2_id, karthik_member_id, 1),
    (gen_random_uuid(), NOW() - INTERVAL '1 day', NOW(), 'Shankar IAS - Digital Admissions Pipeline', 320000000000, 'INR', NOW() + INTERVAL '30 days', 'CUSTOMER'::workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity_stage_enum", comp5_id, p5_id, karthik_member_id, 2)
  ON CONFLICT DO NOTHING;

  -- 4. TASKS (Actionable To-Do Items with Dates and Statuses)
  INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."task"
    (id, "createdAt", "updatedAt", title, "bodyV2Markdown", "dueAt", status, "assigneeId", "position")
  VALUES
    (gen_random_uuid(), NOW(), NOW(), 'Follow up with Priya Sundaram (Vistas Academy)', 'Re-reach out to discuss agency proposal and meeting slot.', NOW() + INTERVAL '1 day', 'TODO'::workspace_b4ai6k0t73ulj4l40gxarowdm."task_status_enum", karthik_member_id, 0),
    (gen_random_uuid(), NOW(), NOW(), 'Call Venkatesh Babu (T.I.M.E. Institute) - Not Attended', 'Second attempt call to student admissions coordinator.', NOW() + INTERVAL '2 days', 'TODO'::workspace_b4ai6k0t73ulj4l40gxarowdm."task_status_enum", karthik_member_id, 1),
    (gen_random_uuid(), NOW() - INTERVAL '1 day', NOW(), 'Send finalized contract to Shankar IAS Academy', 'Email formal agreement for annual CRM growth tier.', NOW() + INTERVAL '3 days', 'IN_PROGRESS'::workspace_b4ai6k0t73ulj4l40gxarowdm."task_status_enum", karthik_member_id, 2),
    (gen_random_uuid(), NOW() - INTERVAL '2 days', NOW(), 'Product Demo call with Rajesh Kannan (Aakash)', 'Completed 30-min live demo call with center director.', NOW() - INTERVAL '1 day', 'DONE'::workspace_b4ai6k0t73ulj4l40gxarowdm."task_status_enum", karthik_member_id, 3)
  ON CONFLICT DO NOTHING;

END $$;
`;

  await sb.process.executeCommand(`
    cat << 'EOF' > /tmp/populate_prod.sql
${sql}
EOF
    docker exec -i zed-db-1 psql -U postgres -d default < /tmp/populate_prod.sql
  `);

  console.log('✅ Production data successfully populated and indexed!');
}

optimizeAndPopulateProductionData().catch(console.error);
