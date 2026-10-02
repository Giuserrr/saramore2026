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
const START = '<!-- BUILD:CLASSES:START -->';
const END = '<!-- BUILD:CLASSES:END -->';
const DAYS = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];

const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tidyTime = t => String(t || '').replace(/\./g, ':').replace(/\s*-\s*/, ' - ').replace(/\b(\d):/g, '0$1:').trim();
const minutes = t => { const m = /(\d{1,2}):(\d{2})/.exec(tidyTime(t)); return m ? (+m[1]) * 60 + (+m[2]) : 9999; };

function render(classes) {
    const active = classes.filter(c => c.active === true || c.active === 'true');
    active.sort((a, b) => (DAYS.indexOf(norm(a.day)) - DAYS.indexOf(norm(b.day))) || (minutes(a.time) - minutes(b.time)));
    const monthly = c => /mensile/i.test(c.desc || '');
    const weekly = active.filter(c => !monthly(c)).length;
    const rows = active.map(c =>
        `          <tr><td>${esc(c.day)}</td><td>${esc(tidyTime(c.time))}</td><td>${esc(c.name)}${monthly(c) ? ' <span class="schedule-note">(appuntamento mensile)</span>' : ''}</td><td>${esc(c.maxSpots)}</td></tr>`
    ).join('\n');
    const places = [...new Set(active.map(c => c.location).filter(Boolean))].map(esc).join(' · ');
    const today = new Date().toISOString().slice(0, 10);
    return `${START}
      <!-- generato da build-classes.js il ${today} da classes.json: NON modificare a mano -->
      <table class="schedule-table" aria-label="Orario settimanale delle lezioni di gruppo">
        <thead>
          <tr><th>Giorno</th><th>Orario</th><th>Classe</th><th>Posti</th></tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>
      <p class="schedule-caption">${weekly} classi settimanali${active.length > weekly ? ` e ${active.length - weekly} appuntamento mensile` : ''}, tutte presso ${places}. Orario aggiornato da Sara: quando cambia, cambia anche qui.</p>
      ${END}`;
}

function inject(file, block) {
    const p = path.join(ROOT, file);
    if (!fs.existsSync(p)) { console.warn(`[build-classes] ${file} non trovato, skip`); return; }
    const html = fs.readFileSync(p, 'utf8');
    const a = html.indexOf(START), b = html.indexOf(END);
    if (a < 0 || b < 0 || b < a) { console.warn(`[build-classes] marker mancanti in ${file}, skip`); return; }
    const next = html.slice(0, a) + block + html.slice(b + END.length);
    if (next !== html) { fs.writeFileSync(p, next, 'utf8'); console.log(`[build-classes] ${file} aggiornato`); }
    else console.log(`[build-classes] ${file} già aggiornato`);
}

try {
    const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
    const block = render(Array.isArray(data.classes) ? data.classes : []);
    PAGES.forEach(f => inject(f, block));
} catch (e) {
    console.error('[build-classes] errore (la build continua):', e.message);
}
