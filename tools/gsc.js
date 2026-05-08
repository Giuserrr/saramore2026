#!/usr/bin/env node
/**
 * gsc.js — Query Google Search Console API per saramoreyoga.com.
 *
 * Auth: service account JSON in ~/.config/saramoreyoga/gsc-credentials.json
 * (override via env GSC_CREDENTIALS).
 *
 * Uso:
 *   node tools/gsc.js sites                  # lista proprietà accessibili
 *   node tools/gsc.js query [days]           # top query ultimi N giorni (default 28)
 *   node tools/gsc.js pages [days]           # top pagine ultimi N giorni
 *   node tools/gsc.js inspect <url>          # stato indicizzazione URL
 *   node tools/gsc.js sitemaps               # stato sitemap
 *   node tools/gsc.js raw <method> <path>    # chiamata API arbitraria GET
 *
 * Output: JSON o tabella ASCII a seconda del comando.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const SITE = 'sc-domain:saramoreyoga.com';
const SITE_URL = 'https://saramoreyoga.com';
const CONFIG_DIR = path.join(os.homedir(), '.config', 'saramoreyoga');
const OAUTH_PATH = process.env.GSC_OAUTH || path.join(CONFIG_DIR, 'gsc-oauth.json');
const SA_PATH = process.env.GSC_CREDENTIALS || path.join(CONFIG_DIR, 'gsc-credentials.json');

function base64UrlEncode(buf) {
    return Buffer.from(buf).toString('base64')
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/** Strategia auth: priorità a OAuth refresh token (workaround bug GSC mag 2026), fallback service account JWT. */
async function getAccessToken() {
    if (fs.existsSync(OAUTH_PATH)) {
        const oauth = JSON.parse(fs.readFileSync(OAUTH_PATH, 'utf8'));
        const res = await fetch(oauth.token_uri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: oauth.client_id,
                client_secret: oauth.client_secret,
                refresh_token: oauth.refresh_token,
                grant_type: 'refresh_token'
            })
        });
        const data = await res.json();
        if (!res.ok) { console.error('[gsc] OAuth refresh error:', data); process.exit(1); }
        return data.access_token;
    }
    if (fs.existsSync(SA_PATH)) {
        const creds = JSON.parse(fs.readFileSync(SA_PATH, 'utf8'));
        const now = Math.floor(Date.now() / 1000);
        const header = { alg: 'RS256', typ: 'JWT' };
        const claim = {
            iss: creds.client_email,
            scope: 'https://www.googleapis.com/auth/webmasters.readonly',
            aud: creds.token_uri,
            exp: now + 3600,
            iat: now
        };
        const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claim))}`;
        const signer = crypto.createSign('RSA-SHA256');
        signer.update(signingInput);
        const signature = base64UrlEncode(signer.sign(creds.private_key));
        const jwt = `${signingInput}.${signature}`;
        const res = await fetch(creds.token_uri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt
            })
        });
        const data = await res.json();
        if (!res.ok) { console.error('[gsc] SA token error:', data); process.exit(1); }
        return data.access_token;
    }
    console.error(`[gsc] Nessuna credenziale: serve ${OAUTH_PATH} (preferito) o ${SA_PATH}`);
    console.error('[gsc] Per OAuth one-shot: node tools/gsc-auth.js');
    process.exit(1);
}

async function api(token, method, urlPath, body) {
    const res = await fetch(`https://searchconsole.googleapis.com${urlPath}`, {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok) {
        console.error(`[gsc] API error ${res.status}:`, data);
        process.exit(1);
    }
    return data;
}

/** Formatta data ISO YYYY-MM-DD da Date. */
function isoDate(d) {
    return d.toISOString().slice(0, 10);
}

/** Range default: ultimi N giorni con offset -3 (latency dati GSC ~3gg). */
function defaultRange(days) {
    const end = new Date();
    end.setDate(end.getDate() - 3);
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    return { startDate: isoDate(start), endDate: isoDate(end) };
}

function formatTable(rows, columns) {
    if (!rows.length) return '(nessun dato)';
    const widths = columns.map(c => Math.max(c.label.length, ...rows.map(r => String(c.get(r) ?? '').length)));
    const sep = widths.map(w => '─'.repeat(w + 2)).join('┼');
    const header = columns.map((c, i) => ' ' + c.label.padEnd(widths[i]) + ' ').join('│');
    const lines = [header, sep];
    for (const r of rows) {
        lines.push(columns.map((c, i) => {
            const v = String(c.get(r) ?? '');
            return ' ' + (c.align === 'right' ? v.padStart(widths[i]) : v.padEnd(widths[i])) + ' ';
        }).join('│'));
    }
    return lines.join('\n');
}

// ---------- Commands ----------

