import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from './config/env';

const DB_DIR = path.dirname(config.DB_PATH);
const DB_PATH = config.DB_PATH;

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH, {
  verbose: config.NODE_ENV === 'development' ? console.log : undefined,
});

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');
db.pragma('busy_timeout = 5000');

db.exec(`
  CREATE TABLE IF NOT EXISTS employee_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    userId TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    employeeId TEXT UNIQUE NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    employeeUserId TEXT NOT NULL,
    employeeName TEXT NOT NULL,
    date TEXT NOT NULL,
    checkIn TEXT,
    checkOut TEXT,
    status TEXT DEFAULT 'Absent',
    remarks TEXT,
    createdAt TEXT NOT NULL,
    UNIQUE(employeeUserId, date)
  );

  CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
  CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance_records(employeeUserId);
`);

export default db;
