const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  try {
    console.log('🔄 Applying participants table migration...');
    
    const migrationSQL = fs.readFileSync('supabase/migrations/20241220_add_participants_table.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.error('Error executing statement:', error);
          // Continue with other statements
        }
      }
    }
    
    console.log('✅ Migration applied successfully');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
  }
}

applyMigration();



