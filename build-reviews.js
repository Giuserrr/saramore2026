#!/usr/bin/env node
/**
 * build-reviews.js — Fetcha review da Google Places API (New) e materializza
 * un blocco HTML statico nei marker BUILD:REVIEWS:START/END su:
 *   - index.html (home)
 *   - chi-sono/index.html
 *
 * Coerente con build-schema.js / build-blog.js. Idempotente sul fronte content
 * (le relative time strings cambiano ad ogni build → diff atteso).
 *
 * Env vars richieste:
 *   GOOGLE_PLACES_API_KEY  → API key Google Cloud Places API (New)
 *   GOOGLE_PLACE_ID        → Place ID di SaraMore Yoga (formato ChIJ...)
 *
 * Se mancanti: skip silenzioso, build non si rompe.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = __dirname;

/**
 * TARGETS: configurazione per file.
 *  - file: path relativo a ROOT
 *  - body: true → renderizza blocco visibile fra BUILD:REVIEWS:START/END
 *  - serviceId: string @id del Service esistente in pagina → genera JSON-LD
 *               aggiuntivo fra BUILD:REVIEWS:SCHEMA:START/END che fa merge
 *               con lo schema Service (stesso @id) per aggregateRating + review[]
 */
const TARGETS = [
    { file: 'index.html', body: true, serviceId: null },
    { file: 'chi-sono/index.html', body: true, serviceId: null },
    { file: 'lezioni-di-gruppo/index.html', body: true, serviceId: 'https://saramoreyoga.com/lezioni-di-gruppo/#service' },
    { file: 'lezioni-individuali/index.html', body: true, serviceId: 'https://saramoreyoga.com/lezioni-individuali/#service' },
    { file: 'yoga-gravidanza-genova/index.html', body: true, serviceId: 'https://saramoreyoga.com/yoga-gravidanza-genova/#service' },
];

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACE_ID = process.env.GOOGLE_PLACE_ID;
const FIELD_MASK = 'displayName,rating,userRatingCount,reviews,googleMapsUri';
const FALLBACK_MAPS_URL = 'https://maps.app.goo.gl/GA3Qut4REbwjiaEh8';
const START_MARKER = '<!-- BUILD:REVIEWS:START -->';
const END_MARKER = '<!-- BUILD:REVIEWS:END -->';
const SCHEMA_START_MARKER = '<!-- BUILD:REVIEWS:SCHEMA:START -->';
const SCHEMA_END_MARKER = '<!-- BUILD:REVIEWS:SCHEMA:END -->';

function fetchPlaceDetails(apiKey, placeId) {
    return new Promise((resolve, reject) => {
        const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=it`;
        const opts = {
            method: 'GET',
            headers: {
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': FIELD_MASK,
            }
        };
        const req = https.request(url, opts, res => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Places API ${res.statusCode}: ${data.substring(0, 400)}`));
                    return;
                }
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
            });
        });
        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(new Error('timeout 15s')); });
        req.end();
    });
}

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function starsHtml(rating) {
    const full = Math.round(Number(rating) || 0);
    let out = '';
    for (let i = 0; i < 5; i++) {
        out += i < full
            ? '<span class="gr-star gr-star-full" aria-hidden="true">★</span>'
            : '<span class="gr-star" aria-hidden="true">★</span>';
    }
    return out;
}

function truncate(text, max) {
    if (!text) return '';
    const trimmed = text.replace(/\s+/g, ' ').trim();
    if (trimmed.length <= max) return trimmed;
    return trimmed.substring(0, max).replace(/\s+\S*$/, '') + '…';
}

function renderReviewCard(r) {
    const author = r.authorAttribution || {};
    const name = author.displayName || 'Anonimo';
    const photo = author.photoUri || '';
    const profileUri = author.uri || '';
    const rating = Number(r.rating) || 5;
    const time = r.relativePublishTimeDescription || '';
    const text = (r.text && r.text.text) || (r.originalText && r.originalText.text) || '';
    const truncated = truncate(text, 280);

    const photoHtml = photo
        ? `<img src="${escapeHtml(photo)}" alt="" class="gr-review-avatar" width="40" height="40" loading="lazy" referrerpolicy="no-referrer">`
        : `<span class="gr-review-avatar-placeholder" aria-hidden="true">${escapeHtml(name.charAt(0).toUpperCase())}</span>`;

    const nameHtml = profileUri
        ? `<a href="${escapeHtml(profileUri)}" target="_blank" rel="noopener nofollow" class="gr-review-name">${escapeHtml(name)}</a>`
        : `<span class="gr-review-name">${escapeHtml(name)}</span>`;

    return `            <article class="gr-review-card">
                <div class="gr-review-header">
                    ${photoHtml}
                    <div class="gr-review-meta">
                        ${nameHtml}
                        <div class="gr-review-rating-row">
                            <span class="gr-review-stars" aria-label="${rating} su 5 stelle">${starsHtml(rating)}</span>
                            <span class="gr-review-time">${escapeHtml(time)}</span>
                        </div>
                    </div>
                </div>
                <p class="gr-review-text">${escapeHtml(truncated)}</p>
            </article>`;
}

