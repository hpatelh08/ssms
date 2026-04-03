const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

const fees = db.prepare('SELECT status, COUNT(1) AS c FROM fees GROUP BY status ORDER BY status').all();
const students = db.prepare('SELECT fees, COUNT(1) AS c FROM students GROUP BY fees ORDER BY fees').all();

console.log(JSON.stringify({ fees, students }, null, 2));
