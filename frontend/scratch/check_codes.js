import pg from 'pg';
const { Client } = pg;

const connectionString = "postgres://postgres:HqevaBJffno0GU6SJFtONsJfxsODJvKkKEM3FQCB8mdOgat9azm6WOSyddPQ8vB6@159.65.170.55:5000/postgres";

async function checkDatabase() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    // Check for the user
    const res = await client.query("SELECT id, email, is_verified, created_at FROM users ORDER BY created_at DESC LIMIT 10");
    console.log("\n--- LATEST USERS ---");
    console.table(res.rows);

    // Check for latest codes
    const codes = await client.query(`
      SELECT u.email, vc.code, vc.created_at 
      FROM verification_codes vc 
      JOIN users u ON vc.user_id = u.id 
      ORDER BY vc.created_at DESC LIMIT 5
    `);
    console.log("\n--- LATEST CODES SENT ---");
    console.table(codes.rows);

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

checkDatabase();
