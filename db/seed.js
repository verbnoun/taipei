#!/usr/bin/env node
// Creates and seeds taipei.db from scratch. Safe to re-run (drops and recreates).
'use strict';
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'taipei.db');
if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
const db = new DatabaseSync(DB_PATH);
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

// ── Neighborhoods ────────────────────────────────────────────────────────────
const insertNei = db.prepare(`
  INSERT INTO neighborhoods (id, name, zh, lat, lng, tokyo, mrt, known_for)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const NEIGHBORHOODS = [
  ['daan',      "Da'an",               '大安區',      25.0264, 121.5435, 'Daikanyama / Nakameguro', 'Red, Green, Brown',          'Leafy and walkable, cafés everywhere, Daan Forest Park. Central and a little pricey — the easy first choice.'],
  ['xinyi',     'Xinyi',               '信義區',      25.0335, 121.5670, 'Roppongi / Marunouchi',   'Red, Blue',                  'Taipei 101, malls, offices, nightlife. Modern and glossy; the most expensive area.'],
  ['zhongshan', 'Zhongshan',           '中山區',      25.0530, 121.5210, 'Ginza × Omotesando',      'Red, Green, Orange',         'Boutiques on Chifeng St, galleries, hotels, great MRT hub. Stylish and very connected.'],
  ['songshan',  'Songshan / Minsheng', '松山·民生社區', 25.0590, 121.5600, 'Jiyūgaoka',               'Green, Brown nearby',        'Tree-lined Minsheng Community and design-y Fujin St. Calm, residential, quietly cool.'],
  ['zhongzheng','Zhongzheng',          '中正區',      25.0440, 121.5180, 'Chiyoda',                 'Red, Blue, Green, Orange',   'Taipei Main Station, government district, Guang Hua nearby. Unbeatable transit, less personality.'],
  ['datong',    'Datong / Dadaocheng', '大同·大稻埕',  25.0560, 121.5100, 'Kuramae / Yanaka',        'Orange, Red nearby',         'Old town along Dihua St — temples, tea, indie makers. Characterful and noticeably cheaper.'],
  ['wanhua',    'Wanhua / Ximending',  '萬華·西門',   25.0421, 121.5074, 'Harajuku Takeshita × Asakusa', 'Blue, Green',           'Ximending youth shopping, Longshan Temple, street food. Lively and gritty, older bones.'],
  ['neihu',     'Neihu',               '內湖區',      25.0793, 121.5755, 'Shinagawa tech belt',     'Brown',                      'Neihu Tech Park — hardware, electronics and IT firms cluster here. Suburban and a bit car-dependent.'],
  ['nangang',   'Nangang',             '南港區',      25.0539, 121.6066, 'Tamachi / Shinagawa',     'Blue, Brown',                'Software Park, HSR hub, biotech and new towers. Emerging but far on the east edge.'],
  ['shilin',    'Shilin / Tianmu',     '士林·天母',   25.1150, 121.5310, 'Kichijōji',               'Red',                        'Famous night market plus the expat-favored Tianmu. Greener and hillier, farther from the core.'],
];
for (const r of NEIGHBORHOODS) insertNei.run(...r);

// ── Spots ────────────────────────────────────────────────────────────────────
const insertSpot = db.prepare(`
  INSERT INTO spots (id, name, zh, category, neighborhood, lat, lng, no_map, about, status, url, address_apple, address_verified)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertDetail = db.prepare(`INSERT INTO spot_details (spot_id, key, value) VALUES (?, ?, ?)`);

const SPOTS = [
  // Home
  {
    id:'home', name:'Home — Chifeng St', zh:'赤峰街71巷26號', cat:'home', nb:'datong',
    lat:25.0566, lng:121.5204,
    about:"Where you're staying — No. 26, Lane 71, Chifeng Street, Datong (光能里). Right in the Chifeng boutique lanes, a few minutes from Zhongshan and Shuanglian MRT.",
    address_apple:'No. 26, Lane 71, Chifeng Street, Datong District, Taipei, Taiwan', verified:1,
  },
  // Electronics
  {
    id:'guanghua', name:'Guang Hua Digital Plaza', zh:'光華商場', cat:'electronics', nb:'zhongzheng',
    lat:25.0445, lng:121.5325,
    about:"Taipei's Akihabara — six floors of PCs, parts, gadgets and repair stalls, with parts alleys spilling onto Bade Rd behind. Start here.",
    address_apple:'No. 8, Section 3, Civic Boulevard, Zhongzheng District, Taipei, Taiwan', verified:1,
    details:[['Hours','Daily ~10am–9pm'],['Layout','6 floors + parts alleys on Bade Rd behind'],['Prices','Fixed & posted — little bargaining'],['MRT','Zhongxiao Xinsheng (Blue/Orange) Exit 1']],
  },
  {
    id:'syntrend', name:'Syntrend', zh:'三創生活園區', cat:'electronics', nb:'zhongzheng',
    lat:25.0438, lng:121.5332,
    about:'Sleek Hon Hai flagship next to Guang Hua — high-end showrooms, gaming, VR, maker gear and events.',
    address_apple:'No. 1, Section 3, Civic Boulevard, Zhongzheng District, Taipei, Taiwan', verified:1,
    details:[['Hours','Daily ~11am–9:30pm'],['What','Showrooms, gaming/VR, events; pricier'],['Where','Right next to Guang Hua']],
  },
  {
    id:'taiyuan', name:'Taiyuan Rd Electronics Market', zh:'太原路電子材料', cat:'electronics', nb:'datong',
    lat:25.0508, lng:121.5130,
    about:'Back-alley components, connectors, tools and wholesale near Taipei Main — the real parts district for hardware builders.',
    address_apple:'Taiyuan Road, Datong District, Taipei, Taiwan', verified:1,
    details:[['Hours','Roughly Mon–Sat ~9am–6pm; quiet Sun'],['What','Components, connectors, tools, wholesale'],['MRT','Daqiaotou (Orange) / Taipei Main']],
  },
  // Shopping
  {
    id:'chifeng', name:'Chifeng St', zh:'赤峰街', cat:'shopping', nb:'zhongshan',
    lat:25.0556, lng:121.5203,
    about:"Narrow lanes of indie boutiques, coffee and design shops amid old auto-parts stores — your Cat Street.",
    address_apple:'Chifeng Street, Zhongshan District, Taipei, Taiwan', verified:1,
  },
  {
    id:'fujin', name:'Fujin St', zh:'富錦街', cat:'shopping', nb:'songshan',
    lat:25.0588, lng:121.5605,
    about:'Leafy, low-key designer street — concept stores and cafés. The "Brooklyn of Taipei".',
    address_apple:'Fujin Street, Songshan District, Taipei, Taiwan', verified:1,
  },
  {
    id:'ximending', name:'Ximending', zh:'西門町', cat:'shopping', nb:'wanhua',
    lat:25.0421, lng:121.5074,
    about:'Youth fashion, sneakers, streetwear and tattoo shops. Harajuku-Takeshita energy.',
    address_apple:'Ximending, Wanhua District, Taipei, Taiwan', verified:1,
  },
  // Coworking
  {
    id:'tta', name:'Taiwan Tech Arena (TTA)', zh:'', cat:'coworking', nb:'songshan',
    lat:25.0510, lng:121.5505,
    about:'Government-backed hub at Taipei Arena focused on hardware / IoT and deep tech, with international accelerator tracks and demo space.',
    address_apple:'No. 1, Section 4, Nanjing East Road, Songshan District, Taipei, Taiwan', verified:1,
    details:[['Focus','Hardware / IoT / deep tech; accelerators'],['Hours','Weekday business hours; events vary'],['Where','Taipei Arena complex, Songshan'],['For you','Best first stop for the hardware scene']],
  },
  {
    id:'futureward', name:'FutureWard', zh:'', cat:'coworking', nb:'zhongshan',
    lat:25.0700, lng:121.5430,
    about:'Maker-leaning coworking space with prototyping resources and frequent startup events; close ties to TTA and the Gold Card community.',
    status:'Location approximate — confirm the address & hours.',
    details:[['Type','Maker coworking + prototyping'],['Note','Confirm current address & hours']],
  },
  {
    id:'cic', name:'CIC Taipei', zh:'', cat:'coworking', nb:'xinyi',
    lat:25.0360, lng:121.5650,
    about:'Global innovation-campus brand — coworking, labs and a dense startup community with steady programming.',
    status:'Verify Taipei location & current availability.',
    details:[['Type','Coworking + labs; dense community'],['Note','Confirm location & availability']],
  },
  {
    id:'startupterrace', name:'Startup Terrace', zh:'林口新創園', cat:'coworking', nb:null,
    no_map:1,
    about:'Large government startup campus with hardware labs and subsidised space — but out in Linkou, New Taipei.',
    status:'~40 min west in Linkou — off this map.',
    details:[['Where','Linkou, New Taipei (~40 min west)'],['What','Govt campus, hardware labs, subsidised space']],
  },
  // Music
  {
    id:'pawnshop', name:'Pawnshop', zh:'當鋪', cat:'music', nb:'daan',
    lat:25.0335, lng:121.5548,
    about:'From the Korner team — a 3-room underground spot for techno and leftfield electronic. Berlin-ish, queer-friendly, sound-first (not a big EDM room).',
    address_apple:'No. 279, Section 4, Xinyi Road, Da\'an District, Taipei, Taiwan', verified:1,
    details:[['Hours','Fri–Sat, ~11pm til 7–8am'],['Door','NT$700–1000, cash; bag search; no photos'],['Sound','Funktion-One · 3 rooms (techno / house / live)'],['Getting in','B1, 279 Sec.4 Xinyi Rd; taxi home after MRT'],['Listings','RA + @pawnshop_taipei on IG']],
  },
  {
    id:'final', name:'FINAL', zh:'', cat:'music', nb:'daan',
    lat:25.0336, lng:121.5440,
    about:'Deconstructed-club / avant-garde nights — cosplay, fashion, the weirder end of electronic. Closest in spirit to Forestlimit.',
    status:'Was still active in 2023 — confirm current status & events on IG before heading out.',
    details:[['Scene','Deconstructed / avant-garde club nights'],['When','Weekend late; event-driven'],['Check','IG for lineups before going']],
  },
  {
    id:'thewall', name:'The Wall / The Bar', zh:'這牆', cat:'music', nb:'zhongzheng',
    lat:25.0157, lng:121.5340,
    about:'Mainstay Gongguan live house; the adjoining Bar is where indie and electronic crowds mix. Inclusive and unpretentious.',
    address_apple:'No. 200, Section 4, Roosevelt Road, Zhongzheng District, Taipei, Taiwan', verified:1,
    url:'https://thewalllivehouse.kktix.cc',
    details:[['Type','Live house + adjoining bar'],['Address','B1, No.200 Sec.4 Roosevelt Rd'],['Listings','thewalllivehouse.kktix.cc — full dated lineup'],['MRT','Gongguan (Green), ~5 min walk']],
  },
  {
    id:'pipe', name:'PIPE Live Music', zh:'', cat:'music', nb:'zhongzheng',
    lat:25.0125, lng:121.5210,
    about:'Riverside live house hosting DJ and electronic one-offs alongside bands. Roomy and scrappy.',
    address_apple:'No. 2, Shui Yuan Road, Zhongzheng District, Taipei, Taiwan', verified:0,
    details:[['Type','Riverside live house'],['When','Event nights — check listings'],['Note','By Guting riverside park']],
  },
  {
    id:'revolver', name:'Revolver', zh:'', cat:'music', nb:'zhongzheng',
    lat:25.0330, lng:121.5185,
    about:'Two floors near CKS — bar below, DJs and small live sets upstairs. Long-running, expat-friendly, easy weeknight hang.',
    address_apple:'No. 1, Section 1, Jinshan South Road, Zhongzheng District, Taipei, Taiwan', verified:0,
    details:[['Hours','Daily, ~8pm til late'],['Vibe','Bar below, DJs/live upstairs; low cover'],['MRT','CKS Memorial / Dongmen']],
  },
  {
    id:'waitingroom', name:'Waiting Room', zh:'', cat:'music', nb:'daan',
    lat:25.0246, lng:121.5290,
    about:'Tiny Shida basement for experimental, noise and leftfield bookings. DIY and intimate — very Forestlimit-coded.',
    details:[['Type','Tiny basement — experimental / noise'],['When','Event nights only — check IG'],['MRT','Taipower Building / Shida']],
  },
  {
    id:'witchhouse', name:'Witch House', zh:'女巫店', cat:'music', nb:'daan',
    lat:25.0182, lng:121.5343,
    about:'Cozy NTU-area institution for singer-songwriters and quieter experimental sets. Candlelit and low-key.',
    address_apple:'No. 7, Lane 107, Section 3, Roosevelt Road, Da\'an District, Taipei, Taiwan', verified:0,
    details:[['Type','Café live house, ticketed sets'],['Scene','Singer-songwriter & quiet experimental'],['MRT','Gongguan / NTU area']],
  },
  {
    id:'aha', name:'AHA Saloon', zh:'', cat:'music', nb:'songshan',
    lat:25.0515, lng:121.5440,
    about:'Vinyl-and-cassette listening bar with lo-fi, soul and ambient on rotation, plus serious cocktails. The posh, conversational end of your taste.',
    details:[['Type','Vinyl listening + cocktail bar'],['Hours','Evenings; verify days open'],['Note','Conversation-friendly, not a dancefloor']],
  },
  {
    id:'winervlt', name:'WINE RVLT', zh:'台VLT', cat:'music', nb:'zhongshan',
    lat:25.0490, lng:121.5320,
    about:"Industrial natural-wine bar on Civic Blvd with a constantly-changing curated playlist. Social, design-y, Tribeca-adjacent.",
    details:[['Type','Natural-wine listening bar'],['Hours','Evenings; closed some weekdays — verify'],['Area','Civic Blvd, Zhongshan']],
  },
  // Meetups
  {
    id:'moxfriday', name:'MOX Friday', zh:'', cat:'meetup', nb:'daan',
    lat:25.0410, lng:121.5450, date_label:'1st Friday · monthly',
    about:"SOSV / MOX's long-running ecosystem happy hour — relaxed founder + investor mingling. A reliable first foothold in the scene.",
    status:'Venue can vary — check the listing.',
    url:'https://duckduckgo.com/?q=MOX+Friday+happy+hour+Taipei+SOSV',
    details:[['Format','Evening happy hour, casual'],['Good for','Meeting founders + investors early on']],
  },
  {
    id:'startupgrind', name:'Startup Grind Taipei', zh:'', cat:'meetup', nb:'daan',
    lat:25.0440, lng:121.5400, date_label:'Monthly',
    about:'Local chapter of the global founder community — monthly fireside talks plus networking. Good for structured intros.',
    status:'Venue varies by event.',
    url:'https://www.startupgrind.com/taipei/',
  },
  {
    id:'techtaipei', name:'TechTaipei', zh:'', cat:'meetup', nb:'daan',
    lat:25.0330, lng:121.5440, date_label:'Every few months',
    about:'Casual drinks-and-pizza meetup for people working in tech in Taiwan. Low-key, friendly, English-speaking.',
    status:'Rotating bars (Craft House, Red Room…).',
    url:'https://techtaipei.com/',
  },
  {
    id:'tsec', name:'Taiwan Startup Ecosystem Community', zh:'', cat:'meetup', nb:'zhongshan',
    lat:25.0470, lng:121.5320, date_label:'Monthly',
    about:'Networking events, startup lectures and monthly pitching focused on the Taiwan ecosystem. Active Meetup group.',
    status:'Venue varies — RSVP on Meetup.',
    url:'https://www.meetup.com/taiwan-startup-ecosystem-community/',
  },
  {
    id:'ten', name:'Taiwan Entrepreneurs Network', zh:'', cat:'meetup', nb:'daan',
    lat:25.0380, lng:121.5430, date_label:'Regular',
    about:'Casual networking events and workshops open to all — a broad, welcoming entry point to Taipei founders.',
    status:'Venue varies — RSVP on Meetup.',
    url:'https://www.meetup.com/Taiwan-Entrepreneurs-Network/',
  },
  {
    id:'meettaipei', name:'Meet Taipei Startup Festival', zh:'', cat:'meetup', nb:'zhongshan',
    lat:25.0810, lng:121.5230, date_label:'Annual · late November',
    about:"Asia's biggest startup festival — hundreds of teams, investors and international founders at the Expo Dome. The one big date to plan around.",
    status:'Annual; 2025 ran Nov 20–22 at Expo Dome.',
    url:'https://duckduckgo.com/?q=Meet+Taipei+startup+festival',
    details:[['When','Late Nov (2025: Nov 20–22)'],['Where','Taipei Expo Dome, Yuanshan'],['Scale','Hundreds of teams + intl investors']],
  },
  // Galleries
  {
    id:'eachmodern', name:'Each Modern', zh:'亞紀畫廊', cat:'gallery', nb:'daan',
    lat:25.0335, lng:121.5380,
    about:"Refined Da'an gallery showing Asian and international contemporary alongside rediscovered modern figures — the closest in spirit to ShugoArts. Considered hangs, strong programme.",
    status:'Pin approximate — confirm address & current show.',
    details:[['Hours','Tue–Sat ~12–7pm; closed Sun–Mon'],['Now showing','Antone Könst — "Subjects", 13 Jun–25 Jul 2026'],['Opened','Sat 13 Jun'],['Roster','Shohei Takasaki, Antone Könst, Xu Jiong']],
  },
  {
    id:'projectfulfill', name:'Project Fulfill Art Space', zh:'就在藝術空間', cat:'gallery', nb:'daan',
    lat:25.0335, lng:121.5440,
    about:"Established 2008; tucked off Xinyi Rd, it emphasises site-specific, concept-driven shows by emerging and mid-career artists. Quietly one of the best.",
    address_apple:'Lane 147, Section 3, Xinyi Road, Da\'an District, Taipei, Taiwan', verified:0,
    details:[['Hours','Tue–Sat ~1–7pm; closed Sun–Mon'],['Address','Alley 45, Ln 147, Sec 3, Xinyi Rd'],['MRT','Daan / Zhongxiao Dunhua']],
  },
  {
    id:'tkgplus', name:'TKG+', zh:'', cat:'gallery', nb:'neihu',
    lat:25.0796, lng:121.5760,
    about:'The experimental contemporary arm of Tina Keng — ambitious, museum-grade installations and new media by Asian artists. Anchor of the Neihu gallery cluster.',
    address_apple:'No. 15, Lane 548, Ruiguang Road, Neihu District, Taipei, Taiwan', verified:1,
    details:[['Hours','Tue–Sat 11–6pm; closed Sun–Mon'],['Now showing','Mit Jai Inn "CYCLES" + Enrico Oyama (TKG+ Projects) — both thru 4 Jul 2026'],['Receptions','Confirmed pattern: Saturdays 4:30pm'],['Next','Autumn show opens late Aug (TBA) — Tina Keng Su Meng-Hung runs thru 10 Jul']],
  },
  {
    id:'doublesquare', name:'Double Square Gallery', zh:'双方藝廊', cat:'gallery', nb:'neihu',
    lat:25.0808, lng:121.5535,
    about:'Two-room space for multidisciplinary, concept-driven shows by Taiwanese and international contemporary artists. Curator-minded and ambitious.',
    status:'Pin approximate — confirm address.',
    details:[['Hours','Tue–Sat ~11–6:30pm; closed Sun–Mon'],['Focus','Concept-driven contemporary'],['Area','Dazhi / Zhongshan edge']],
  },
  {
    id:'bluerider', name:'Bluerider ART', zh:'', cat:'gallery', nb:'daan',
    lat:25.0382, lng:121.5535,
    about:'Polished commercial gallery (est. 2013) focused on Western contemporary art in Asia — rare here. Main space on Dunhua S Rd, plus Ren\'ai halls.',
    address_apple:'No. 77, Section 2, Dunhua South Road, Da\'an District, Taipei, Taiwan', verified:1,
    details:[['Hours','Tue–Sun 10–6:30pm; closed Mon'],['Main space','1F, No.77 Sec.2 Dunhua S Rd, Da\'an'],['Now showing','Current show 23 May–19 Jul 2026'],['Openings','Fri press preview + Sat reception 2:30–6pm']],
  },
  {
    id:'chiwen', name:'Chi-Wen Gallery', zh:'其玟畫廊', cat:'gallery', nb:'shilin',
    lat:25.0955, lng:121.5260,
    about:'Leading voice for video, photography and new-media art — championed Yuan Goang-Ming and a generation of experimental Taiwanese artists.',
    status:'By appointment / pin approximate — confirm before visiting.',
    details:[['Hours','Often by appointment — email ahead'],['Focus','Video, photography, new media'],['Area','Shilin']],
  },
  {
    id:'eslitegallery', name:'Eslite Gallery', zh:'誠品畫廊', cat:'gallery', nb:'songshan',
    lat:25.0440, lng:121.5608,
    about:"Taiwan's first contemporary gallery (1989) — a heavyweight showing major Chinese and intl artists (Cai Guo-Qiang, Liu Xiaodong, Xu Bing). Reliable, well-produced shows.",
    address_apple:'No. 88, Yanchang Road, Songshan District, Taipei, Taiwan', verified:1,
    details:[['Hours','Tue–Sat 11–7pm; closed Sun–Mon'],['Address','B1, No.88 Yanchang Rd, Songshan'],['Note','By Songshan Cultural & Creative Park']],
  },
  {
    id:'whitestone', name:'Whitestone Gallery', zh:'白石畫廊', cat:'gallery', nb:'neihu',
    lat:25.0802, lng:121.5762,
    about:'Tokyo gallery (est. 1967) with a striking cypress-wood Kuma-designed Taipei space in Neihu. Shows Japanese and Asian contemporary — a natural fit if you like the Tokyo blue-chips.',
    status:'Pin approximate — confirm address.',
    address_apple:'No. 15, Lane 548, Ruiguang Road, Neihu District, Taipei, Taiwan', verified:0,
    details:[['Hours','Tue–Sun 11–7pm; closed Mon'],['Now showing','Karen Shiozawa — "Emerald Ocean", 13 Jun–18 Jul 2026'],['Area','Neihu, near the TKG cluster']],
  },
  // Anchors
  {
    id:'mainsta', name:'Taipei Main', zh:'台北車站', cat:'anchor', nb:'zhongzheng',
    lat:25.0478, lng:121.5170,
    about:'The central transit knot — MRT, TRA and HSR all meet here.',
    address_apple:'Taipei Main Station, Zhongzheng District, Taipei, Taiwan', verified:1,
  },
  {
    id:'t101', name:'Taipei 101', zh:'台北101', cat:'anchor', nb:'xinyi',
    lat:25.0339, lng:121.5645,
    about:'The landmark and Xinyi anchor — useful reference for the east side.',
    address_apple:'No. 7, Section 5, Xinyi Road, Xinyi District, Taipei, Taiwan', verified:1,
  },
];

for (const s of SPOTS) {
  insertSpot.run(
    s.id, s.name, s.zh ?? '', s.cat, s.nb ?? null,
    s.lat ?? null, s.lng ?? null, s.no_map ? 1 : 0,
    s.about ?? null, s.status ?? null, s.url ?? null,
    s.address_apple ?? null, s.verified ?? 0
  );
  for (const [k, v] of (s.details || [])) {
    insertDetail.run(s.id, k, v);
  }
}

// ── Sources ──────────────────────────────────────────────────────────────────
const insertSource = db.prepare(`
  INSERT INTO sources (name, url, type, last_checked_at)
  VALUES (?, ?, ?, ?) RETURNING id
`);
const insertSpotSource = db.prepare(`INSERT INTO spot_sources (spot_id, source_id, confidence) VALUES (?, ?, ?)`);
const insertEventSource = db.prepare(`INSERT INTO event_sources (event_id, source_id, confidence) VALUES (?, ?, ?)`);

function addSource(name, url, type) {
  return insertSource.get(name, url, type, null).id;
}

const srcWall    = addSource('The Wall KKTix',            'https://thewalllivehouse.kktix.cc',                               'kktix');
const srcPawnRA  = addSource('Pawnshop on Resident Advisor','https://ra.co/clubs/159278',                                   'ra');
const srcPawnIG  = addSource('Pawnshop Instagram',         'https://www.instagram.com/pawnshop_taipei/',                    'instagram');
const srcSGTaipei= addSource('Startup Grind Taipei',       'https://www.startupgrind.com/taipei/',                         'website');
const srcTechTaipei = addSource('TechTaipei',              'https://techtaipei.com/',                                       'website');
const srcTSEC    = addSource('TSEC on Meetup',             'https://www.meetup.com/taiwan-startup-ecosystem-community/',    'meetup');
const srcTEN     = addSource('TEN on Meetup',              'https://www.meetup.com/Taiwan-Entrepreneurs-Network/',          'meetup');
const srcMeetTaipei = addSource('Meet Taipei Festival',   'https://www.meettaipei.tw/',                                    'website');
const srcTKG     = addSource('TKG+ website',               'https://www.tkgplus.com/',                                      'website');
const srcBluerider = addSource('Bluerider ART',            'https://www.blueriderart.com/',                                 'website');
const srcEachModern = addSource('Each Modern',             'https://www.eachmodern.com/',                                   'website');
const srcWhitestone = addSource('Whitestone Gallery Taipei','https://whitestone-gallery.com/exhibitions/?location=taipei',  'website');

// Link sources to spots
insertSpotSource.run('thewall',      srcWall,       'confirmed');
insertSpotSource.run('pawnshop',     srcPawnRA,     'confirmed');
insertSpotSource.run('pawnshop',     srcPawnIG,     'confirmed');
insertSpotSource.run('startupgrind', srcSGTaipei,   'confirmed');
insertSpotSource.run('techtaipei',   srcTechTaipei, 'confirmed');
insertSpotSource.run('tsec',         srcTSEC,       'confirmed');
insertSpotSource.run('ten',          srcTEN,        'confirmed');
insertSpotSource.run('meettaipei',   srcMeetTaipei, 'confirmed');
insertSpotSource.run('tkgplus',      srcTKG,        'confirmed');
insertSpotSource.run('bluerider',    srcBluerider,  'confirmed');
insertSpotSource.run('eachmodern',   srcEachModern, 'confirmed');
insertSpotSource.run('whitestone',   srcWhitestone, 'confirmed');

// ── Events ───────────────────────────────────────────────────────────────────
const insertEvent = db.prepare(`
  INSERT INTO events (id, title, location, location_apple, date, start_time, end_time, all_day, rrule, cadence_label, category, description, status, url, spot_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const WALL_APPLE = 'No. 200, Section 4, Roosevelt Road, Zhongzheng District, Taipei, Taiwan';
const PAWNSHOP_APPLE = 'No. 279, Section 4, Xinyi Road, Da\'an District, Taipei, Taiwan';

const EVENTS = [
  // MOX Friday (recurring)
  { id:'mox-2026-07-03', title:'MOX Friday — founder + investor happy hour', loc:'Taipei (venue varies — check listing)', loc_apple:null, date:'2026-07-03', start:'19:00', end:'21:00', cat:'meetup', status:'tentative', desc:'SOSV/MOX ecosystem happy hour. Confirm venue before heading out.', url:'https://www.startupgrind.com/taipei/', spot:'moxfriday' },
  { id:'mox-2026-08-07', title:'MOX Friday — founder + investor happy hour', loc:'Taipei (venue varies — check listing)', loc_apple:null, date:'2026-08-07', start:'19:00', end:'21:00', cat:'meetup', status:'tentative', desc:'SOSV/MOX ecosystem happy hour. Confirm venue before heading out.', url:'https://www.startupgrind.com/taipei/', spot:'moxfriday' },
  { id:'mox-2026-09-04', title:'MOX Friday — founder + investor happy hour', loc:'Taipei (venue varies — check listing)', loc_apple:null, date:'2026-09-04', start:'19:00', end:'21:00', cat:'meetup', status:'tentative', desc:'SOSV/MOX ecosystem happy hour. Confirm venue before heading out.', url:'https://www.startupgrind.com/taipei/', spot:'moxfriday' },
  // Tentative meetups
  { id:'tent-0', title:'Startup Grind Taipei — TENTATIVE, verify date', loc:'Taipei (RSVP online)', loc_apple:null, date:'2026-07-15', all_day:1, cat:'meetup', status:'tentative', desc:'Cadence-based placeholder — confirm the real date before relying on it.', url:'https://www.startupgrind.com/taipei/', spot:'startupgrind' },
  { id:'tent-1', title:'Startup Grind Taipei — TENTATIVE, verify date', loc:'Taipei (RSVP online)', loc_apple:null, date:'2026-08-19', all_day:1, cat:'meetup', status:'tentative', desc:'Cadence-based placeholder — confirm the real date before relying on it.', url:'https://www.startupgrind.com/taipei/', spot:'startupgrind' },
  { id:'tent-2', title:'Startup Grind Taipei — TENTATIVE, verify date', loc:'Taipei (RSVP online)', loc_apple:null, date:'2026-09-09', all_day:1, cat:'meetup', status:'tentative', desc:'Cadence-based placeholder — confirm the real date before relying on it.', url:'https://www.startupgrind.com/taipei/', spot:'startupgrind' },
  { id:'tent-3', title:'Taiwan Startup Ecosystem Community — TENTATIVE, verify date', loc:'Taipei (RSVP online)', loc_apple:null, date:'2026-07-22', all_day:1, cat:'meetup', status:'tentative', desc:'Cadence-based placeholder — confirm the real date before relying on it.', url:'https://www.meetup.com/taiwan-startup-ecosystem-community/', spot:'tsec' },
  { id:'tent-4', title:'Taiwan Startup Ecosystem Community — TENTATIVE, verify date', loc:'Taipei (RSVP online)', loc_apple:null, date:'2026-08-26', all_day:1, cat:'meetup', status:'tentative', desc:'Cadence-based placeholder — confirm the real date before relying on it.', url:'https://www.meetup.com/taiwan-startup-ecosystem-community/', spot:'tsec' },
  { id:'tent-5', title:'Taiwan Entrepreneurs Network — TENTATIVE, verify date', loc:'Taipei (RSVP online)', loc_apple:null, date:'2026-07-29', all_day:1, cat:'meetup', status:'tentative', desc:'Cadence-based placeholder — confirm the real date before relying on it.', url:'https://www.meetup.com/Taiwan-Entrepreneurs-Network/', spot:'ten' },
  { id:'tent-6', title:'TechTaipei drinks — TENTATIVE, verify date', loc:'Taipei (RSVP online)', loc_apple:null, date:'2026-08-13', all_day:1, cat:'meetup', status:'tentative', desc:'Cadence-based placeholder — confirm the real date before relying on it.', url:'https://techtaipei.com/', spot:'techtaipei' },
  // Pawnshop (recurring)
  { id:'pawnshop-wk', title:'Pawnshop open — check RA/IG for lineup', loc:"B1, 279 Sec.4 Xinyi Rd, Da'an", loc_apple:PAWNSHOP_APPLE, date:'2026-07-03', start:'23:00', end:'23:59', cat:'music', status:'confirmed', rrule:'FREQ=WEEKLY;BYDAY=FR,SA;UNTIL=20260915T235900Z', cadence:'Fri & Sat nights, through Sep 15', desc:'Techno / leftfield electronic. Lineups posted ~1–2 weeks ahead on Resident Advisor & Instagram.', spot:'pawnshop' },
  // Live house reminder (recurring)
  { id:'livehouse-wk', title:'Check live houses for weekend gigs (PIPE · Waiting Room · Witch House)', loc:'Taipei', loc_apple:null, date:'2026-07-01', all_day:1, cat:'music', status:'unknown', rrule:'FREQ=WEEKLY;BYDAY=WE;UNTIL=20260915', cadence:'Wednesdays, through Sep 15', desc:"These post bookings ~2–4 weeks out — scan for experimental / electronic nights. (The Wall's lineup is already listed above.)" },
  // The Wall shows
  { id:'wall-0', title:'The Wall: NO STAGE NO WALLS',                        loc:"The Wall, B1 No.200 Sec.4 Roosevelt Rd, Gongguan", loc_apple:WALL_APPLE, date:'2026-07-04', start:'19:00', cat:'music', status:'confirmed', desc:'Indie / punk / disco bill. Tickets: thewalllivehouse.kktix.cc', spot:'thewall' },
  { id:'wall-1', title:'The Wall: 肉聲菩薩 (noise / experimental)',           loc:"The Wall, B1 No.200 Sec.4 Roosevelt Rd, Gongguan", loc_apple:WALL_APPLE, date:'2026-07-05', start:'19:30', cat:'music', status:'confirmed', desc:'Wall-of-sound noise night — the loud, leftfield end. Tickets: thewalllivehouse.kktix.cc', spot:'thewall' },
  { id:'wall-2', title:'The Wall: Malpaca 羊駝小姐 — "Now… What?"',          loc:"The Wall, B1 No.200 Sec.4 Roosevelt Rd, Gongguan", loc_apple:WALL_APPLE, date:'2026-07-11', start:'20:00', cat:'music', status:'confirmed', desc:'First headline show. Tickets: thewalllivehouse.kktix.cc', spot:'thewall' },
  { id:'wall-3', title:'The Wall: 黃澤森 — 陰森童話故事集',                  loc:"The Wall, B1 No.200 Sec.4 Roosevelt Rd, Gongguan", loc_apple:WALL_APPLE, date:'2026-07-26', start:'20:00', cat:'music', status:'confirmed', desc:'Solo return after three years. Tickets: thewalllivehouse.kktix.cc', spot:'thewall' },
  { id:'wall-4', title:'The Wall: Friko (US) Live in Taipei',                loc:"The Wall, B1 No.200 Sec.4 Roosevelt Rd, Gongguan", loc_apple:WALL_APPLE, date:'2026-07-30', start:'20:00', cat:'music', status:'confirmed', desc:'Chicago alt / post-punk — buzzy international booking. Tickets: thewalllivehouse.kktix.cc', spot:'thewall' },
  { id:'wall-5', title:'The Wall: MILLI — JAA EHH! Asia Tour',               loc:"The Wall, B1 No.200 Sec.4 Roosevelt Rd, Gongguan", loc_apple:WALL_APPLE, date:'2026-08-09', start:'19:00', cat:'music', status:'confirmed', desc:'Thai rapper, Coachella alum. Tickets: thewalllivehouse.kktix.cc', spot:'thewall' },
  { id:'wall-6', title:'The Wall: DENGARYU 田我流 (JP hip-hop)',              loc:"The Wall, B1 No.200 Sec.4 Roosevelt Rd, Gongguan", loc_apple:WALL_APPLE, date:'2026-08-15', start:'20:00', cat:'music', status:'confirmed', desc:'stillichimiya-affiliated Japanese hip-hop. Tickets: thewalllivehouse.kktix.cc', spot:'thewall' },
  // Gallery closings
  { id:'bluerider-close',         title:'Bluerider ART — last day: current Dunhua show',             loc:"Bluerider ART, No.77 Sec.2 Dunhua S Rd, Da'an", loc_apple:'No. 77, Section 2, Dunhua South Road, Da\'an District, Taipei, Taiwan', date:'2026-07-19', all_day:1, cat:'gallery', status:'confirmed', desc:'Confirmed: run 23 May–19 Jul 2026.', spot:'bluerider' },
  { id:'tkg-cycles-close',        title:'TKG+ — last day: Mit Jai Inn "CYCLES"',                    loc:'TKG+ B1, Ln 548 Ruiguang Rd, Neihu',            loc_apple:'No. 15, Lane 548, Ruiguang Road, Neihu District, Taipei, Taiwan', date:'2026-07-04', all_day:1, cat:'gallery', status:'confirmed', desc:'Confirmed: 23 May–4 Jul 2026, reception 23 May (Sat) 4:30pm.', spot:'tkgplus' },
  { id:'tkg-oyama-close',         title:'TKG+ Projects — last day: Enrico Isamu Oyama "Aerosolic Forms"', loc:'TKG+ Projects 2F, Ln 548 Ruiguang Rd, Neihu', loc_apple:'No. 15, Lane 548, Ruiguang Road, Neihu District, Taipei, Taiwan', date:'2026-07-04', all_day:1, cat:'gallery', status:'confirmed', desc:'Confirmed: 14 Mar–4 Jul 2026.', spot:'tkgplus' },
  { id:'tinakeng-su-close',       title:'Tina Keng — last day: Su Meng-Hung "The Flowers of Coromandel"', loc:'Tina Keng Gallery 1F, Ln 548 Ruiguang Rd, Neihu', loc_apple:'No. 15, Lane 548, Ruiguang Road, Neihu District, Taipei, Taiwan', date:'2026-07-10', all_day:1, cat:'gallery', status:'confirmed', desc:'Confirmed: opened 8 May 2026, closes 10–11 Jul.', spot:'tkgplus' },
  { id:'eachmodern-konst-close',  title:'Each Modern — last day: Antone Könst "Subjects"',          loc:"Each Modern, Da'an",                             loc_apple:null, date:'2026-07-25', all_day:1, cat:'gallery', status:'confirmed', desc:'Confirmed: 13 Jun–25 Jul 2026.', spot:'eachmodern' },
  { id:'whitestone-shiozawa-close',title:'Whitestone — last day: Karen Shiozawa "Emerald Ocean"',   loc:'Whitestone Gallery, Neihu',                      loc_apple:'No. 15, Lane 548, Ruiguang Road, Neihu District, Taipei, Taiwan', date:'2026-07-18', all_day:1, cat:'gallery', status:'confirmed', desc:'Confirmed: 13 Jun–18 Jul 2026.', spot:'whitestone' },
  { id:'gallery-neihu-sat',       title:'Neihu gallery day — TKG+ / Tina Keng cluster',             loc:'Ln 548 Ruiguang Rd, Neihu (one building)',       loc_apple:'No. 15, Lane 548, Ruiguang Road, Neihu District, Taipei, Taiwan', date:'2026-07-04', all_day:1, cat:'gallery', status:'confirmed', desc:'TKG+, TKG+ Projects and Tina Keng share No.15, Ln 548 Ruiguang Rd. Tue–Sat 11–6. Autumn shows reopen late Aug — receptions on Saturdays 4:30pm. Check tkgplus.com.', spot:'tkgplus' },
];

for (const e of EVENTS) {
  insertEvent.run(
    e.id, e.title, e.loc, e.loc_apple ?? null,
    e.date ?? null, e.start ?? null, e.end ?? null,
    e.all_day ? 1 : 0, e.rrule ?? null, e.cadence ?? null,
    e.cat, e.desc ?? null, e.status ?? 'unknown',
    e.url ?? null, e.spot ?? null
  );
}

// Link Wall events to Wall KKTix source
for (let i = 0; i <= 6; i++) insertEventSource.run(`wall-${i}`, srcWall, 'confirmed');
// Pawnshop recurring
insertEventSource.run('pawnshop-wk', srcPawnRA, 'confirmed');
insertEventSource.run('pawnshop-wk', srcPawnIG, 'confirmed');
// Meetups
for (const [id, src] of [
  ['tent-0',''], ['tent-1',''], ['tent-2',''],
]) {} // startupgrind events link to srcSGTaipei but we'll let the crawl confirm them
insertEventSource.run('tent-0', srcSGTaipei, 'inferred');
insertEventSource.run('tent-1', srcSGTaipei, 'inferred');
insertEventSource.run('tent-2', srcSGTaipei, 'inferred');
insertEventSource.run('tent-3', srcTSEC, 'inferred');
insertEventSource.run('tent-4', srcTSEC, 'inferred');
insertEventSource.run('tent-5', srcTEN,  'inferred');
insertEventSource.run('tent-6', srcTechTaipei, 'inferred');
// Gallery closing events
insertEventSource.run('bluerider-close',          srcBluerider,   'confirmed');
insertEventSource.run('tkg-cycles-close',         srcTKG,         'confirmed');
insertEventSource.run('tkg-oyama-close',          srcTKG,         'confirmed');
insertEventSource.run('tinakeng-su-close',        srcTKG,         'confirmed');
insertEventSource.run('eachmodern-konst-close',   srcEachModern,  'confirmed');
insertEventSource.run('whitestone-shiozawa-close',srcWhitestone,  'confirmed');
insertEventSource.run('gallery-neihu-sat',        srcTKG,         'confirmed');

db.close();
console.log('✓ taipei.db created');

// Print gap summary
const db2 = new DatabaseSync(DB_PATH);
const gaps = db2.prepare('SELECT * FROM events_by_gap').all();
console.log('\nEvent gap summary:');
console.table(gaps);
const noSrc = db2.prepare('SELECT * FROM events_no_source').all();
console.log(`\nEvents with no source: ${noSrc.length}`);
if (noSrc.length) console.table(noSrc);
db2.close();
