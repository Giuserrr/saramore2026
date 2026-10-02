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

/** Offset Europe/Rome (CET/CEST) per una data civile italiana.
 *  +02:00 da ultima domenica di marzo a ultima domenica di ottobre, +01:00 altrimenti.
 *  Portatile: non dipende dal TZ del processo (Mac CEST vs Netlify UTC). */
function italianOffset(year, month, day) {
    const refUtc = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0));
    const y = refUtc.getUTCFullYear();
    const dstStart = new Date(Date.UTC(y, 2, 31, 1, 0, 0));
    dstStart.setUTCDate(31 - dstStart.getUTCDay());
    const dstEnd = new Date(Date.UTC(y, 9, 31, 1, 0, 0));
    dstEnd.setUTCDate(31 - dstEnd.getUTCDay());
    return (refUtc >= dstStart && refUtc < dstEnd) ? '+02:00' : '+01:00';
}

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
        iso += `T${hh}:${mm}:00${italianOffset(year, month, day)}`;
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

/** Card HTML statiche dei prossimi eventi tra i marker BUILD:EVENTS-HTML (02/10/2026, F04):
 *  visibili senza JavaScript e ai crawler; main.js le sostituisce con le card interattive. */
function injectEventCards(activeEvents, fallbackYear) {
    const S = '<!-- BUILD:EVENTS-HTML:START -->', E = '<!-- BUILD:EVENTS-HTML:END -->';
    let html = fs.readFileSync(EVENTI_HTML, 'utf8');
    const a = html.indexOf(S), b = html.indexOf(E);
    if (a < 0 || b < 0) { console.warn('[build-schema] marker BUILD:EVENTS-HTML mancanti, card statiche saltate'); return; }
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 1); cutoff.setHours(0, 0, 0, 0);
    const esc = t => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const fmt = iso => { const d = new Date(iso); if (isNaN(d)) return iso; return d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' }) + (iso.includes('T') ? ' ore ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }) : ''); };
    const cards = [];
    activeEvents.forEach(ev => {
        const occ = eventOccurrences(ev, fallbackYear);
        const future = occ.filter(o => { const t = new Date(o.startDate).getTime(); return isNaN(t) || t >= cutoff.getTime(); });
        if (occ.length && !future.length) return; // tutte le date passate: non e' un prossimo evento
        const when = future.length ? future.map(o => (o.label ? o.label + ': ' : '') + fmt(o.startDate)).join(' · ') : esc(ev.date);
        const named = Array.isArray(ev.offers) ? ev.offers.filter(o => o && o.name && Number.isFinite(Number(o.price))) : [];
        const price = named.length ? named.map(o => `${esc(o.name)} ${Number(o.price)} €`).join(' · ') : (ev.price ? esc(ev.price) + ' €' : '');
        const img = ev.image ? `<img src="${esc(ev.image)}" alt="${esc(ev.title)}" loading="lazy" decoding="async">` : '';
        cards.push(`      <article class="card" id="${slugifyEvent(ev.title)}">${img}<div class="card-info"><h3>${esc(String(ev.title).trim())}</h3><p>${when}</p>${ev.location ? `<p>${esc(ev.location)}</p>` : ''}${price ? `<p>${price}</p>` : ''}</div></article>`);
    });
    const block = `${S}\n${cards.join('\n')}\n      ${E}`;
    const next = html.slice(0, a) + block + html.slice(b + E.length);
    if (next !== html) { fs.writeFileSync(EVENTI_HTML, next, 'utf8'); console.log(`[build-schema] ${cards.length} card HTML statiche scritte in eventi/index.html`); }
}

