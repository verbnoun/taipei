#!/usr/bin/env node
// review.js — dump everything STAGED (published=0) so we can review it together.
// Usage: node review.js
// This is the "collection" utility: research writes staged rows, this prints them
// grouped by category + certainty; after we talk them through, publish.js posts them.
'use strict';
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const db = new DatabaseSync(path.join(__dirname, 'db', 'taipei.db'));

const order = { confirmed: 0, tentative: 1, lead: 2, unknown: 3 };
const byCertainty = (a, b) => (order[a.status ?? a.certainty] ?? 9) - (order[b.status ?? b.certainty] ?? 9);

const events = db.prepare(`
  SELECT id, title, category, date, start_time, end_time, location, location_apple, status, url
  FROM events WHERE published = 0 ORDER BY category, date, start_time
`).all();

const spots = db.prepare(`
  SELECT id, name, category, neighborhood, about, status, url, address_apple
  FROM spots WHERE published = 0 ORDER BY category, name
`).all();

const leads = db.prepare(`
  SELECT id, name, kind, category, note, handle_url, certainty, source_url
  FROM leads WHERE published = 0 ORDER BY category, name
`).all();

function section(title, rows) {
  console.log('\n' + '─'.repeat(60));
  console.log(`  ${title}  (${rows.length})`);
  console.log('─'.repeat(60));
}

section('STAGED EVENTS', events);
for (const e of events.sort(byCertainty)) {
  const when = e.date ? `${e.date}${e.start_time ? ' ' + e.start_time : ''}` : 'recurring/undated';
  console.log(`\n[${e.status}] ${e.title}   (${e.category})`);
  console.log(`   when: ${when}`);
  console.log(`   loc : ${e.location_apple || e.location || '—'}`);
  if (e.url) console.log(`   src : ${e.url}`);
  console.log(`   id  : ${e.id}`);
}

section('STAGED PLACES', spots);
for (const s of spots.sort(byCertainty)) {
  console.log(`\n[${s.status || 'lead'}] ${s.name}   (${s.category}${s.neighborhood ? ' · ' + s.neighborhood : ''})`);
  if (s.about) console.log(`   ${s.about}`);
  console.log(`   loc : ${s.address_apple || '—'}`);
  if (s.url) console.log(`   src : ${s.url}`);
  console.log(`   id  : ${s.id}`);
}

section('STAGED LEADS (people / communities / discovery)', leads);
for (const l of leads.sort(byCertainty)) {
  console.log(`\n[${l.certainty}] ${l.name}   (${l.kind}${l.category ? ' · ' + l.category : ''})`);
  if (l.note) console.log(`   ${l.note}`);
  if (l.handle_url) console.log(`   at  : ${l.handle_url}`);
  if (l.source_url) console.log(`   src : ${l.source_url}`);
  console.log(`   id  : ${l.id}`);
}

console.log('\n' + '='.repeat(60));
console.log(`  TOTAL STAGED: ${events.length} events · ${spots.length} places · ${leads.length} leads`);
console.log('='.repeat(60) + '\n');
