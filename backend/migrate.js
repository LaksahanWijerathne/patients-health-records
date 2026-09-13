const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const full = path.join(migrationsDir, file);
    const sql = fs.readFileSync(full, 'utf8');
    console.log('Running migration:', file);
    await db.query(sql);
  }
  console.log('Migrations complete');
  await db.close();
}

runMigrations().catch(err => {
  console.error('Migration failed', err);
  process.exit(1);
});
