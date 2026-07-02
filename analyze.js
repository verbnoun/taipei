#!/usr/bin/env node
// analyze.js — read the DB's shape so research is guided by data, not vibes.
// Run before/after a research round: `node analyze.js`
// Shows calendar balance (category / month / neighborhood), map coverage,
// people list, and the gap views — so I can see what's thin and steer.
'use strict';
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const db = new DatabaseSync(path.join(__dirname, 'db', 'taipei.db'));
const q = (s) => db.prepare(s).all();
const h = (t) => console.log('\n── ' + t + ' ' + '─'.repeat(Math.max(0, 46 - t.length)));

h('CALENDAR — by category (published)');
console.table(q("SELECT category, COUNT(*) n FROM events WHERE published=1 GROUP BY category ORDER BY n DESC"));

h('CALENDAR — by month (one-off dated, published)');
console.table(q("SELECT substr(date,1,7) month, COUNT(*) n FROM events WHERE published=1 AND rrule IS NULL AND date IS NOT NULL GROUP BY month ORDER BY month"));

h('CALENDAR — by neighborhood (via spot)');
console.table(q("SELECT COALESCE(s.neighborhood,'(no spot)') nb, COUNT(*) n FROM events e LEFT JOIN spots s ON s.id=e.spot_id WHERE e.published=1 GROUP BY nb ORDER BY n DESC"));

h('MAP — pins by category (published)');
console.table(q("SELECT category, COUNT(*) n FROM spots WHERE published=1 GROUP BY category ORDER BY n DESC"));

h('PEOPLE — leads by kind (published)');
console.table(q("SELECT kind, COUNT(*) n FROM leads WHERE published=1 GROUP BY kind ORDER BY n DESC"));

h('GAP VIEW — events_by_gap (confirmed vs tentative vs unsourced)');
console.table(q("SELECT * FROM events_by_gap"));

h('COVERAGE');
console.log('events with no source :', q("SELECT COUNT(*) n FROM events_no_source")[0].n, '/', q("SELECT COUNT(*) n FROM events")[0].n);
console.log('spots  with no source :', q("SELECT COUNT(*) n FROM spots_no_source")[0].n, '/', q("SELECT COUNT(*) n FROM spots")[0].n);
console.log('parked (published=0)  : events', q("SELECT COUNT(*) n FROM events WHERE published=0")[0].n,
            '· spots', q("SELECT COUNT(*) n FROM spots WHERE published=0")[0].n,
            '· leads', q("SELECT COUNT(*) n FROM leads WHERE published=0")[0].n);
