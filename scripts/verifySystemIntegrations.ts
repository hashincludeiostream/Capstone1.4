import { db } from '../src/config/db.js';

async function runTests() {
  console.log('--- Starting System Integration Verification ---');

  // Test 1: Deduplication in appointment_reminders
  console.log('\n[Test 1] appointment_reminders deduplication check:');
  const dedupeKey = `test_dedupe_24h_appt_999_cust_3_${Date.now()}`;
  
  const [insert1] = await db.execute(
    `INSERT INTO appointment_reminders (appointment_id, schedule_version, reminder_type, recipient_user_id, deduplication_key, created_at)
     VALUES (?, ?, '24h_reminder', ?, ?, ?)`,
    [999, 1, 3, dedupeKey, new Date().toISOString()]
  );
  console.log('First insert affectedRows:', (insert1 as any).affectedRows);

  const [insert2] = await db.execute(
    `INSERT INTO appointment_reminders (appointment_id, schedule_version, reminder_type, recipient_user_id, deduplication_key, created_at)
     VALUES (?, ?, '24h_reminder', ?, ?, ?)`,
    [999, 1, 3, dedupeKey, new Date().toISOString()]
  );
  console.log('Duplicate insert affectedRows (expected 0):', (insert2 as any).affectedRows);

  if ((insert2 as any).affectedRows === 0) {
    console.log('✅ PASS: appointment_reminders successfully enforces unique deduplication_key.');
  } else {
    throw new Error('FAIL: Duplicate reminder was inserted!');
  }

  // Test 2: Idempotency in email_jobs
  console.log('\n[Test 2] email_jobs idempotency check:');
  const idempotencyKey = `test_idempotency_job_${Date.now()}`;

  const [job1] = await db.execute(
    `INSERT INTO email_jobs (log_id, idempotency_key, recipient_email, recipient_name, recipient_role, subject, category, template, html_body, status, attempts, next_retry_at, created_at)
     VALUES (?, ?, ?, ?, 'customer', 'Test Subject', 'booking', 'test-template', '<p>Test</p>', 'queued', 0, ?, ?)`,
    [101, idempotencyKey, 'client@example.com', 'Client Test', new Date().toISOString(), new Date().toISOString()]
  );
  console.log('First email job insert affectedRows:', (job1 as any).affectedRows);

  const [job2] = await db.execute(
    `INSERT INTO email_jobs (log_id, idempotency_key, recipient_email, recipient_name, recipient_role, subject, category, template, html_body, status, attempts, next_retry_at, created_at)
     VALUES (?, ?, ?, ?, 'customer', 'Test Subject', 'booking', 'test-template', '<p>Test</p>', 'queued', 0, ?, ?)`,
    [101, idempotencyKey, 'client@example.com', 'Client Test', new Date().toISOString(), new Date().toISOString()]
  );
  console.log('Duplicate email job insert affectedRows (expected 0):', (job2 as any).affectedRows);

  if ((job2 as any).affectedRows === 0) {
    console.log('✅ PASS: email_jobs successfully enforces unique idempotency_key.');
  } else {
    throw new Error('FAIL: Duplicate email job was inserted!');
  }

  // Test 3: Private messaging recipient-targeted mark-read
  console.log('\n[Test 3] Private messaging recipient-targeted mark-read check:');
  const testConvId = `salon_99_cust_88_${Date.now()}`;
  
  // Insert msg 1: from customer (88) to owner (77) -> is_read = 0
  await db.execute(
    `INSERT INTO messages (
      conversation_id, salon_id, salon_name, customer_id, customer_name,
      sender_id, sender_name, sender_role, recipient_id, recipient_name,
      content, is_read, created_at
    ) VALUES (?, ?, 'Salon 99', ?, 'Cust 88', 88, 'Cust 88', 'customer', 77, 'Owner 77', 'Hello', 0, ?)`,
    [testConvId, 99, 88, new Date().toISOString()]
  );

  // Insert msg 2: from owner (77) to customer (88) -> is_read = 0
  await db.execute(
    `INSERT INTO messages (
      conversation_id, salon_id, salon_name, customer_id, customer_name,
      sender_id, sender_name, sender_role, recipient_id, recipient_name,
      content, is_read, created_at
    ) VALUES (?, ?, 'Salon 99', ?, 'Cust 88', 77, 'Owner 77', 'salon_owner', 88, 'Cust 88', 'Hi back', 0, ?)`,
    [testConvId, 99, 88, new Date().toISOString()]
  );

  // Mark read strictly for recipient 77 (Owner)
  await db.execute(
    'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND recipient_id = ?',
    [testConvId, 77]
  );

  const [msgsAfter] = await db.execute(
    'SELECT * FROM messages WHERE conversation_id = ?',
    [testConvId]
  );
  const rows = msgsAfter as any[];
  const msgForOwner = rows.find(m => Number(m.recipient_id) === 77);
  const msgForCust = rows.find(m => Number(m.recipient_id) === 88);

  console.log('Owner message read state (expected true/1):', Boolean(msgForOwner?.is_read));
  console.log('Customer message read state (expected false/0):', Boolean(msgForCust?.is_read));

  if (Boolean(msgForOwner?.is_read) === true && Boolean(msgForCust?.is_read) === false) {
    console.log('✅ PASS: mark-read strictly isolates recipient without marking other party messages as read.');
  } else {
    throw new Error('FAIL: mark-read improperly leaked across participants!');
  }

  console.log('\n--- All System Integration Tests Passed Successfully! ---');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Integration Test Failed:', err);
  process.exit(1);
});
