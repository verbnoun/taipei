#!/usr/bin/env node
// publish.js — after we review together, mark approved staged items live.
// Usage: node publish.js <id> [<id> ...]
//   Flips published=1 for any matching event / spot / lead id.
//   Then run `node build.js` to regenerate the app + calendar.
// To DROP a staged item instead of publishing: node publish.js --drop <id> [...]
'use strict';
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const db = new DatabaseSync(path.join(__dirname, 'db', 'taipei.db'));

const args = process.argv.slice(2);
const drop = args[0] === '--drop';
const ids = drop ? args.slice(1) : args;
if (!ids.length) { console.error('Usage: node publish.js [--drop] <id> [<id> ...]'); process.exit(1); }

const tables = ['events', 'spots', 'leads'];
for (const id of ids) {
  let done = false;
  for (const t of tables) {
    const exists = db.prepare(`SELECT 1 FROM ${t} WHERE id = ?`).get(id);
    if (!exists) continue;
    if (drop) db.prepare(`DELETE FROM ${t} WHERE id = ?`).run(id);
    else db.prepare(`UPDATE ${t} SET published = 1 WHERE id = ?`).run(id);
    console.log(`${drop ? 'dropped' : 'published'}: ${id}  (${t})`);
    done = true;
    break;
  }
  if (!done) console.warn(`  ?? not found in any table: ${id}`);
}
console.log(drop ? 'Done. (no rebuild needed for drops unless it was already live)' : 'Done. Now run: node build.js');
