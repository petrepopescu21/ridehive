const fs = require('fs');
const path = require('path');
const { query } = require('./database');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Create migrations tracking table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of already executed migrations
    const executedResult = await query('SELECT filename FROM migrations');
    const executedMigrations = new Set(executedResult.rows.map(row => row.filename));
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found, skipping migrations');
      return;
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Execute in alphabetical order
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found');
      return;
    }
    
    for (const filename of migrationFiles) {
      if (executedMigrations.has(filename)) {
        console.log(`⏭️  Skipping already executed migration: ${filename}`);
        continue;
      }
      
      // Skip the dual pins migration since base schema already has it
      if (filename === '001_add_dual_pins.sql') {
        console.log(`⏭️  Skipping incompatible migration: ${filename} (dual PINs already in base schema)`);
        // Mark it as executed so it doesn't run in future
        await query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
        continue;
      }
      
      console.log(`🔄 Running migration: ${filename}`);
      
      try {
        const migrationSQL = fs.readFileSync(
          path.join(migrationsDir, filename), 
          'utf8'
        );
        
        // Execute the migration
        await query(migrationSQL);
        
        // Mark as executed
        await query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
        
        console.log(`✅ Migration completed: ${filename}`);
        
      } catch (error) {
        console.error(`❌ Migration failed: ${filename}`);
        console.error(error.message);
        throw error; // Stop on first failure
      }
    }
    
    console.log('All migrations completed successfully!');
    
  } catch (error) {
    console.error('Migration process failed:', error);
    throw error;
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };