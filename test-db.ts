import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Test query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('⏰ Database time:', result.rows[0].current_time);
    console.log('📦 PostgreSQL version:', result.rows[0].postgres_version);

    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📋 Tables in database:');
    tables.rows.forEach(row => console.log('  -', row.table_name));

    // Count merchants
    const merchants = await client.query('SELECT COUNT(*) as count FROM merchants');
    console.log('\n👥 Merchants in database:', merchants.rows[0].count);

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection();