async function cmdSites(token) {
    const data = await api(token, 'GET', '/webmasters/v3/sites');
    console.log('Proprietà accessibili al service account:\n');
    for (const site of (data.siteEntry || [])) {
        console.log(`  ${site.siteUrl}  [${site.permissionLevel}]`);
    }
    if (!data.siteEntry || !data.siteEntry.length) {
        console.log('  (nessuna — verifica di aver aggiunto il service account come utente in GSC)');
    }
}

async function cmdQuery(token, days) {
    const range = defaultRange(days || 28);
    const data = await api(token, 'POST', `/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, {
        startDate: range.startDate,
        endDate: range.endDate,
        dimensions: ['query'],
        rowLimit: 25
    });
    console.log(`Top query ${range.startDate} → ${range.endDate}:\n`);
    const rows = data.rows || [];
    console.log(formatTable(rows, [
        { label: 'Query', get: r => r.keys[0] },
        { label: 'Clicks', align: 'right', get: r => r.clicks },
        { label: 'Impr.', align: 'right', get: r => r.impressions },
        { label: 'CTR', align: 'right', get: r => (r.ctr * 100).toFixed(1) + '%' },
        { label: 'Pos.', align: 'right', get: r => r.position.toFixed(1) }
    ]));
    const tot = rows.reduce((a, r) => ({ c: a.c + r.clicks, i: a.i + r.impressions }), { c: 0, i: 0 });
    console.log(`\nTotale (top ${rows.length}): ${tot.c} clicks · ${tot.i} impressions`);
}

async function cmdPages(token, days) {
    const range = defaultRange(days || 28);
    const data = await api(token, 'POST', `/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, {
        startDate: range.startDate,
        endDate: range.endDate,
        dimensions: ['page'],
        rowLimit: 25
    });
    console.log(`Top pagine ${range.startDate} → ${range.endDate}:\n`);
    const rows = data.rows || [];
    console.log(formatTable(rows, [
        { label: 'Pagina', get: r => r.keys[0].replace(SITE_URL, '') || '/' },
        { label: 'Clicks', align: 'right', get: r => r.clicks },
        { label: 'Impr.', align: 'right', get: r => r.impressions },
        { label: 'CTR', align: 'right', get: r => (r.ctr * 100).toFixed(1) + '%' },
        { label: 'Pos.', align: 'right', get: r => r.position.toFixed(1) }
    ]));
}

async function cmdInspect(token, url) {
    if (!url) { console.error('Uso: gsc.js inspect <url>'); process.exit(1); }
    const target = url.startsWith('http') ? url : SITE_URL + (url.startsWith('/') ? url : '/' + url);
    const data = await api(token, 'POST', '/v1/urlInspection/index:inspect', {
        inspectionUrl: target,
        siteUrl: SITE,
        languageCode: 'it'
    });
    console.log(JSON.stringify(data, null, 2));
}

async function cmdSitemaps(token) {
    const data = await api(token, 'GET', `/webmasters/v3/sites/${encodeURIComponent(SITE)}/sitemaps`);
    const list = data.sitemap || [];
    if (!list.length) { console.log('(nessuna sitemap registrata)'); return; }
    for (const s of list) {
        console.log(`${s.path}`);
        console.log(`  type: ${s.type}  isPending: ${s.isPending}  isSitemapsIndex: ${s.isSitemapsIndex}`);
        console.log(`  lastSubmitted: ${s.lastSubmitted}  lastDownloaded: ${s.lastDownloaded}`);
        console.log(`  warnings: ${s.warnings || 0}  errors: ${s.errors || 0}`);
        const c = s.contents && s.contents[0];
        if (c) console.log(`  submitted: ${c.submitted}  indexed: ${c.indexed}`);
        console.log();
    }
}

async function cmdRaw(token, method, urlPath) {
    if (!urlPath) { console.error('Uso: gsc.js raw <METHOD> <path>'); process.exit(1); }
    const data = await api(token, method, urlPath);
    console.log(JSON.stringify(data, null, 2));
}

// ---------- Main ----------

(async () => {
    const cmd = process.argv[2];
    const args = process.argv.slice(3);
    if (!cmd) {
        console.error('Comandi: sites | query [days] | pages [days] | inspect <url> | sitemaps | raw <method> <path>');
        process.exit(1);
    }
    const token = await getAccessToken();

    switch (cmd) {
        case 'sites': await cmdSites(token); break;
        case 'query': await cmdQuery(token, parseInt(args[0]) || undefined); break;
        case 'pages': await cmdPages(token, parseInt(args[0]) || undefined); break;
        case 'inspect': await cmdInspect(token, args[0]); break;
        case 'sitemaps': await cmdSitemaps(token); break;
        case 'raw': await cmdRaw(token, args[0], args[1]); break;
        default: console.error(`Comando sconosciuto: ${cmd}`); process.exit(1);
    }
})().catch(e => { console.error('[gsc] Fatal:', e); process.exit(1); });
