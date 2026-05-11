import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgres://postgres:HqevaBJffno0GU6SJFtONsJfxsODJvKkKEM3FQCB8mdOgat9azm6WOSyddPQ8vB6@159.65.170.55:5000/postgres'
});

async function run() {
  await client.connect();
  await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE');
  console.log('Column is_admin ensured');

  const targetEmail = 'studynafizsadik@gmail.com';
  const result = await client.query(
    'UPDATE users SET is_admin = TRUE WHERE LOWER(email) = LOWER($1) RETURNING id, email, is_admin',
    [targetEmail]
  );

  if (result.rowCount > 0) {
    console.log('SUCCESS! Admin granted to:', result.rows[0].email);
  } else {
    console.log('User not found. Listing existing users:');
    const users = await client.query('SELECT id, email, is_verified FROM users ORDER BY created_at DESC LIMIT 5');
    console.table(users.rows);
  }

  await client.end();
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