function renderBlock(data) {
    const ratingNum = Number(data.rating || 0);
    const ratingFmt = ratingNum.toFixed(1).replace('.', ',');
    const count = Number(data.userRatingCount || 0);
    const reviews = (data.reviews || []).slice(0, 5);
    const gbpUrl = data.googleMapsUri || FALLBACK_MAPS_URL;

    const cards = reviews.map(renderReviewCard).join('\n');
    const countLabel = count > 0 ? `${count} recensioni` : 'recensioni';

    return `        <section class="google-reviews" aria-labelledby="gr-title">
            <div class="gr-header">
                <div class="gr-header-left">
                    <span class="gr-logo" aria-hidden="true"><span class="gr-logo-blue">G</span><span class="gr-logo-red">o</span><span class="gr-logo-yellow">o</span><span class="gr-logo-blue">g</span><span class="gr-logo-green">l</span><span class="gr-logo-red">e</span></span>
                    <h2 id="gr-title" class="gr-title">Recensioni su Google</h2>
                </div>
                <div class="gr-header-right">
                    <span class="gr-rating-value">${ratingFmt}</span>
                    <span class="gr-rating-stars" aria-label="${ratingFmt} su 5 stelle">${starsHtml(ratingNum)}</span>
                    <span class="gr-rating-count">· ${countLabel}</span>
                </div>
            </div>
            <div class="gr-reviews-grid">
${cards}
            </div>
            <p class="gr-footer-link">
                <a href="${escapeHtml(gbpUrl)}" target="_blank" rel="noopener" class="gr-cta">Tutte le recensioni su Google <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
            </p>
        </section>`;
}

/**
 * Sostituisce il contenuto fra startMarker/endMarker. Idempotente.
 * Ritorna { found, changed }.
 */
function replaceMarkerBlock(html, startMarker, endMarker, replacement) {
    const startIdx = html.indexOf(startMarker);
    const endIdx = html.indexOf(endMarker);
    if (startIdx < 0 || endIdx < 0) return { found: false, changed: false, html };
    // Indentazione del marker di apertura, da riapplicare al marker di chiusura
    const lineStart = html.lastIndexOf('\n', startIdx) + 1;
    const indent = html.substring(lineStart, startIdx);
    const before = html.substring(0, startIdx);
    const after = html.substring(endIdx + endMarker.length);
    const next = before + startMarker + '\n' + replacement + '\n' + indent + endMarker + after;
    return { found: true, changed: next !== html, html: next };
}

function processTarget(target, blockHtml, schemaHtml) {
    const fullPath = path.join(ROOT, target.file);
    if (!fs.existsSync(fullPath)) {
        console.warn(`[build-reviews] file non trovato: ${target.file}`);
        return false;
    }
    let html = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    if (target.body) {
        const r = replaceMarkerBlock(html, START_MARKER, END_MARKER, blockHtml);
        if (!r.found) {
            console.warn(`[build-reviews] marker BUILD:REVIEWS non trovati in ${target.file}, skip body.`);
        } else if (r.changed) {
            html = r.html;
            modified = true;
        }
    }

    if (target.serviceId && schemaHtml) {
        const schema = renderServiceSchema(target.serviceId, schemaHtml);
        const r = replaceMarkerBlock(html, SCHEMA_START_MARKER, SCHEMA_END_MARKER, schema);
        if (!r.found) {
            console.warn(`[build-reviews] marker SCHEMA non trovati in ${target.file}, skip schema.`);
        } else if (r.changed) {
            html = r.html;
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(fullPath, html, 'utf8');
        console.log(`[build-reviews] ${target.file}: aggiornato.`);
    } else {
        console.log(`[build-reviews] ${target.file}: no-op (idempotente).`);
    }
    return true;
}

/**
 * Genera JSON-LD aggiuntivo che fa merge con il Service esistente via @id.
 * NON sovrascrive lo schema Service originale (vive in un blocco separato).
 */
function renderServiceSchema(serviceId, schemaJson) {
    const lines = JSON.stringify(schemaJson, null, 2).split('\n').map(l => '    ' + l).join('\n');
    return `    <script type="application/ld+json">\n${lines}\n    </script>`;
}

function buildSchemaJson(data, serviceId) {
    const reviews = (data.reviews || []).slice(0, 5);
    const schema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": serviceId,
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": String(data.rating || 5),
            "reviewCount": String(data.userRatingCount || reviews.length),
            "bestRating": "5",
            "worstRating": "1"
        },
        "review": reviews.map(r => {
            const text = (r.text && r.text.text) || (r.originalText && r.originalText.text) || '';
            const author = (r.authorAttribution && r.authorAttribution.displayName) || 'Cliente Google';
            const isoDate = r.publishTime ? r.publishTime.split('T')[0] : undefined;
            const obj = {
                "@type": "Review",
                "author": { "@type": "Person", "name": author },
                "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": String(r.rating || 5),
                    "bestRating": "5",
                    "worstRating": "1"
                },
                "reviewBody": text.replace(/\s+/g, ' ').trim().substring(0, 500),
                "publisher": { "@type": "Organization", "name": "Google" }
            };
            if (isoDate) obj.datePublished = isoDate;
            return obj;
        })
    };
    return schema;
}

async function main() {
    if (!API_KEY || !PLACE_ID) {
        console.warn('[build-reviews] GOOGLE_PLACES_API_KEY o GOOGLE_PLACE_ID mancanti, skip (build prosegue).');
        process.exit(0);
    }

    let data;
    try {
        data = await fetchPlaceDetails(API_KEY, PLACE_ID);
    } catch (e) {
        console.error(`[build-reviews] errore fetch API: ${e.message}`);
        // Non rompere il build: skip
        process.exit(0);
    }

    if (!data || !data.reviews || data.reviews.length === 0) {
        console.warn('[build-reviews] nessuna review nella response, skip.');
        process.exit(0);
    }

    const block = renderBlock(data);
    let processed = 0;
    for (const target of TARGETS) {
        const schemaJson = target.serviceId ? buildSchemaJson(data, target.serviceId) : null;
        if (processTarget(target, block, schemaJson)) processed++;
    }
    console.log(`[build-reviews] completato: ${processed}/${TARGETS.length} target processati. Reviews: ${data.reviews.length}, rating: ${data.rating}, count: ${data.userRatingCount}.`);
}

main();
