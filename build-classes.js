#!/usr/bin/env node
/**
 * build-classes.js — Orario delle classi in HTML statico, generato da classes.json (fonte unica, aggiornata da Sara via Decap).
 *
 * Perché: le pagine caricavano l'orario solo via JavaScript; i testi scritti a mano invecchiavano (orario di maggio 2026
 * ancora online a ottobre). Da qui in poi l'orario scritto nelle pagine è SEMPRE quello di classes.json.
 *
 * Inietta una tabella tra i marker <!-- BUILD:CLASSES:START --> ... <!-- BUILD:CLASSES:END --> in:
 *   - lezioni-di-gruppo/index.html   (tabella completa + nota)
 *   - yoga-genova-carignano/index.html (stessa tabella)
 * Idempotente, zero dipendenze. Gira nella build Netlify (netlify.toml) e a mano: node build-classes.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'classes.json');
const PAGES = ['lezioni-di-gruppo/index.html', 'yoga-genova-carignano/index.html'];
const EXTRA = { // altri punti generati dalla stessa fonte (02/10/2026, F08)
    'yoga-gravidanza-genova/index.html': ['CLASSES-GRAVIDANZA'],
    'index.html': ['CLASSES-COUNT'],
};
const START = '<!-- BUILD:CLASSES:START -->';
const END = '<!-- BUILD:CLASSES:END -->';
const DAYS = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];

const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tidyTime = t => String(t || '').replace(/\./g, ':').replace(/\s*-\s*/, ' - ').replace(/\b(\d):/g, '0$1:').trim();
const minutes = t => { const m = /(\d{1,2}):(\d{2})/.exec(tidyTime(t)); return m ? (+m[1]) * 60 + (+m[2]) : 9999; };

const monthly = c => c.frequency === 'mensile' || /mensile/i.test(c.desc || '');

/** Valida e ordina le classi attive. Dati invalidi fermano la build (il deploy precedente resta online). */
function activeClasses(classes) {
    if (!Array.isArray(classes)) throw new Error('classes.json: "classes" non e\' una lista');
    const active = classes.filter(c => c && (c.active === true || c.active === 'true'));
    const errors = [];
    active.forEach((c, i) => {
        if (!c.name || !String(c.name).trim()) errors.push(`classe #${i + 1}: nome mancante`);
        if (!DAYS.includes(norm(c.day))) errors.push(`classe "${c.name}": giorno non riconosciuto "${c.day}"`);
        if (minutes(c.time) === 9999) errors.push(`classe "${c.name}": orario non riconosciuto "${c.time}"`);
        if (!(Number(c.maxSpots) > 0)) errors.push(`classe "${c.name}": posti massimi non validi "${c.maxSpots}"`);
    });
    if (errors.length) throw new Error('dati non validi:\n  - ' + errors.join('\n  - '));
    active.sort((a, b) => (DAYS.indexOf(norm(a.day)) - DAYS.indexOf(norm(b.day))) || (minutes(a.time) - minutes(b.time)));
    return active;
}

function render(active) {
    const weekly = active.filter(c => !monthly(c)).length;
    const rows = active.map(c =>
        `          <tr><td data-label="Giorno">${esc(c.day)}</td><td data-label="Orario">${esc(tidyTime(c.time))}</td><td data-label="Classe">${esc(c.name)}${monthly(c) ? ' <span class="schedule-note">(appuntamento mensile)</span>' : ''}</td><td data-label="Partecipanti">Massimo ${esc(c.maxSpots)}</td></tr>`
    ).join('\n');
    const places = [...new Set(active.map(c => c.location).filter(Boolean))].map(esc).join(' · ');
    const today = new Date().toISOString().slice(0, 10);
    return `${START}
      <!-- generato da build-classes.js il ${today} da classes.json: NON modificare a mano -->
      <table class="schedule-table" aria-label="Orario settimanale delle lezioni di gruppo">
        <thead>
          <tr><th>Giorno</th><th>Orario</th><th>Classe</th><th>Partecipanti</th></tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>
      <p class="schedule-caption">${weekly} classi settimanali${active.length > weekly ? ` e ${active.length - weekly} appuntamento mensile` : ''}, tutte presso ${places}. Orario aggiornato da Sara: quando cambia, cambia anche qui.</p>
      ${END}`;
}

/** Riepilogo in prosa delle classi di gravidanza: "il <strong>martedì dalle 14:30 alle 15:30</strong> e il <strong>giovedì ...</strong>" */
function gravidanzaText(active) {
    const g = active.filter(c => /gravidanza/i.test(c.name));
    const parts = g.map(c => { const [s1, s2] = tidyTime(c.time).split(' - '); return `il <strong>${esc(String(c.day).toLowerCase())} dalle ${s1}${s2 ? ' alle ' + s2 : ''}</strong>`; });
    return parts.length ? parts.join(' e ') : 'su appuntamento';
}

function inject(file, block, startMark = START, endMark = END) {
    const p = path.join(ROOT, file);
    if (!fs.existsSync(p)) throw new Error(`${file} non trovato`);
    const html = fs.readFileSync(p, 'utf8');
    const a = html.indexOf(startMark), b = html.indexOf(endMark);
    if (a < 0 || b < 0 || b < a) throw new Error(`marker ${startMark} mancanti in ${file}`);
    const next = html.slice(0, a) + block + html.slice(b + endMark.length);
    if (next !== html) { fs.writeFileSync(p, next, 'utf8'); console.log(`[build-classes] ${file} aggiornato`); }
    else console.log(`[build-classes] ${file} già aggiornato`);
}

try {
    const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
    const active = activeClasses(data.classes);
    const block = render(active);
    PAGES.forEach(f => inject(f, block));
    const weekly = active.filter(c => !monthly(c)).length;
    Object.entries(EXTRA).forEach(([file, kinds]) => kinds.forEach(kind => {
        const S = `<!-- BUILD:${kind}:START -->`, E = `<!-- BUILD:${kind}:END -->`;
        const inner = kind === 'CLASSES-GRAVIDANZA' ? gravidanzaText(active) : String(weekly);
        inject(file, `${S}${inner}${E}`, S, E);
    }));
} catch (e) {
    console.error('[build-classes] ERRORE, build fermata (resta online il deploy precedente):', e.message);
    process.exit(1);
}
