#!/usr/bin/env node
// people.js — the "people to meet" list. Published leads, checkable.
// Usage:
//   node people.js            list everyone (☐ = to meet, ☑ = met)
//   node people.js met <id>   check someone off
//   node people.js open <id>  un-check
// Priority kinds: experimental musicians + startup/community leaders.
'use strict';
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const db = new DatabaseSync(path.join(__dirname, 'db', 'taipei.db'));

const [cmd, id] = process.argv.slice(2);
if (cmd === 'met' || cmd === 'open') {
  const r = db.prepare('UPDATE leads SET met = ? WHERE id = ?').run(cmd === 'met' ? 1 : 0, id);
  console.log(r.changes ? `${cmd === 'met' ? '☑ met' : '☐ reopened'}: ${id}` : `?? no lead with id ${id}`);
  process.exit(0);
}

const leads = db.prepare(`
  SELECT id, name, kind, category, note, handle_url, met
  FROM leads WHERE published = 1
  ORDER BY met, kind, name
`).all();

if (!leads.length) { console.log('No people on the list yet.'); process.exit(0); }
console.log('\n  PEOPLE TO MEET\n' + '─'.repeat(50));
for (const l of leads) {
  console.log(`\n${l.met ? '☑' : '☐'} ${l.name}   (${l.kind}${l.category ? ' · ' + l.category : ''})`);
  if (l.note) console.log(`    ${l.note}`);
  if (l.handle_url) console.log(`    ${l.handle_url}`);
  console.log(`    id: ${l.id}`);
}
const left = leads.filter(l => !l.met).length;
console.log('\n' + '─'.repeat(50));
console.log(`  ${left} to meet · ${leads.length - left} met\n`);
