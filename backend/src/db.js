import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_URL
  ? path.resolve(process.env.DATABASE_URL)
  : path.join(__dirname, '../../database.db');

let db = null;
let initPromise = null;

function toSqliteParams(sql) {
  return sql.replace(/\$(\d+)/g, '?');
}

function save() {
  if (db && dbPath) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (err) {
      console.error('Erro ao salvar banco:', err);
    }
  }
}

export async function init() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const SQL = await initSqlJs();
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
  })();
  return initPromise;
}

export function query(text, params = []) {
  if (!db) throw new Error('Banco não inicializado. Chame init() primeiro.');
  const sql = toSqliteParams(text);
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const upper = text.trim().toUpperCase();
  const hasReturning = upper.includes('RETURNING');
  const isSelect = upper.startsWith('SELECT');

  if (isSelect || hasReturning) {
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return { rows, rowCount: rows.length };
  }
  stmt.step();
  stmt.free();
  const rowCount = db.getRowsModified();
  save();
  return { rows: [], rowCount };
}

export function exec(sql) {
  if (!db) throw new Error('Banco não inicializado. Chame init() primeiro.');
  db.exec(sql);
  save();
}

export async function checkConnection() {
  try {
    await init();
    const stmt = db.prepare('SELECT 1');
    stmt.step();
    stmt.free();
    return true;
  } catch (err) {
    return false;
  }
}
