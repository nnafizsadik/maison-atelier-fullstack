import pg from 'pg';
const { Client } = pg;

const connectionString = "postgres://postgres:HqevaBJffno0GU6SJFtONsJfxsODJvKkKEM3FQCB8mdOgat9azm6WOSyddPQ8vB6@159.65.170.55:5000/postgres";

async function grantAdmin() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const email = 'studynafizsadik@gmail.com';
    const res = await client.query(
      "UPDATE users SET is_admin = TRUE WHERE LOWER(email) = LOWER($1) RETURNING id, email, is_admin",
      [email]
    );
    if (res.rowCount === 0) {
      console.log(`[ERROR] User ${email} not found. Please sign up first!`);
    } else {
      console.log(`[SUCCESS] Admin power granted to: ${res.rows[0].email}`);
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

grantAdmin();
