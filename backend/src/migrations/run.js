import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { init, exec } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  await init();
  const migrationsDir = path.join(__dirname);
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Running migration: ${file}`);
    exec(sql);
  }
  console.log('Migrations complete.');
}

runMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});
