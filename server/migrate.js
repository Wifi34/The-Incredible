import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.ybzvtpzmwpeisbwukcze:9922270869adi@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const schemaSql = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'citizen',
    phone TEXT,
    department TEXT,
    ward TEXT,
    avatar TEXT,
    badge TEXT,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    priority TEXT DEFAULT 'MEDIUM',
    severity_score NUMERIC DEFAULT 50,
    status TEXT NOT NULL DEFAULT 'SUBMITTED',
    lat NUMERIC NOT NULL,
    lng NUMERIC NOT NULL,
    address TEXT,
    landmark TEXT,
    image_url TEXT,
    resolved_image_url TEXT,
    department_id TEXT,
    assigned_team_id TEXT,
    citizen_id TEXT,
    citizen_name TEXT,
    citizen_phone TEXT,
    upvotes INTEGER DEFAULT 0,
    upvoted_by JSONB DEFAULT '[]',
    ai_metadata JSONB DEFAULT '{}',
    verification_status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS complaint_updates (
    id TEXT PRIMARY KEY,
    complaint_id TEXT REFERENCES complaints(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    actor_name TEXT,
    actor_role TEXT,
    proof_photo TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    complaint_id TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

export async function runMigration() {
  try {
    console.log('⚡ Running Supabase Migration...');
    await pool.query(schemaSql);
    console.log('✅ Supabase Schema migrated successfully!');
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
    console.log('📋 Supabase Tables:', res.rows.map(r => r.table_name).join(', '));
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  }
}

if (process.argv[1]?.endsWith('migrate.js')) {
  runMigration().then(() => pool.end());
}
