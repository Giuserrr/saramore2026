#!/usr/bin/env node
/**
 * build-schema.js — Inietta Event JSON-LD in eventi/index.html da events.json.
 *
 * Cerca i marker:
 *   <!-- BUILD:EVENTS:START -->
 *   <!-- BUILD:EVENTS:END -->
 * e sostituisce il contenuto in mezzo con uno <script type="application/ld+json">
 * per ogni evento attivo con data parsabile.
 *
 * Esegue al deploy Netlify (vedi netlify.toml). Idempotente.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const EVENTS_JSON = path.join(ROOT, 'events.json');
const EVENTI_HTML = path.join(ROOT, 'eventi', 'index.html');
const SITE = 'https://saramoreyoga.com';

const MONTHS_IT = {
    'gennaio': '01', 'gen': '01',
    'febbraio': '02', 'feb': '02',
    'marzo': '03', 'mar': '03',
    'aprile': '04', 'apr': '04',
    'maggio': '05', 'mag': '05',
    'giugno': '06', 'giu': '06',
    'luglio': '07', 'lug': '07',
    'agosto': '08', 'ago': '08',
    'settembre': '09', 'set': '09', 'sett': '09',
    'ottobre': '10', 'ott': '10',
    'novembre': '11', 'nov': '11',
    'dicembre': '12', 'dic': '12'
};

/** Parser lenient di date in italiano. Ritorna ISO 8601 o null. */
function parseItalianDate(input, fallbackYear) {
    if (!input || typeof input !== 'string') return null;
    const lower = input.toLowerCase();
    // Cerca: <giorno> <mese> [<anno>] [.* (h|ore|h:|hh:mm)]
    const dateMatch = lower.match(/(\d{1,2})\s+([a-zà]+)(?:\s+(\d{4}))?/);
    if (!dateMatch) return null;
    const day = String(dateMatch[1]).padStart(2, '0');
    const monthName = dateMatch[2].replace(/[^a-z]/g, '');
    const month = MONTHS_IT[monthName];
    if (!month) return null;
    const year = dateMatch[3] || fallbackYear;
    let iso = `${year}-${month}-${day}`;
    // Cerca un orario opzionale: hh:mm o ore hh
    const timeMatch = lower.match(/(?:ore\s+)?(\d{1,2})[:.\s]?(\d{2})?/g);
    // Più conservativo: cerca esplicitamente hh:mm dopo "ore" o dopo trattino
    const explicitTime = lower.match(/(?:ore\s+|h\s*|–\s*|-\s*)(\d{1,2})[:.](\d{2})/);
    if (explicitTime) {
        const hh = String(explicitTime[1]).padStart(2, '0');
        const mm = String(explicitTime[2]).padStart(2, '0');
        iso += `T${hh}:${mm}:00+01:00`;
    }
    return iso;
}

/** Risolve il nome della location in PostalAddress se possibile. */
function locationToSchema(loc) {
    if (!loc) return undefined;
    if (loc.toLowerCase().includes('equilibra') || loc.toLowerCase().includes('alessi')) {
        return {
            "@type": "Place",
            "name": "Studio Equilibra",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Piazza Galeazzo Alessi 2/3",
                "addressLocality": "Genova",
                "postalCode": "16128",
                "addressCountry": "IT"
            }
        };
    }
    if (loc.toLowerCase().includes('jakukai') || loc.toLowerCase().includes('fieschi')) {
        return {
            "@type": "Place",
            "name": "Dojo Jakukai",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Via Fieschi 20",
                "addressLocality": "Genova",
                "postalCode": "16128",
                "addressCountry": "IT"
            }
        };
    }
    return {"@type": "Place", "name": loc};
}

function eventToSchema(ev, fallbackYear) {
    const startDate = parseItalianDate(ev.date, fallbackYear);
    if (!startDate) return null;
    const schema = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": ev.title,
        "startDate": startDate,
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "eventStatus": "https://schema.org/EventScheduled",
        "location": locationToSchema(ev.location),
        "description": (ev.desc || '').substring(0, 500).replace(/\s+/g, ' ').trim(),
        "organizer": {"@id": `${SITE}/#business`},
        "performer": {"@id": `${SITE}/#sara`}
    };
    if (ev.image) {
        const img = ev.image.startsWith('http') ? ev.image : SITE + ev.image;
        schema.image = img;
    }
    if (ev.stripeLink) {
        schema.offers = {
            "@type": "Offer",
            "url": ev.stripeLink,
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock"
        };
        if (ev.price) schema.offers.price = String(ev.price).replace(/[^\d.]/g, '');
    }
    return schema;
}

function main() {
    if (!fs.existsSync(EVENTS_JSON)) {
        console.warn(`[build-schema] events.json non trovato in ${EVENTS_JSON}, skip.`);
        process.exit(0);
    }
    if (!fs.existsSync(EVENTI_HTML)) {
        console.warn(`[build-schema] eventi/index.html non trovato in ${EVENTI_HTML}, skip.`);
        process.exit(0);
    }

    const events = JSON.parse(fs.readFileSync(EVENTS_JSON, 'utf8')).events || [];
    const fallbackYear = String(new Date().getFullYear());
    const activeEvents = events.filter(e => e.active === true || e.active === 'true');

    const schemas = activeEvents
        .map(e => eventToSchema(e, fallbackYear))
        .filter(Boolean);

    const startMarker = '<!-- BUILD:EVENTS:START -->';
    const endMarker = '<!-- BUILD:EVENTS:END -->';

    let html = fs.readFileSync(EVENTI_HTML, 'utf8');
    const startIdx = html.indexOf(startMarker);
    const endIdx = html.indexOf(endMarker);
    if (startIdx < 0 || endIdx < 0) {
        console.warn('[build-schema] Marker BUILD:EVENTS non trovati in eventi/index.html, skip.');
        process.exit(0);
    }

    const generated = schemas.length === 0
        ? `${startMarker}\n    ${endMarker}`
        : `${startMarker}\n` + schemas.map(s =>
            `    <script type="application/ld+json">\n${JSON.stringify(s, null, 2).split('\n').map(l => '    ' + l).join('\n')}\n    </script>`
        ).join('\n') + `\n    ${endMarker}`;

    const before = html.substring(0, startIdx);
    const after = html.substring(endIdx + endMarker.length);
    const next = before + generated + after;

    if (next !== html) {
        fs.writeFileSync(EVENTI_HTML, next, 'utf8');
        console.log(`[build-schema] Iniettati ${schemas.length} Event JSON-LD su ${activeEvents.length} eventi attivi.`);
    } else {
        console.log(`[build-schema] Nessun cambiamento (${schemas.length} schema, già aggiornato).`);
    }
}

main();