/** Slug coerente con slugifyEvent() in assets/js/main.js (deep-link hash). */
function slugifyEvent(text) {
    return (text || '').toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/** Calcola endDate ipotizzando 90 minuti se startDate ha orario.
 *  Mantiene lo stesso offset di startIso e fa la math in UTC → portatile su qualsiasi TZ. */
function computeEndDate(startIso, durationMinutes) {
    if (!startIso || !startIso.includes('T')) return null;
    const dur = Number.isFinite(durationMinutes) ? durationMinutes : 90;
    const d = new Date(startIso);
    if (isNaN(d.getTime())) return null;
    d.setUTCMinutes(d.getUTCMinutes() + dur);
    const offsetMatch = startIso.match(/([+-]\d{2}):(\d{2})$/);
    const offset = offsetMatch ? `${offsetMatch[1]}:${offsetMatch[2]}` : '+01:00';
    const offsetMin = offsetMatch
        ? (offsetMatch[1][0] === '+' ? 1 : -1) * (parseInt(offsetMatch[1].slice(1)) * 60 + parseInt(offsetMatch[2]))
        : 60;
    const localMs = d.getTime() + offsetMin * 60000;
    const local = new Date(localMs);
    const pad = n => String(n).padStart(2, '0');
    return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:00${offset}`;
}

/** Occorrenze di un evento: da ev.dates (strutturato, preferito) oppure dal testo ev.date. */
function eventOccurrences(ev, fallbackYear) {
    const out = [];
    if (Array.isArray(ev.dates) && ev.dates.length) {
        ev.dates.forEach((d, i) => {
            const day = String(d && d.day || '').slice(0, 10);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
            const [y, m, dd] = day.split('-');
            const off = italianOffset(y, m, dd);
            const start = /^\d{1,2}:\d{2}$/.test(d.start || '') ? `${day}T${d.start.padStart(5, '0')}:00${off}` : day;
            let end = null;
            if (/^\d{1,2}:\d{2}$/.test(d.end || '') && start.includes('T')) end = `${day}T${d.end.padStart(5, '0')}:00${off}`;
            out.push({ startDate: start, endDate: end, label: d.label || '', index: i + 1, total: ev.dates.length });
        });
        return out;
    }
    const startDate = parseItalianDate(ev.date, fallbackYear);
    return startDate ? [{ startDate, endDate: computeEndDate(startDate, ev.durationMinutes), label: '', index: 1, total: 1 }] : [];
}

function eventToSchema(ev, fallbackYear, occ) {
    const startDate = occ.startDate;
    if (!startDate) return null;
    // Skip eventi palesemente passati (cutoff: ieri 00:00 locale).
    // Evita di servire JSON-LD EventScheduled per eventi finiti — error in GSC.
    const startTs = new Date(startDate).getTime();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 1);
    cutoff.setHours(0, 0, 0, 0);
    if (!isNaN(startTs) && startTs < cutoff.getTime()) {
        console.log(`[build-schema] Skip evento passato: "${ev.title}" (${startDate})`);
        return null;
    }
    const schema = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": occ.total > 1 ? `${String(ev.title).trim()} — ${occ.label || 'incontro ' + occ.index} (${occ.index}/${occ.total})` : String(ev.title).trim(),
        "startDate": startDate,
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "eventStatus": "https://schema.org/EventScheduled",
        "location": locationToSchema(ev.location),
        "description": (ev.desc || '').replace(/\s+/g, ' ').trim(),
        "organizer": {
            "@type": "Organization",
            "@id": `${SITE}/#business`,
            "name": "SaraMore Yoga",
            "url": `${SITE}/`
        },
        "performer": {
            "@type": "Person",
            "@id": `${SITE}/#sara`,
            "name": "Sara Maggiori",
            "url": `${SITE}/chi-sono/`
        }
    };
    const endDate = occ.endDate;
    if (endDate) schema.endDate = endDate;
    if (ev.image) {
        const img = ev.image.startsWith('http') ? ev.image : SITE + ev.image;
        schema.image = img;
    }
    // Offerte (02/10/2026, F05): se Sara ha compilato "offers" (nome + prezzo) -> una Offer per formula;
    // altrimenti un solo numero nel campo price -> Offer; piu' numeri senza nomi -> nessuna offerta (non si indovina).
    const offerUrl = (ev.stripeLink && ev.stripeLink.trim()) ? ev.stripeLink : `${SITE}/eventi/#${slugifyEvent(ev.title)}`;
    const named = Array.isArray(ev.offers) ? ev.offers.filter(o => o && o.name && Number.isFinite(Number(o.price))) : [];
    if (named.length) {
        schema.offers = named.map(o => ({ "@type": "Offer", "name": String(o.name), "price": String(Number(o.price)), "priceCurrency": "EUR", "url": offerUrl }));
    } else {
        const nums = (String(ev.price ?? '').match(/\d+(?:[.,]\d+)?/g) || []);
        if (nums.length === 1) {
            schema.offers = { "@type": "Offer", "price": String(parseFloat(nums[0].replace(',', '.'))), "priceCurrency": "EUR", "url": offerUrl };
        }
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

    const schemas = [];
    activeEvents.forEach(e => eventOccurrences(e, fallbackYear).forEach(occ => { const sc = eventToSchema(e, fallbackYear, occ); if (sc) schemas.push(sc); }));
    injectEventCards(activeEvents, fallbackYear);

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
