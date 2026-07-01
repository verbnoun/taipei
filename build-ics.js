#!/usr/bin/env node
// Generates taipei-jul-sep.ics from the same seed data as the app.
"use strict";

function fmtTime(t) {
  if (!t) return '';
  const parts = t.split(':');
  const h = parseInt(parts[0], 10), m = parts[1];
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return h12 + ':' + m + ' ' + ap;
}

function icsEsc(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
function icsDay(dateStr) { return (dateStr || '').replace(/-/g, ''); }
function icsLocal(dateStr, timeStr) { return icsDay(dateStr) + 'T' + (timeStr || '00:00').replace(':', '') + '00'; }
function nextDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  const p = n => ('0' + n).slice(-2);
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
}
function addMin(dateStr, timeStr, mins) {
  const d = new Date(dateStr + 'T' + (timeStr || '00:00') + ':00');
  d.setMinutes(d.getMinutes() + mins);
  const p = n => ('0' + n).slice(-2);
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + 'T' + p(d.getHours()) + p(d.getMinutes()) + '00';
}

function seedEvents() {
  const mox = 'https://duckduckgo.com/?q=MOX+Friday+happy+hour+Taipei+SOSV';
  const E = [];

  [['2026-07-03'], ['2026-08-07'], ['2026-09-04']].forEach(x => {
    E.push({ id: 'mox-' + x[0], title: 'MOX Friday — founder + investor happy hour', loc: 'Taipei (venue varies — check listing)', date: x[0], start: '19:00', end: '21:00', cat: 'meetup', desc: 'SOSV/MOX ecosystem happy hour. Confirm venue: ' + mox });
  });

  [['Startup Grind Taipei', '2026-07-15'], ['Startup Grind Taipei', '2026-08-19'], ['Startup Grind Taipei', '2026-09-09'],
   ['Taiwan Startup Ecosystem Community', '2026-07-22'], ['Taiwan Startup Ecosystem Community', '2026-08-26'],
   ['Taiwan Entrepreneurs Network', '2026-07-29'], ['TechTaipei drinks', '2026-08-13']].forEach((x, i) => {
    E.push({ id: 'tent-' + i, title: x[0] + ' — TENTATIVE, verify date', loc: 'Taipei (RSVP online)', date: x[1], allDay: true, cat: 'meetup', desc: 'Cadence-based placeholder — confirm the real date before relying on it.' });
  });

  E.push({ id: 'pawnshop-wk', title: 'Pawnshop open — check RA/IG for lineup', loc: 'B1, 279 Sec.4 Xinyi Rd, Da\'an', date: '2026-07-03', start: '23:00', end: '23:59', cat: 'music', cadenceLabel: 'Fri & Sat nights, through Sep 15', rrule: 'FREQ=WEEKLY;BYDAY=FR,SA;UNTIL=20260915T235900Z', desc: 'Techno / leftfield electronic. Lineups posted ~1–2 weeks ahead on Resident Advisor & Instagram.' });

  const wall = 'The Wall, B1 No.200 Sec.4 Roosevelt Rd, Gongguan';
  const wallShows = [
    ['2026-07-04', '19:00', 'The Wall: NO STAGE NO WALLS', 'Indie / punk / disco bill.'],
    ['2026-07-05', '19:30', 'The Wall: 肉聲菩薩 (noise / experimental)', 'Wall-of-sound noise night — the loud, leftfield end.'],
    ['2026-07-11', '20:00', 'The Wall: Malpaca 羊駝小姐 — "Now… What?"', 'First headline show.'],
    ['2026-07-26', '20:00', 'The Wall: 黃澤森 — 陰森童話故事集', 'Solo return after three years.'],
    ['2026-07-30', '20:00', 'The Wall: Friko (US) Live in Taipei', 'Chicago alt / post-punk — buzzy international booking.'],
    ['2026-08-09', '19:00', 'The Wall: MILLI — JAA EHH! Asia Tour', 'Thai rapper, Coachella alum.'],
    ['2026-08-15', '20:00', 'The Wall: DENGARYU 田我流 (JP hip-hop)', 'stillichimiya-affiliated Japanese hip-hop.'],
  ];
  wallShows.forEach((s, i) => {
    E.push({ id: 'wall-' + i, title: s[2], loc: wall, date: s[0], start: s[1], cat: 'music', desc: s[3] + ' Tickets: thewalllivehouse.kktix.cc' });
  });

  E.push({ id: 'livehouse-wk', title: 'Check live houses for weekend gigs (PIPE · Waiting Room · Witch House)', loc: 'Taipei', date: '2026-07-01', allDay: true, cat: 'music', cadenceLabel: 'Wednesdays, through Sep 15', rrule: 'FREQ=WEEKLY;BYDAY=WE;UNTIL=20260915', desc: 'These post bookings ~2–4 weeks out — scan for experimental / electronic nights. (The Wall\'s lineup is already listed above.)' });

  E.push({ id: 'bluerider-close', title: 'Bluerider ART — last day: current Dunhua show', loc: 'Bluerider ART, No.77 Sec.2 Dunhua S Rd, Da\'an', date: '2026-07-19', allDay: true, cat: 'gallery', desc: 'Confirmed: run 23 May–19 Jul 2026 (Fri press preview + Sat 2:30–6pm reception). Also "Butterflies of Light" @ Breeze Center thru 15 Jul.' });
  E.push({ id: 'tkg-cycles-close', title: 'TKG+ — last day: Mit Jai Inn "CYCLES"', loc: 'TKG+ B1, Ln 548 Ruiguang Rd, Neihu', date: '2026-07-04', allDay: true, cat: 'gallery', desc: 'Confirmed: 23 May–4 Jul 2026, reception 23 May (Sat) 4:30pm.' });
  E.push({ id: 'tkg-oyama-close', title: 'TKG+ Projects — last day: Enrico Isamu Oyama "Aerosolic Forms"', loc: 'TKG+ Projects 2F, Ln 548 Ruiguang Rd, Neihu', date: '2026-07-04', allDay: true, cat: 'gallery', desc: 'Confirmed: 14 Mar–4 Jul 2026, reception 14 Mar (Sat) 4:30pm. Aerosol/calligraphic painting, w/ Takuro Someya Contemporary Art.' });
  E.push({ id: 'tinakeng-su-close', title: 'Tina Keng — last day: Su Meng-Hung "The Flowers of Coromandel"', loc: 'Tina Keng Gallery 1F, Ln 548 Ruiguang Rd, Neihu', date: '2026-07-10', allDay: true, cat: 'gallery', desc: 'Confirmed: opened 8 May 2026 (reception Sat 4:30pm), closes 10–11 Jul. Same Neihu building as TKG+.' });
  E.push({ id: 'eachmodern-konst-close', title: 'Each Modern — last day: Antone Könst "Subjects"', loc: 'Each Modern, Da\'an', date: '2026-07-25', allDay: true, cat: 'gallery', desc: 'Confirmed: 13 Jun–25 Jul 2026 (opened Sat 13 Jun).' });
  E.push({ id: 'whitestone-shiozawa-close', title: 'Whitestone — last day: Karen Shiozawa "Emerald Ocean"', loc: 'Whitestone Gallery, Neihu', date: '2026-07-18', allDay: true, cat: 'gallery', desc: 'Confirmed: 13 Jun–18 Jul 2026.' });
  E.push({ id: 'gallery-neihu-sat', title: 'Neihu gallery day — TKG+ / Tina Keng cluster', loc: 'Ln 548 Ruiguang Rd, Neihu (one building)', date: '2026-07-04', allDay: true, cat: 'gallery', desc: 'TKG+, TKG+ Projects and Tina Keng share No.15, Ln 548 Ruiguang Rd. Tue–Sat 11–6. After the 4–10 Jul closings their autumn shows reopen in late Aug (2024: 17 Aug; 2025: 26 Aug) — receptions land on a Saturday 4:30pm. Check tkgplus.com for the dated announcement.' });

  return E;
}

