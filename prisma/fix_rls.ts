import pg from 'pg';
import fs from 'fs';

async function fixRls() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const dbUrlMatch = envContent.match(/DATABASE_URL="?([^"\n\r]+)"?/);
  const connectionString = dbUrlMatch ? dbUrlMatch[1] : process.env.DATABASE_URL;

  console.log('Connecting to Supabase PostgreSQL database...');
  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });

  const tables = ['users', 'categories', 'income', 'expense', 'products', 'suppliers', 'customers', 'receivables', 'audit_logs'];

  try {
    for (const table of tables) {
      console.log(`Configuring RLS policy for table: ${table}...`);
      
      // Enable RLS
      await pool.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);

      // Drop existing policies if any
      await pool.query(`DROP POLICY IF EXISTS "Allow all access to ${table}" ON "${table}";`);

      // Create policy allowing ALL operations (SELECT, INSERT, UPDATE, DELETE) for anon and authenticated
      await pool.query(`
        CREATE POLICY "Allow all access to ${table}"
        ON "${table}"
        FOR ALL
        TO anon, authenticated
        USING (true)
        WITH CHECK (true);
      `);
    }

    console.log('SUCCESS: Full RLS permissions (SELECT, INSERT, UPDATE, DELETE) applied to all tables in Supabase!');
  } catch (err) {
    console.error('Error applying RLS policies:', err);
  } finally {
    await pool.end();
  }
}

fixRls();
