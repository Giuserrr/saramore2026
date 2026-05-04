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
 * FILES: lista di file in cui materializzare il blocco recensioni visibile
 * fra i marker BUILD:REVIEWS:START/END. Il blocco è solo HTML (zero schema),
 * pure trust signal pre-conversione.
 *
 * NOTA: Service.aggregateRating + review[] schema (phase 2 originale) è stato
 * rimosso il 2026-05-05 perché Service non è parent valido per Review Snippet
 * rich result Google → "Tipo di oggetto non valido" su Rich Results Test.
 * Per local services come yoga le stelline SERP arrivano via Knowledge Panel
 * + Local Pack (collegati a GBP), non via schema on-site.
 */
const FILES = [
    'index.html',
    'chi-sono/index.html',
    'lezioni-di-gruppo/index.html',
    'lezioni-individuali/index.html',
    'yoga-gravidanza-genova/index.html',
];

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACE_ID = process.env.GOOGLE_PLACE_ID;
const FIELD_MASK = 'displayName,rating,userRatingCount,reviews,googleMapsUri';
const FALLBACK_MAPS_URL = 'https://maps.app.goo.gl/GA3Qut4REbwjiaEh8';
const START_MARKER = '<!-- BUILD:REVIEWS:START -->';
const END_MARKER = '<!-- BUILD:REVIEWS:END -->';

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

function updateMarkers(htmlPath, replacement) {
    if (!fs.existsSync(htmlPath)) {
        console.warn(`[build-reviews] file non trovato: ${htmlPath}`);
        return false;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    const startIdx = html.indexOf(START_MARKER);
    const endIdx = html.indexOf(END_MARKER);
    if (startIdx < 0 || endIdx < 0) {
        console.warn(`[build-reviews] marker non trovati in ${path.relative(ROOT, htmlPath)}, skip.`);
        return false;
    }
    const lineStart = html.lastIndexOf('\n', startIdx) + 1;
    const indent = html.substring(lineStart, startIdx);
    const before = html.substring(0, startIdx);
    const after = html.substring(endIdx + END_MARKER.length);
    const next = before + START_MARKER + '\n' + replacement + '\n' + indent + END_MARKER + after;
    if (next === html) {
        console.log(`[build-reviews] ${path.relative(ROOT, htmlPath)}: no-op (idempotente).`);
        return true;
    }
    fs.writeFileSync(htmlPath, next, 'utf8');
    console.log(`[build-reviews] ${path.relative(ROOT, htmlPath)}: aggiornato.`);
    return true;
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
    let updated = 0;
    for (const f of FILES) {
        if (updateMarkers(path.join(ROOT, f), block)) updated++;
    }
    console.log(`[build-reviews] completato: ${updated}/${FILES.length} file processati. Reviews: ${data.reviews.length}, rating: ${data.rating}, count: ${data.userRatingCount}.`);
}

main();
