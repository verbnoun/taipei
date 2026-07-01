#!/usr/bin/env node
// Build: reads taipei.db → writes index.html and taipei-jul-sep.ics
'use strict';
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'db', 'taipei.db'));

// ── Read data from DB ────────────────────────────────────────────────────────

const nei = db.prepare(`
  SELECT id, name, zh, lat, lng, tokyo, mrt, known_for FROM neighborhoods ORDER BY rowid
`).all();

const spotsRaw = db.prepare(`
  SELECT id, name, zh, category AS cat, neighborhood AS nb, lat, lng, no_map AS noMap,
         about, status, url FROM spots WHERE published = 1 ORDER BY rowid
`).all();

const detailsRaw = db.prepare(`SELECT spot_id, key, value FROM spot_details ORDER BY id`).all();
const detailsBySpot = {};
for (const d of detailsRaw) {
  (detailsBySpot[d.spot_id] = detailsBySpot[d.spot_id] || []).push({ k: d.key, v: d.value });
}

const spots = spotsRaw.map(s => ({
  ...s,
  noMap: s.noMap ? true : undefined,
  details: detailsBySpot[s.id] || undefined,
}));

const eventsRaw = db.prepare(`
  SELECT id, title, location AS loc, location_apple AS loc_apple,
         date, start_time AS start, end_time AS end,
         all_day AS allDay, rrule, cadence_label AS cadenceLabel,
         category AS cat, description AS desc, status, url
  FROM events WHERE published = 1 ORDER BY date, start_time
`).all();

const events = eventsRaw.map(e => {
  const out = { ...e, allDay: e.allDay ? true : undefined };
  // strip nulls to keep JSON lean
  for (const k of Object.keys(out)) if (out[k] === null || out[k] === undefined) delete out[k];
  return out;
});

// MRT geometry — not in DB (reference data, not maintained content)
const MRT = [
  {name:'Red',    color:'#E3002C', pts:[[25.0931,121.5260],[25.0852,121.5254],[25.0712,121.5197],[25.0625,121.5197],[25.0578,121.5208],[25.0525,121.5203],[25.0478,121.5170],[25.0432,121.5158],[25.0327,121.5183],[25.0337,121.5283],[25.0334,121.5347],[25.0334,121.5436],[25.0330,121.5530],[25.0339,121.5645],[25.0327,121.5705]]},
  {name:'Green',  color:'#008659', pts:[[25.0500,121.5777],[25.0515,121.5560],[25.0520,121.5440],[25.0524,121.5333],[25.0525,121.5203],[25.0490,121.5108],[25.0421,121.5080],[25.0353,121.5103],[25.0327,121.5183],[25.0263,121.5229],[25.0205,121.5273],[25.0147,121.5343]]},
  {name:'Blue',   color:'#0070BD', pts:[[25.0354,121.4999],[25.0421,121.5080],[25.0466,121.5170],[25.0447,121.5246],[25.0423,121.5331],[25.0417,121.5437],[25.0415,121.5508],[25.0411,121.5601],[25.0410,121.5677],[25.0408,121.5762],[25.0447,121.5830],[25.0506,121.5932],[25.0539,121.6066],[25.0553,121.6175]]},
  {name:'Orange', color:'#F39800', pts:[[25.0633,121.5118],[25.0625,121.5197],[25.0593,121.5337],[25.0524,121.5333],[25.0423,121.5331],[25.0337,121.5283],[25.0263,121.5229],[25.0128,121.5135]]},
  {name:'Brown',  color:'#B57A2F', pts:[[25.0247,121.5538],[25.0263,121.5440],[25.0334,121.5436],[25.0417,121.5437],[25.0520,121.5440],[25.0608,121.5340],[25.0635,121.5519],[25.0788,121.5780],[25.0838,121.5942],[25.0700,121.6140],[25.0598,121.6155],[25.0553,121.6175]]},
];

db.close();

const DATA = JSON.stringify({ nei, spots, events, mrt: MRT });

