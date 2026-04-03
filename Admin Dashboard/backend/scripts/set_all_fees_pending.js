const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

const result = db.transaction(() => {
  const feeResult = db.prepare("UPDATE fees SET paid = 0, due = amount, status = 'Pending'").run();
  const studentResult = db.prepare("UPDATE students SET fees = 'Pending'").run();
  return {
    feesUpdated: feeResult.changes,
    studentsUpdated: studentResult.changes,
  };
})();

console.log(JSON.stringify(result));
