const fs = require('fs');
const path = require('path');
const { query } = require('./database');

async function setupDatabase() {
  try {
    console.log('Setting up database schema...');
    
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'), 
      'utf8'
    );
    
    await query(schemaSQL);
    console.log('Database schema created successfully!');
    
    // Insert sample map data
    const sampleMap = {
      title: 'Sample City Tour',
      notes: 'A quick tour around the city center',
      waypoints: JSON.stringify([
        { lat: 40.7128, lng: -74.0060, name: 'Start - City Hall' },
        { lat: 40.7589, lng: -73.9851, name: 'Times Square' },
        { lat: 40.7614, lng: -73.9776, name: 'Central Park' },
        { lat: 40.7505, lng: -73.9934, name: 'End - Grand Central' }
      ])
    };
    
    const result = await query(
      'INSERT INTO maps (title, notes, waypoints) VALUES ($1, $2, $3) RETURNING id',
      [sampleMap.title, sampleMap.notes, sampleMap.waypoints]
    );
    
    console.log(`Sample map created with ID: ${result.rows[0].id}`);
    console.log('Database setup complete!');
    
  } catch (error) {
    console.error('Database setup failed:', error);
  } finally {
    process.exit(0);
  }
}

setupDatabase();