// ── Update index.html ────────────────────────────────────────────────────────

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Replace content between the taipei-data script tags
const OPEN  = '<script id="taipei-data" type="application/json">';
const CLOSE = '</script>';
const start = html.indexOf(OPEN);
const end   = html.indexOf(CLOSE, start + OPEN.length);

let newHtml;
if (start === -1) {
  // First run: inject the tag just before </body>
  newHtml = html.replace('</body>', `${OPEN}\n${DATA}\n${CLOSE}\n</body>`);
} else {
  newHtml = html.slice(0, start + OPEN.length) + '\n' + DATA + '\n' + html.slice(end);
}

fs.writeFileSync(path.join(__dirname, 'index.html'), newHtml);
console.log('✓ index.html updated');

// ── Generate ICS ─────────────────────────────────────────────────────────────

function icsEsc(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
function icsDay(d)            { return (d || '').replace(/-/g, ''); }
function icsLocal(d, t)       { return icsDay(d) + 'T' + (t || '00:00').replace(':', '') + '00'; }
function nextDay(d) {
  const dt = new Date(d + 'T00:00:00');
  dt.setDate(dt.getDate() + 1);
  const p = n => ('0' + n).slice(-2);
  return dt.getFullYear() + p(dt.getMonth() + 1) + p(dt.getDate());
}
function addMin(d, t, m) {
  const dt = new Date(d + 'T' + (t || '00:00') + ':00');
  dt.setMinutes(dt.getMinutes() + m);
  const p = n => ('0' + n).slice(-2);
  return dt.getFullYear() + p(dt.getMonth() + 1) + p(dt.getDate()) + 'T' + p(dt.getHours()) + p(dt.getMinutes()) + '00';
}

const now = new Date();
const p = n => ('0' + n).slice(-2);
const stamp = now.getUTCFullYear() + p(now.getUTCMonth()+1) + p(now.getUTCDate()) + 'T' + p(now.getUTCHours()) + p(now.getUTCMinutes()) + p(now.getUTCSeconds()) + 'Z';

const L = [
  'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Taipei Field Notes//EN',
  'CALSCALE:GREGORIAN','METHOD:PUBLISH',
  'X-WR-CALNAME:Taipei — Jul–Sep','X-WR-TIMEZONE:Asia/Taipei',
  'BEGIN:VTIMEZONE','TZID:Asia/Taipei',
  'BEGIN:STANDARD','DTSTART:19700101T000000','TZOFFSETFROM:+0800','TZOFFSETTO:+0800','TZNAME:CST','END:STANDARD',
  'END:VTIMEZONE',
];

for (const ev of events) {
  if (!ev.date) continue;
  // Use Apple Maps address for LOCATION when available, else display loc
  const loc = ev.loc_apple || ev.loc || '';
  L.push('BEGIN:VEVENT');
  L.push('UID:' + ev.id + '@taipei-field-notes');
  L.push('DTSTAMP:' + stamp);
  L.push('SUMMARY:' + icsEsc(ev.title));
  if (loc) L.push('LOCATION:' + icsEsc(loc));
  if (ev.desc) L.push('DESCRIPTION:' + icsEsc(ev.desc));
  if (ev.allDay || !ev.start) {
    L.push('DTSTART;VALUE=DATE:' + icsDay(ev.date));
    L.push('DTEND;VALUE=DATE:' + nextDay(ev.date));
  } else {
    L.push('DTSTART;TZID=Asia/Taipei:' + icsLocal(ev.date, ev.start));
    L.push('DTEND;TZID=Asia/Taipei:' + (ev.end ? icsLocal(ev.date, ev.end) : addMin(ev.date, ev.start, 90)));
  }
  if (ev.rrule) L.push('RRULE:' + ev.rrule);
  L.push('END:VEVENT');
}

L.push('END:VCALENDAR');
const ics = L.join('\r\n');
fs.writeFileSync(path.join(__dirname, 'taipei-jul-sep.ics'), ics);
console.log('✓ taipei-jul-sep.ics updated (' + events.filter(e => e.date).length + ' events)');