function buildICS() {
  const now = new Date();
  const p = n => ('0' + n).slice(-2);
  const stamp = now.getUTCFullYear() + p(now.getUTCMonth() + 1) + p(now.getUTCDate()) + 'T' + p(now.getUTCHours()) + p(now.getUTCMinutes()) + p(now.getUTCSeconds()) + 'Z';

  const L = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Taipei Field Notes//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Taipei — Jul–Sep',
    'X-WR-TIMEZONE:Asia/Taipei',
    'BEGIN:VTIMEZONE', 'TZID:Asia/Taipei',
    'BEGIN:STANDARD', 'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0800', 'TZOFFSETTO:+0800', 'TZNAME:CST',
    'END:STANDARD', 'END:VTIMEZONE',
  ];

  seedEvents().forEach(ev => {
    if (!ev.date) return;
    L.push('BEGIN:VEVENT');
    L.push('UID:' + (ev.id || ('e' + Math.random().toString(36).slice(2))) + '@taipei-field-notes');
    L.push('DTSTAMP:' + stamp);
    L.push('SUMMARY:' + icsEsc(ev.title || '(untitled)'));
    if (ev.loc) L.push('LOCATION:' + icsEsc(ev.loc));
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
  });

  L.push('END:VCALENDAR');
  return L.join('\r\n');
}

const ics = buildICS();
require('fs').writeFileSync('taipei-jul-sep.ics', ics);
console.log('Wrote taipei-jul-sep.ics (' + ics.split('\n').length + ' lines)');
