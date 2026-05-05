#!/usr/bin/env node
/**
 * build-blog.js — Sistema blog statico.
 *
 * Legge tutti i .md in blog/posts/ (frontmatter via gray-matter, body via marked GFM)
 * e genera:
 *   - /blog/<categoria>/<slug>/index.html       (1 file per articolo)
 *   - /blog/<categoria>/index.html              (1 file per categoria con articoli)
 *   - /blog/index.html                          (hub: 5 card categoria + grid 6 ultimi)
 *   - sitemap.xml                               (aggiornata con URL articoli + categorie)
 *   - <!-- BUILD:BLOG-GRAVIDANZA:START/END -->  su /yoga-in-gravidanza/
 *   - <!-- BUILD:BLOG-ANUKALANA:START/END -->   su /anukalana-yoga/
 *
 * Decisioni tecniche (vedi CLAUDE.md Sprint 2):
 *   - marked + gray-matter (no DOMPurify, no bundler)
 *   - GFM tables/footnotes ON
 *   - TOC auto solo se l'articolo ha 4+ heading (h2|h3)
 *   - Reading time a 220 wpm (lettore italiano medio)
 *   - youtube_url opzionale → embed responsive 16:9 + JSON-LD VideoObject solo se presente
 *
 * Idempotente. Esegue al deploy Netlify (vedi netlify.toml).
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, 'blog', 'posts');
const BLOG_DIR = path.join(ROOT, 'blog');
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const PILLAR_GRAVIDANZA = path.join(ROOT, 'yoga-in-gravidanza', 'index.html');
const PILLAR_ANUKALANA = path.join(ROOT, 'anukalana-yoga', 'index.html');
const SITE = 'https://saramoreyoga.com';

const MONTHS_IT_FULL = [
    'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
    'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
];

// Metadati delle 5 categorie editoriali. label/desc usati per UI; pillar/cta per
// internal linking (sezione "articolo correlato" + CTA in fondo all'articolo).
const CATEGORIES = {
    gravidanza: {
        label: 'Gravidanza',
        slug: 'gravidanza',
        desc: 'Yoga durante i nove mesi: trimestre per trimestre, controindicazioni, benefici scientificamente documentati.',
        icon: 'fa-baby',
        pillar: '/yoga-in-gravidanza/',
        pillarLabel: 'Yoga in gravidanza — la guida completa',
        ctaUrl: '/yoga-gravidanza-genova/',
        ctaLabel: 'Yoga in gravidanza a Genova →',
        marker: 'BUILD:BLOG-GRAVIDANZA',
        markerFile: PILLAR_GRAVIDANZA
    },
    anukalana: {
        label: 'Anukalana',
        slug: 'anukalana',
        desc: 'L\'approccio Anukalana di Sara: integrare la pratica al corpo, non viceversa.',
        icon: 'fa-spa',
        pillar: '/anukalana-yoga/',
        pillarLabel: 'Anukalana yoga — cos\'è e come funziona',
        ctaUrl: '/lezioni-di-gruppo/',
        ctaLabel: 'Pratica Anukalana con me →',
        marker: 'BUILD:BLOG-ANUKALANA',
        markerFile: PILLAR_ANUKALANA
    },
    pratica: {
        label: 'Pratica',
        slug: 'pratica',
        desc: 'Asana, respirazione, meditazione: come si lavora sul tappetino.',
        icon: 'fa-leaf',
        pillar: '/anukalana-yoga/',
        pillarLabel: 'Anukalana yoga — l\'approccio',
        ctaUrl: '/lezioni-di-gruppo/',
        ctaLabel: 'Vieni a praticare →'
    },
    genova: {
        label: 'Genova',
        slug: 'genova',
        desc: 'Yoga a Genova: dove, quando, con chi. Carignano, centro storico, eventi.',
        icon: 'fa-map-marker-alt',
        pillar: '/yoga-genova-prezzi/',
        pillarLabel: 'Yoga a Genova — listino e info',
        ctaUrl: '/lezioni-di-gruppo/',
        ctaLabel: 'Vedi le lezioni di gruppo →'
    },
    salute: {
        label: 'Salute',
        slug: 'salute',
        desc: 'Yoga per la salute: dolori cronici, postura, stress, sonno.',
        icon: 'fa-heart',
        pillar: '/lezioni-individuali/',
        pillarLabel: 'Lezioni individuali — percorsi su misura',
        ctaUrl: '/lezioni-individuali/',
        ctaLabel: 'Scopri le lezioni individuali →'
    }
};

// ---------- Marked setup ----------

marked.setOptions({
    gfm: true,
    breaks: false
});

// marked v14 ha rimosso `headerIds` + `headerPrefix`. Iniettiamo manualmente
// id="sec-<slug>" sui <h2>/<h3> via post-processing dell'HTML renderizzato,
// così buildTOC() può trovarli con la stessa regex.
function slugifyHeading(text) {
    return text
        .replace(/<[^>]+>/g, '')           // strip inline HTML (es. <em>, <strong>)
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')  // rimuove diacritici (è → e)
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
function injectHeadingIds(html) {
    const seen = new Set();
    return html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, level, inner) => {
        let id = 'sec-' + slugifyHeading(inner);
        let candidate = id, n = 1;
        while (seen.has(candidate)) { n++; candidate = `${id}-${n}`; }
        seen.add(candidate);
        return `<h${level} id="${candidate}">${inner}</h${level}>`;
    });
}

// ---------- Helper functions ----------

function extractYoutubeId(url) {
    if (!url || typeof url !== 'string') return null;
    const patterns = [
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

function readingTimeMinutes(text) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
}

function slugFromFilename(filename) {
    // 2026-05-15-titolo-articolo.md → titolo-articolo
    return filename.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function formatDateIt(dateStr) {
    // dateStr è già normalizzato a "YYYY-MM-DD" da normalizeDate(). Parsing manuale:
    // new Date("YYYY-MM-DD") interpreta come UTC e se locale è EU, getDate() può scivolare al giorno prima.
    const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return dateStr;
    const [, y, mo, d] = m;
    return `${parseInt(d, 10)} ${MONTHS_IT_FULL[parseInt(mo, 10) - 1]} ${y}`;
}

// gray-matter + js-yaml convertono "date: 2026-05-04" in un Date object.
// String(d) → "Wed May 04 2026 ..." → slice(0,10) = "Wed May 04" (sbagliato).
// Forziamo sempre il formato ISO YYYY-MM-DD.
function normalizeDate(d) {
    if (d instanceof Date && !isNaN(d.getTime())) {
        const y = d.getUTCFullYear();
        const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${mo}-${day}`;
    }
    return String(d || '').slice(0, 10);
}

function escapeHtml(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
    return escapeHtml(s);
}

function jsonLd(obj) {
    return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`;
}

// Estrae h2/h3 dall'HTML renderizzato per costruire un mini-TOC.
// Ritorna null se ci sono < 4 heading (TOC non utile per articoli brevi).
function buildTOC(html) {
    const headings = [];
    const re = /<h([23])\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
        const level = parseInt(m[1], 10);
        const id = m[2];
        // Il testo dentro <h2>/<h3> è già HTML-escapato da marked. Strip tag inline,
        // poi NON ri-escapiamo (altrimenti &quot; → &amp;quot;, visibile come testo).
        const text = m[3].replace(/<[^>]+>/g, '').trim();
        headings.push({ level, id, text });
    }
    if (headings.length < 4) return null;
    const items = headings.map(h => {
        const indent = h.level === 3 ? ' style="margin-left:18px;"' : '';
        return `        <li${indent}><a href="#${h.id}">${h.text}</a></li>`;
    }).join('\n');
    return `<nav class="post-toc" aria-label="Indice dell'articolo">\n    <p class="toc-title">In questa pagina</p>\n    <ul>\n${items}\n    </ul>\n</nav>`;
}

// ---------- Common HTML chunks (header, menu, footer, scripts) ----------

const COMMON_HEAD_AFTER_META = `<meta name="theme-color" content="#FAF7F2">
    <link rel="icon" href="/favicon.ico" type="image/x-icon">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <meta name="google-site-verification" content="M94JaFm0WuOHCsYHza67R7moak7UWUXmkqrs6HVyhec">

    <link rel="preload" as="font" type="font/woff2" href="/assets/fonts/inter-300-600.woff2" crossorigin>
    <link rel="preload" as="font" type="font/woff2" href="/assets/fonts/cormorant-400-600.woff2" crossorigin>
    <link rel="stylesheet" href="/assets/css/main.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"></noscript>`;

const HEADER_HTML = `    <!-- PWA BANNER -->
    <div id="install-banner">
        <div class="install-content">
            <div id="install-instructions">Installa <b>SaraMore Yoga</b></div>
        </div>
        <button onclick="closeBanner()" class="install-close">&times;</button>
    </div>

    <!-- HEADER -->
    <header>
        <a href="/" class="logo"><img src="/img/5-240.webp" alt="SaraMore Yoga" width="240" height="240" fetchpriority="high"></a>
        <div class="nav-toggle" onclick="toggleMenu()"><i class="fas fa-bars"></i></div>
    </header>

    <!-- MENU -->
    <div id="menu-overlay">
        <a href="/" class="menu-link">Home</a>
        <a href="/lezioni-di-gruppo/" class="menu-link">Lezioni di gruppo</a>
        <a href="/lezioni-individuali/" class="menu-link">Lezioni individuali</a>
        <a href="/yoga-gravidanza-genova/" class="menu-link">Yoga in gravidanza</a>
        <a href="/chi-sono/" class="menu-link">Chi sono</a>
        <a href="/eventi/" class="menu-link">Eventi</a>
        <a href="/blog/" class="menu-link">Blog</a>
        <a href="/contatti/" class="menu-link">Contatti</a>
        <button type="button" onclick="toggleMenu()" class="menu-link menu-close">Chiudi &times;</button>
    </div>`;

const FOOTER_HTML = `    <!-- FOOTER -->
    <footer>
        <p><strong>SaraMore Yoga</strong> di Sara Maggiori</p>
        <p style="font-size: 0.8rem; opacity: 0.6;">P.IVA 02988280992 — Sede legale: Via Bixio 2, 16128 Genova</p>
        <p style="margin-top:12px; font-size:0.85rem;">
            <a href="/lezioni-di-gruppo/">Lezioni di gruppo</a> ·
            <a href="/lezioni-individuali/">Individuali</a> ·
            <a href="/yoga-gravidanza-genova/">Gravidanza</a> ·
            <a href="/chi-sono/">Chi sono</a> ·
            <a href="/eventi/">Eventi</a> ·
            <a href="/blog/">Blog</a> ·
            <a href="/contatti/">Contatti</a>
        </p>
        <p class="footer-approfondimenti">
            <span class="label">Approfondimenti</span>
            <a href="/yoga-in-gravidanza/">Yoga in gravidanza</a> &middot;
            <a href="/anukalana-yoga/">Anukalana yoga</a> &middot;
            <a href="/yoga-genova-prezzi/">Prezzi yoga Genova</a> &middot;
            <a href="/yoga-genova-carignano/">Yoga Carignano</a>
        </p>
        <p class="footer-approfondimenti" style="margin-top:8px;">
            <span class="label">Sui social</span>
            <a href="https://www.instagram.com/saramoreyoga/" target="_blank" rel="noopener">Instagram</a> &middot;
            <a href="https://www.facebook.com/saramoreyoga/" target="_blank" rel="noopener">Facebook</a> &middot;
            <a href="https://maps.app.goo.gl/GA3Qut4REbwjiaEh8" target="_blank" rel="noopener">Profilo Google</a>
        </p>
        <p style="margin-top:10px;"><a href="mailto:sara@saramoreyoga.com">sara@saramoreyoga.com</a></p>
        <div class="legal-links">
            <a href="/termini/">Termini e Condizioni</a>
            <span style="color:var(--sage)">&middot;</span>
            <a href="/privacy-policy/">Privacy Policy</a>
        </div>
        <p style="margin-top:25px; font-size: 0.7rem; opacity: 0.4;">&copy; 2026 SaraMore Yoga di Sara Maggiori</p>
    </footer>

    <!-- WHATSAPP -->
    <div class="whatsapp-container">
        <div class="whatsapp-label">Scrivimi</div>
        <a href="https://wa.me/393737735552" class="whatsapp-btn" target="_blank" aria-label="Contattami su WhatsApp">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" class="whatsapp-img" width="28" height="28">
        </a>
    </div>

    <script src="/assets/js/main.js" defer></script>

</body>
</html>`;

// ---------- Render single article ----------

function renderArticle(post) {
    const cat = CATEGORIES[post.category];
    const url = `${SITE}/blog/${cat.slug}/${post.slug}/`;
    const dateIt = formatDateIt(post.date);
    const cover = post.cover ? (post.cover.startsWith('http') ? post.cover : SITE + post.cover) : `${SITE}/img/2-1024.webp`;
    const ogImage = post.youtubeId ? `https://i.ytimg.com/vi/${post.youtubeId}/maxresdefault.jpg` : cover;
    const readMin = readingTimeMinutes(post.bodyText);
    const summary = (post.summary || '').trim();

    // JSON-LD
    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE}/` },
            { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE}/blog/` },
            { "@type": "ListItem", "position": 3, "name": cat.label, "item": `${SITE}/blog/${cat.slug}/` },
            { "@type": "ListItem", "position": 4, "name": post.title, "item": url }
        ]
    };
    const blogPosting = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        "headline": post.title,
        "description": summary,
        "datePublished": post.date,
        "dateModified": post.date,
        "author": { "@id": `${SITE}/#sara` },
        "publisher": { "@id": `${SITE}/#business` },
        "image": ogImage,
        "articleSection": cat.label,
        "inLanguage": "it",
        "mainEntityOfPage": url,
        "wordCount": post.wordCount,
        "timeRequired": `PT${readMin}M`
    };
    if (post.youtubeId) {
        blogPosting.video = { "@id": `${url}#video` };
    }

    const ldBlocks = [jsonLd(blogPosting), jsonLd(breadcrumb)];
    if (post.youtubeId) {
        const videoObj = {
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "@id": `${url}#video`,
            "name": post.title,
            "description": summary,
            "thumbnailUrl": `https://i.ytimg.com/vi/${post.youtubeId}/maxresdefault.jpg`,
            "uploadDate": post.date,
            "embedUrl": `https://www.youtube.com/embed/${post.youtubeId}`,
            "contentUrl": `https://www.youtube.com/watch?v=${post.youtubeId}`,
            "publisher": { "@id": `${SITE}/#business` }
        };
        ldBlocks.push(jsonLd(videoObj));
    }

    // YouTube embed (solo se presente)
    const youtubeBlock = post.youtubeId ? `
        <div class="post-video-wrap">
            <p class="post-video-label"><i class="fab fa-youtube"></i> Guarda il video</p>
            <div class="post-video">
                <iframe src="https://www.youtube.com/embed/${post.youtubeId}"
                        title="${escapeAttr(post.title)}"
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                        referrerpolicy="strict-origin-when-cross-origin"></iframe>
            </div>
        </div>` : '';

    // Cover (solo se presente, e non duplicare se c'è già il video)
    // Width/height intrinseci per CLS=0; mappa basata sui webp realmente usati come cover.
    const COVER_DIMS = {
        '/img/1-1080.webp': [1080, 1908],
        '/img/2-1024.webp': [1024, 1366],
        '/img/3-1080.webp': [1080, 1684],
        '/img/4-1440.webp': [1440, 810],
    };
    const dims = COVER_DIMS[post.cover] || [1200, 800];
    // Body img: usa path relativa (post.cover) così funziona in localhost; URL assoluta (cover) resta solo per og:image + JSON-LD.
    const coverBlock = (post.cover && !post.youtubeId) ? `
        <div class="post-cover">
            <img src="${escapeAttr(post.cover)}" alt="${escapeAttr(post.title)}" width="${dims[0]}" height="${dims[1]}" loading="lazy" decoding="async">
        </div>` : '';

    // TOC (solo 4+ heading)
    const tocBlock = post.toc ? `        ${post.toc}\n` : '';

    // Tags
    const tagsBlock = (post.tags && post.tags.length) ? `
        <div class="post-tags">
            ${post.tags.map(t => `<span class="post-tag">${escapeHtml(t)}</span>`).join(' ')}
        </div>` : '';

    return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>${escapeHtml(post.title)} | Blog SaraMore Yoga</title>
    <meta name="description" content="${escapeAttr(summary)}">
    <link rel="canonical" href="${url}">

    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeAttr(post.title)}">
    <meta property="og:description" content="${escapeAttr(summary)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${escapeAttr(ogImage)}">
    <meta property="og:locale" content="it_IT">
    <meta property="og:site_name" content="SaraMore Yoga">
    <meta property="article:published_time" content="${post.date}">
    <meta property="article:author" content="Sara Maggiori">
    <meta property="article:section" content="${cat.label}">
    <meta name="twitter:card" content="summary_large_image">

    ${COMMON_HEAD_AFTER_META}

    ${ldBlocks.join('\n    ')}
</head>
<body>

${HEADER_HTML}

    <div class="container">

    <!-- BREADCRUMB -->
    <nav class="breadcrumb" aria-label="breadcrumb">
        <a href="/">Home</a> <span>›</span>
        <a href="/blog/">Blog</a> <span>›</span>
        <a href="/blog/${cat.slug}/">${cat.label}</a> <span>›</span>
        <span aria-current="page">${escapeHtml(post.title)}</span>
    </nav>

    <article class="post-container">

        <header class="post-header">
            <p class="post-meta">
                <a href="/blog/${cat.slug}/" class="post-category">${cat.label}</a>
                <span>·</span>
                <time datetime="${post.date}">${dateIt}</time>
                <span>·</span>
                <span>${readMin} min di lettura</span>
            </p>
            <h1>${escapeHtml(post.title)}</h1>
            ${summary ? `<p class="post-summary">${escapeHtml(summary)}</p>` : ''}
        </header>
${coverBlock}${youtubeBlock}

        <div class="post-body long-form">
${tocBlock}${post.bodyHtml}
        </div>
${tagsBlock}

        <!-- ARTICOLO CORRELATO (link a pillar di riferimento) -->
        <aside class="post-related">
            <p class="post-related-label">Approfondisci</p>
            <a href="${cat.pillar}" class="post-related-link">
                <i class="fas fa-arrow-right"></i> ${cat.pillarLabel}
            </a>
        </aside>

        <!-- CTA WHATSAPP -->
        <section class="final-cta" style="margin-top:50px;">
            <h2>Vuoi praticare con me?</h2>
            <p>Scrivimi su WhatsApp per qualunque domanda o per prenotare la tua prima lezione.</p>
            <div class="cta-buttons">
                <a href="${cat.ctaUrl}" class="btn-cta">${cat.ctaLabel}</a>
                <a href="https://wa.me/393737735552?text=Ciao%20Sara%2C%20ho%20letto%20l'articolo%20${encodeURIComponent(post.title)}" class="btn-cta outline" target="_blank" rel="noopener"><i class="fab fa-whatsapp" style="margin-right:8px;"></i>Scrivimi</a>
            </div>
        </section>

    </article>

    </div>

${FOOTER_HTML}`;
}

// ---------- Render category page ----------

function renderCategoryPage(catKey, posts) {
    const cat = CATEGORIES[catKey];
    const url = `${SITE}/blog/${cat.slug}/`;
    const cards = posts.map(p => renderCard(p)).join('\n');

    const ld = [
        jsonLd({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": `${url}#page`,
            "name": `Blog — ${cat.label}`,
            "description": cat.desc,
            "url": url,
            "inLanguage": "it",
            "isPartOf": { "@id": `${SITE}/blog/#blog` },
            "publisher": { "@id": `${SITE}/#business` }
        }),
        jsonLd({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE}/` },
                { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE}/blog/` },
                { "@type": "ListItem", "position": 3, "name": cat.label, "item": url }
            ]
        })
    ];

    return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Blog ${cat.label} — SaraMore Yoga</title>
    <meta name="description" content="${escapeAttr(cat.desc)}">
    <link rel="canonical" href="${url}">

    <meta property="og:type" content="website">
    <meta property="og:title" content="Blog ${cat.label} — SaraMore Yoga">
    <meta property="og:description" content="${escapeAttr(cat.desc)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${SITE}/img/2-1024.webp">
    <meta property="og:locale" content="it_IT">
    <meta property="og:site_name" content="SaraMore Yoga">
    <meta name="twitter:card" content="summary_large_image">

    ${COMMON_HEAD_AFTER_META}

    ${ld.join('\n    ')}
</head>
<body>

${HEADER_HTML}

    <div class="container">

        <nav class="breadcrumb" aria-label="breadcrumb" style="padding: 0;">
            <a href="/">Home</a> <span>›</span>
            <a href="/blog/">Blog</a> <span>›</span>
            <span aria-current="page">${cat.label}</span>
        </nav>

        <div class="hero" style="padding: 30px 0 20px;">
            <div class="hero-label"><i class="fas ${cat.icon}"></i> ${cat.label}</div>
            <h1 style="font-size:2.5rem;">Blog &mdash; ${cat.label}</h1>
            <p>${escapeHtml(cat.desc)}</p>
            <p style="margin-top:18px; font-size:0.95rem;"><a href="${cat.pillar}" style="color:var(--terracotta); font-weight:600;">${cat.pillarLabel} →</a></p>
        </div>

        <div class="blog-grid">
${cards}
        </div>

    </div>

${FOOTER_HTML}`;
}

// ---------- Render single card (for grids) ----------

function renderCard(post) {
    const cat = CATEGORIES[post.category];
    const url = `/blog/${cat.slug}/${post.slug}/`;
    const dateIt = formatDateIt(post.date);
    const summary = (post.summary || '').trim();
    const cover = post.cover || (post.youtubeId ? `https://i.ytimg.com/vi/${post.youtubeId}/hqdefault.jpg` : null);
    const imgBlock = cover
        ? `<img class="blog-card-img" src="${escapeAttr(cover)}" alt="${escapeAttr(post.title)}" width="400" height="200" loading="lazy">`
        : `<div class="blog-card-img blog-card-img-placeholder"><i class="fas ${cat.icon}"></i></div>`;
    return `            <a href="${url}" class="blog-card">
                ${imgBlock}
                <div class="blog-card-body">
                    <div class="blog-date"><span class="blog-card-cat">${cat.label}</span> · ${dateIt}${post.youtubeId ? ' · <i class="fab fa-youtube"></i>' : ''}</div>
                    <h3>${escapeHtml(post.title)}</h3>
                    <p>${escapeHtml(summary)}</p>
                    <span class="blog-readmore">Leggi &rarr;</span>
                </div>
            </a>`;
}

// ---------- Render hub /blog/ ----------

function renderHub(allPosts) {
    const latest = allPosts.slice(0, 6);
    const hasPosts = allPosts.length > 0;

    const catCards = Object.values(CATEGORIES).map(cat => {
        const count = allPosts.filter(p => p.category === cat.slug).length;
        const countLabel = count === 0 ? 'Nessun articolo ancora' : (count === 1 ? '1 articolo' : `${count} articoli`);
        // Card senza articoli: <div> non cliccabile (la pagina categoria non esiste, eviterebbe 404).
        if (count === 0) {
            return `            <div class="blog-cat-card blog-cat-card-empty" aria-disabled="true">
                <i class="fas ${cat.icon}"></i>
                <h3>${cat.label}</h3>
                <p>${escapeHtml(cat.desc)}</p>
                <span class="blog-cat-count">${countLabel}</span>
            </div>`;
        }
        return `            <a href="/blog/${cat.slug}/" class="blog-cat-card">
                <i class="fas ${cat.icon}"></i>
                <h3>${cat.label}</h3>
                <p>${escapeHtml(cat.desc)}</p>
                <span class="blog-cat-count">${countLabel}</span>
            </a>`;
    }).join('\n');

    const latestBlock = hasPosts
        ? `        <p class="section-title" style="margin-top:50px;">Ultimi articoli</p>
        <div class="blog-grid">
${latest.map(renderCard).join('\n')}
        </div>`
        : `        <div class="blog-empty">
            <i class="fas fa-feather"></i>
            <p style="font-size:1.1rem; font-family:'Cormorant Garamond',serif; font-style:italic; color:var(--dark); margin-bottom:10px;">I primi articoli sono in scrittura.</p>
            <p style="margin-bottom:5px;">Nel frattempo seguimi su <a href="https://www.instagram.com/saramoreyoga/" target="_blank" rel="noopener" style="color:var(--sage); font-weight:500;">Instagram</a> per ispirazione quotidiana,</p>
            <p>oppure dai un'occhiata alle <a href="/lezioni-di-gruppo/" style="color:var(--sage); font-weight:500;">classi settimanali</a>.</p>
        </div>`;

    return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Blog — Risorse e articoli sullo yoga | SaraMore Yoga</title>
    <meta name="description" content="Approfondimenti, tecniche e ispirazione dalla pratica yoga di Sara Maggiori. 5 cluster: gravidanza, Anukalana, pratica, Genova, salute.">
    <link rel="canonical" href="${SITE}/blog/">

    <meta property="og:type" content="website">
    <meta property="og:title" content="Blog — Risorse e articoli sullo yoga">
    <meta property="og:description" content="Approfondimenti, tecniche e ispirazione dalla pratica yoga di Sara Maggiori.">
    <meta property="og:url" content="${SITE}/blog/">
    <meta property="og:image" content="${SITE}/img/2-1024.webp">
    <meta property="og:locale" content="it_IT">
    <meta property="og:site_name" content="SaraMore Yoga">
    <meta name="twitter:card" content="summary_large_image">

    ${COMMON_HEAD_AFTER_META}

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      "@id": "${SITE}/blog/#blog",
      "url": "${SITE}/blog/",
      "name": "Blog SaraMore Yoga",
      "description": "Approfondimenti, tecniche e ispirazione dalla pratica yoga di Sara Maggiori.",
      "inLanguage": "it",
      "publisher": {"@id": "${SITE}/#business"},
      "author": {"@id": "${SITE}/#sara"}
    }
    </script>
</head>
<body>

${HEADER_HTML}

    <div class="container">

        <div class="hero" style="padding: 30px 0 20px;">
            <div class="hero-label">Risorse &middot; Articoli &middot; Ispirazione</div>
            <h1 style="font-size:2.5rem;">Blog &amp; Risorse</h1>
            <p>Articoli, riflessioni e consigli pratici dalla mia esperienza di insegnante. Aggiorno questo spazio con calma — la stessa con cui pratico.</p>
        </div>

        <p class="section-title">Esplora per tema</p>
        <div class="blog-cat-grid">
${catCards}
        </div>

${latestBlock}

    </div>

${FOOTER_HTML}`;
}

// ---------- Update sitemap ----------

function updateSitemap(allPosts) {
    if (!fs.existsSync(SITEMAP)) {
        console.warn('[build-blog] sitemap.xml non trovato, skip aggiornamento.');
        return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const xml = fs.readFileSync(SITEMAP, 'utf8');

    // Rimuovi blocchi precedenti generati dallo script (delimitati da marker)
    const startMark = '<!-- BUILD:BLOG-URLS:START -->';
    const endMark = '<!-- BUILD:BLOG-URLS:END -->';

    // Categorie con almeno 1 articolo + URL articoli
    const catsWithPosts = Object.values(CATEGORIES).filter(cat =>
        allPosts.some(p => p.category === cat.slug)
    );
    const catUrls = catsWithPosts.map(cat =>
        `  <url><loc>${SITE}/blog/${cat.slug}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`
    );
    const postUrls = allPosts.map(p => {
        const cat = CATEGORIES[p.category];
        return `  <url><loc>${SITE}/blog/${cat.slug}/${p.slug}/</loc><lastmod>${p.date}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`;
    });
    const block = catUrls.concat(postUrls).join('\n');
    const generated = block ? `${startMark}\n${block}\n  ${endMark}` : `${startMark}\n  ${endMark}`;

    let next;
    if (xml.includes(startMark) && xml.includes(endMark)) {
        const startIdx = xml.indexOf(startMark);
        const endIdx = xml.indexOf(endMark) + endMark.length;
        next = xml.substring(0, startIdx) + generated + xml.substring(endIdx);
    } else {
        // Inietta prima del </urlset> (nessuno spazio extra, mantiene formato compatto esistente)
        next = xml.replace('</urlset>', `  ${generated}\n</urlset>`);
    }

    if (next !== xml) {
        fs.writeFileSync(SITEMAP, next, 'utf8');
        console.log(`[build-blog] sitemap.xml aggiornata: +${catUrls.length} categorie + ${postUrls.length} articoli.`);
    }
}

// ---------- Update pillar markers ----------

function updatePillarMarker(catKey, posts) {
    const cat = CATEGORIES[catKey];
    if (!cat.marker || !cat.markerFile) return;
    if (!fs.existsSync(cat.markerFile)) {
        console.warn(`[build-blog] Pillar file ${cat.markerFile} non trovato, skip marker ${cat.marker}.`);
        return;
    }
    const startMark = `<!-- ${cat.marker}:START -->`;
    const endMark = `<!-- ${cat.marker}:END -->`;
    const html = fs.readFileSync(cat.markerFile, 'utf8');
    const startIdx = html.indexOf(startMark);
    const endIdx = html.indexOf(endMark);
    if (startIdx < 0 || endIdx < 0) {
        console.warn(`[build-blog] Marker ${cat.marker} non trovato su ${cat.markerFile}, skip.`);
        return;
    }

    // Sostituisce SOLO il contenuto fra start/end (i marker stessi restano).
    // Il wrapper <div> esterno della sezione resta intatto: niente chiusure
    // di tag artificiose. Il blog-grid eredita max-width 720px del wrapper —
    // accettabile, le card si stylano da sole.
    let inner;
    if (posts.length === 0) {
        inner = `\n            <p>I primi articoli sul tema ${cat.label.toLowerCase()} saranno pubblicati a breve.</p>\n            `;
    } else {
        const cards = posts.slice(0, 6).map(renderCard).join('\n');
        inner = `\n            <div class="blog-grid" style="text-align:left; margin-top:25px;">\n${cards}\n            </div>\n            `;
    }

    const before = html.substring(0, startIdx + startMark.length);
    const after = html.substring(endIdx);
    const next = before + inner + after;
    if (next !== html) {
        fs.writeFileSync(cat.markerFile, next, 'utf8');
        console.log(`[build-blog] Marker ${cat.marker} aggiornato (${posts.length} articoli).`);
    }
}

// ---------- Main ----------

function main() {
    if (!fs.existsSync(POSTS_DIR)) {
        console.warn(`[build-blog] ${POSTS_DIR} non esiste, creo cartella vuota.`);
        fs.mkdirSync(POSTS_DIR, { recursive: true });
    }

    // Leggi tutti i .md
    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md') && f !== '.gitkeep');
    const posts = [];
    const errors = [];

    for (const f of files) {
        try {
            const fp = path.join(POSTS_DIR, f);
            const raw = fs.readFileSync(fp, 'utf8');
            const parsed = matter(raw);
            const fm = parsed.data || {};
            if (fm.published !== true) continue;
            if (!fm.category || !CATEGORIES[fm.category]) {
                errors.push(`${f}: categoria mancante o non valida (deve essere uno tra: ${Object.keys(CATEGORIES).join(', ')})`);
                continue;
            }
            if (!fm.title || !fm.date) {
                errors.push(`${f}: title o date mancanti nel frontmatter`);
                continue;
            }
            const bodyText = parsed.content;
            const bodyHtml = injectHeadingIds(marked.parse(bodyText));
            const wordCount = bodyText.trim().split(/\s+/).filter(Boolean).length;
            const youtubeId = extractYoutubeId(fm.youtube_url);
            const toc = buildTOC(bodyHtml);
            posts.push({
                file: f,
                slug: slugFromFilename(f),
                title: String(fm.title),
                date: normalizeDate(fm.date),
                category: fm.category,
                summary: fm.summary || '',
                cover: fm.cover || null,
                tags: Array.isArray(fm.tags) ? fm.tags : [],
                youtubeId,
                bodyText,
                bodyHtml,
                wordCount,
                toc
            });
        } catch (e) {
            errors.push(`${f}: ${e.message}`);
        }
    }

    if (errors.length) {
        console.error('[build-blog] Errori parsing:');
        errors.forEach(e => console.error('  -', e));
    }

    // Ordina per data desc
    posts.sort((a, b) => b.date.localeCompare(a.date));

    // Genera articoli
    let writtenArticles = 0;
    for (const post of posts) {
        const cat = CATEGORIES[post.category];
        const dir = path.join(BLOG_DIR, cat.slug, post.slug);
        fs.mkdirSync(dir, { recursive: true });
        const html = renderArticle(post);
        const out = path.join(dir, 'index.html');
        const prev = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null;
        if (prev !== html) {
            fs.writeFileSync(out, html, 'utf8');
            writtenArticles++;
        }
    }

    // Genera pagine categoria (solo per categorie con almeno 1 articolo)
    let writtenCategories = 0;
    for (const catKey of Object.keys(CATEGORIES)) {
        const catPosts = posts.filter(p => p.category === catKey);
        if (catPosts.length === 0) continue;
        const dir = path.join(BLOG_DIR, catKey);
        fs.mkdirSync(dir, { recursive: true });
        const html = renderCategoryPage(catKey, catPosts);
        const out = path.join(dir, 'index.html');
        const prev = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null;
        if (prev !== html) {
            fs.writeFileSync(out, html, 'utf8');
            writtenCategories++;
        }
    }

    // Genera hub
    const hubHtml = renderHub(posts);
    const hubFile = path.join(BLOG_DIR, 'index.html');
    const prevHub = fs.existsSync(hubFile) ? fs.readFileSync(hubFile, 'utf8') : null;
    if (prevHub !== hubHtml) {
        fs.writeFileSync(hubFile, hubHtml, 'utf8');
        console.log('[build-blog] /blog/index.html (hub) aggiornato.');
    }

    // Aggiorna marker pillar
    updatePillarMarker('gravidanza', posts.filter(p => p.category === 'gravidanza'));
    updatePillarMarker('anukalana', posts.filter(p => p.category === 'anukalana'));

    // Aggiorna sitemap
    updateSitemap(posts);

    console.log(`[build-blog] Done. ${posts.length} articoli pubblicati, ${writtenArticles} HTML scritti, ${writtenCategories} pagine categoria.`);
    if (errors.length) process.exit(1);
}

main();
