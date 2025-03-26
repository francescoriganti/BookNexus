// This script sets up the PostgreSQL database tables
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  DATABASE_URL,
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD,
  PGDATABASE
} = process.env;

// Check database environment variables
if (!DATABASE_URL && (!PGHOST || !PGPORT || !PGUSER || !PGPASSWORD || !PGDATABASE)) {
  console.error('Error: Database environment variables are not set.');
  process.exit(1);
}

// Create PostgreSQL client
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    // Connect to database
    await client.connect();
    console.log('Connected to PostgreSQL database');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'setup-supabase-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the file into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Execute the SQL statement
        await client.query(stmt);
        console.log(`Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.error(`Error executing statement ${i + 1}:`, error.message);
        // Continue with next statement
      }
    }
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    // Close the connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the setup
setupDatabase();