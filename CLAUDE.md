# saramoreyoga.com — Documentazione del progetto

> Sito di **Sara Maggiori** (brand: **SaraMore Yoga**), insegnante di yoga a Genova. In produzione su Netlify, dominio canonico **`https://saramoreyoga.com`** (no www). Sito multi-pagina HTML statico, ottimizzato SEO + crawlable da AI, gestibile da Sara via Decap CMS.

---

## 📌 Stato attuale (8 maggio 2026)

**Live**:
- **14 pagine HTML indicizzabili** (sitemap.xml: 22 URL totali contando hub blog + categorie + articoli + legali)
- **4 articoli blog pubblicati** (1 in scheletro `published: false`)
- **Build chain Netlify**: `npm install && node build-schema.js && node build-blog.js && node build-reviews.js`
- **25 recensioni Google 5/5** mostrate live su 5 pagine (home, chi-sono, 3 service)
- **Performance**: PSI mobile ~91-92, desktop ~98, a11y ~95+
- **Compliance**: WCAG 2.1 AA + EAA UE (giugno 2025)

**Tre fasi storiche**:
1. **2 maggio 2026** — Trasformazione SPA → multi-pagina + perf intensiva (commit `4975a0e`..`960d38f`)
2. **4 maggio 2026** — Refactor alberatura Sprint 1 + blog system Sprint 2 + 4 articoli + a11y contrasto + Google Reviews integration (commit `96d530e`..`e30515d`)
3. **5-8 maggio 2026** — Maps Embed + foto repertorio + PWA cleanup + a11y Round 1+2 (commit `698932c`..`680f9a2`)

---

## 🔍 Quick reference

| Cerchi | Sezione |
|---|---|
| Dati business da non inventare | [Identità del business](#-identità-del-business) |
| Stack + ciò che NON cambia | [Stack tecnico](#-stack-tecnico) + [Vincoli rigidi](#-vincoli-rigidi-non-toccare) |
| Come si scrive una nuova pagina | [Convenzioni di sviluppo → `<head>` boilerplate](#head-boilerplate) |
| Come funziona il blog | [Build scripts → build-blog.js](#build-blogjs) |
| Pattern a11y | [Convenzioni → A11y patterns](#a11y-patterns-skip-link-main-menu-trap-faq) |
| Pattern CSS riusabili pillar/blog | [Convenzioni → CSS patterns](#css-patterns-pillar-pages--blog) |
| Schema JSON-LD valido | [Convenzioni → JSON-LD schema.org](#json-ld-schemaorg) |
| Numeri performance + tentativi falliti | [Performance snapshot](#-performance-snapshot) |
| Storia commit | [Storia (commit milestone)](#-storia-commit-milestone) |
| Comandi bash utili | [Comandi utili](#-comandi-utili) |
| Glossario | [Glossario](#-glossario) |

---

## 🪪 Identità del business

```
Brand:                SaraMore Yoga
Titolare:             Sara Maggiori
P.IVA:                02988280992
Sede legale:          Via Bixio 2, 16128 Genova GE, IT
Sede operativa #1:    Studio Equilibra, Piazza Galeazzo Alessi 2/3, 16128 Genova GE (Carignano)
Sede operativa #2:    Dojo Jakukai, Via Fieschi 20, Genova
Email:                sara@saramoreyoga.com
Telefono/WhatsApp:    +39 373 773 5552
Anno inizio:          2019
Lingua insegnamento:  solo italiano

GPS Carignano:        44.402534, 8.938980 (verificate scheda GBP, sostituiscono Nominatim 44.4026216/8.9385083 off ~40m)
GPS Jakukai:          44.4058513, 8.9372219 (verificate Nominatim 2026-05-04)

GBP URL:              https://maps.app.goo.gl/GA3Qut4REbwjiaEh8
GBP Place ID:         ChIJdf86kA9D0xIRU9TR4qz8gQY
GBP Categoria:        Insegnante di yoga — VERIFICATO (25 recensioni 5/5 al 8 mag 2026)

Wikidata #business:   https://www.wikidata.org/wiki/Q139618286
Wikidata #sara:       https://www.wikidata.org/wiki/Q139618479
Schema.org type:      ["LocalBusiness", "HealthAndBeautyBusiness"] (founder = Person Sara Maggiori)
GSC verification:     M94JaFm0WuOHCsYHza67R7moak7UWUXmkqrs6HVyhec

Instagram:            https://www.instagram.com/saramoreyoga/
Facebook:             https://www.facebook.com/saramoreyoga/
```

**Formazione di Sara**: scuola Samadhi S.s.d.r.l. (formazioneyoga.it, sede Firenze) — approccio Anukalana Yoga (Jacopo Ceccarelli) — specializzazioni Yoga in Gravidanza + Anukalana — riconoscimenti scuola CONI + Yoga Alliance + Norma UNI Insegnante di Yoga.

### Policy prezzi (dal 4 maggio 2026)

I prezzi sono pubblici **solo** sulla pagina-listino `/yoga-genova-prezzi/`. Le pagine commerciali (`/lezioni-di-gruppo/`, `/lezioni-individuali/`, `/yoga-gravidanza-genova/`) hanno CTA WhatsApp + link "Tutti i prezzi 2026 →" verso il listino. Home, `/chi-sono/` e altre non parlano di prezzi.

**Schema JSON-LD**: `Offer` con `price` numerici **solo** sul `Service` di `/yoga-genova-prezzi/` (18 offerte → eligible per rich snippet "prezzo da X€"). Le altre pagine: `priceRange: "€€"` astratto sul `LocalBusiness`, niente Offer.

**Listino 2026**: tessera annuale 20€, lezione singola gruppo 20€, mensile 1× 55€, mensile 2× 85€, mensile open 105€, pacchetto 10 gruppo 150€ (val. 6 mesi), individuale singola 55€, individuale prova 30€, pacchetto 4 individuali 195€, pacchetto 8 individuali 375€, gravidanza gruppo singola 22€, gravidanza gruppo mensile 60€, gravidanza individuale singola 50€ (più bassa di individuale standard, accessibilità), gravidanza individuale prova 35€. **Prima lezione gruppo sempre gratuita**.

Razionale: mercato genovese opaco, quasi nessuno pubblica prezzi → trasparenza = vantaggio competitivo.

---

## 🧱 Stack tecnico

- **HTML5 statico** (no framework). Niente Astro/React/Next/bundler.
- **Hosting**: Netlify, deploy automatico al `git push origin main`. Build: `npm install && node build-schema.js && node build-blog.js && node build-reviews.js`.
- **CMS**: Decap (ex-Netlify CMS) via Netlify Identity + Git Gateway. Login `/admin/`.
- **Functions**: `book.js` (logica prenotazione classes).
- **Storage**: Netlify Blobs (prenotazioni).
- **Email transazionali**: Resend.
- **Font self-hostati** in `/assets/fonts/` (NESSUNA dipendenza esterna a Google Fonts dal maggio 2026).
- **Mappe**: Google Maps Embed API (gratis illimitato, key con HTTP referrer restriction).
- **Reviews**: Google Places API (New) build-time, ~$0.15-0.30/mese.
- **Build deps**: `marked` ^14, `gray-matter` ^4 (per blog).

**Deploy chain non runtime, no serverless rendering, niente DB**: tutto materializzato in HTML statico al build.

---

## 🗂 Struttura del codebase

```
/
├── index.html                          ← home (hero + 3 service card + SEO long-form + locations + FAQ + final CTA)
├── lezioni-di-gruppo/index.html        ← classes-container JS-driven + booking + FAQ + reviews block
├── lezioni-individuali/index.html      ← landing servizio premium + FAQ + reviews block
├── yoga-gravidanza-genova/index.html   ← landing SEO ~2000 parole, FAQPage 10 Q + reviews block
├── chi-sono/index.html                 ← bio + Anukalana + formazione + reviews block
├── eventi/index.html                   ← grid + modal detail + Event JSON-LD (build-schema.js)
├── contatti/index.html                 ← sedi + Maps Embed + orari + GBP link
├── blog/                               ← hub + categorie + articoli (generati da build-blog.js)
│   ├── index.html                      ← hub: 5 card categoria + grid 6 ultimi articoli
│   ├── posts/                          ← markdown con frontmatter (Decap)
│   ├── <categoria>/index.html          ← pagina categoria (auto-gen, solo se count > 0)
│   └── <categoria>/<slug>/index.html   ← articoli (auto-gen)
├── privacy-policy/index.html           ← noindex
├── termini/index.html                  ← noindex
├── yoga-in-gravidanza/index.html       ← Pillar nazionale (~3.500 parole)
├── anukalana-yoga/index.html           ← Pillar oceano blu (~2.500 parole)
├── yoga-genova-prezzi/index.html       ← Landing locale prezzi 2026 + 18 Offer JSON-LD
├── yoga-genova-carignano/index.html    ← Landing locale Carignano + Maps Embed + 6 FAQ logistiche
├── assets/
│   ├── css/main.css                    ← CSS unificato (incluso a11y skip-link, reduced-motion, blog/post)
│   ├── js/main.js                      ← JS unificato, ~9KB con focus trap menu + FAQ a11y + booking + events
│   └── fonts/
│       ├── inter-300-600.woff2         ← 48KB latin variabile (PRELOAD)
│       ├── cormorant-400-600.woff2     ← 38KB latin variabile (PRELOAD)
│       └── cormorant-italic-400.woff2  ← 23KB latin italic (font-display:optional, NO preload)
├── classes.json                        ← dati lezioni (Decap, NON toccare manualmente)
├── events.json                         ← dati eventi (Decap, NON toccare manualmente)
├── robots.txt                          ← allow esplicito a 10 retrieval bot AI
├── sitemap.xml                         ← URL list + lastmod (aggiornata da build-blog.js)
├── llms.txt                            ← briefing strutturato per LLM crawler
├── _redirects                          ← 301 Shopify legacy + App v2 + privacy/termini
├── build-schema.js                     ← Node: Event JSON-LD da events.json
├── build-blog.js                       ← Node: render articoli/categorie/hub + sitemap + marker pillar
├── build-reviews.js                    ← Node: fetch Google Places API + render HTML reviews
├── netlify.toml                        ← build command + headers
├── package.json                        ← deps: @netlify/blobs, resend, marked, gray-matter
├── admin/
│   ├── config.yml                      ← Decap CMS config (con collection blog)
│   └── index.html                      ← Decap entry point — INTOCCABILE
├── netlify/functions/
│   └── book.js                         ← logica booking + Resend — INTOCCABILE
├── img/                                ← foto sito (vedi sezione img sotto)
└── uploads/                            ← media CMS Decap
```

### Foto in `/img/` (key-value)

| File | Uso | Note |
|---|---|---|
| `1-640.webp` / `1-1080.webp` | Hero home | LCP-critical, preload+fetchpriority |
| `2-512.webp` / `2-1024.webp` | About home | q60 ricompresso |
| `3-640.webp` / `3-1080.webp` | Hero chi-sono / individuali / gravidanza-landing | |
| `4-960.webp` / `4-1440.webp` | Solo target del bottone "Scarica orari" | NO inline da 2026-05-05 |
| `5.png` | Logo 500×500 originale | Solo URL JSON-LD `logo` |
| `5-240.webp` | Logo header in pagina | 240×240, 6.7KB |
| `sara-anukalana-yoga-genova-parco-{640,1080}.webp` | Hero `/anukalana-yoga/` | |
| `sara-yoga-gravidanza-pancione-mani-cuore-{640,1080}.webp` | Hero `/yoga-in-gravidanza/` | |
| `sara-yoga-gravidanza-trimestri-progressione-{800,1200}.webp` | Mid-page pillar gravidanza | |
| `mani-pancione-meditazione-yoga-gravidanza-{640,1080}.webp` | Mid-page pillar gravidanza | |
| `classe-yoga-gravidanza-genova-gambe-muro-{640,1080}.webp` | `/yoga-in-gravidanza/` + `/yoga-gravidanza-genova/` | |
| `lezione-yoga-gruppo-genova-virabhadrasana-{960,1440}.webp` | Hero `/lezioni-di-gruppo/` + figure home | |
| `saluto-al-sole-yoga-genova-{640,1080}.webp` | `/anukalana-yoga/` mid-page | |
| `zafu-meditazione-yoga-studio-genova-{640,1080}.webp` | `/lezioni-individuali/` + `/yoga-genova-carignano/` | |
| `studio-yoga-genova-carignano-sala-{640,1080}.webp` | `/contatti/` (deprecato 2026-05-05) | |
| `studio-yoga-genova-carignano-dettaglio-{640,1080}.webp` | `/contatti/` (square crop attuale) | |
| `sara-maggiori-evento-yoga-sala-storica-{960,1440}.webp` | Hero `/eventi/` + cover blog meditazione | |

**Foto disponibili non ancora usate**: `yoga-genova-pratica-aperto` (cobra outdoor), `yoga-sound-healing-genova` (per blog evento Sound Healing).

**Backup originali pre-compressione**: `/img/orig/` (gitignored).

---

## 🏛 Architettura del sito

**Commerciale**: `/lezioni-di-gruppo/`, `/lezioni-individuali/`, `/yoga-gravidanza-genova/`
**Identità + utility**: `/chi-sono/`, `/eventi/`, `/contatti/`
**Pillar/landing SEO**: `/yoga-in-gravidanza/`, `/anukalana-yoga/`, `/yoga-genova-prezzi/`, `/yoga-genova-carignano/`
**Content**: `/blog/` (hub + 5 categorie + N articoli)
**Home**: `/` — 11 sezioni: hero, foto, trust-bar, 3 service-card, SEO long-form 4 H3, locations grid, FAQ accordion 4Q, final CTA WhatsApp.
**Legali**: `/privacy-policy/`, `/termini/` (noindex)

`/yoga-gravidanza-genova/` è la pagina commerciale più importante — specializzazione formale di Sara, bassa competizione locale, FAQPage 10 Q candidata a rich snippet.

**Convivenza intenzionale pillar+landing**: `/yoga-in-gravidanza/` (didattico nazionale, ~3.500 parole) e `/yoga-gravidanza-genova/` (conversion locale, ~2.000 parole) NON contengono testo duplicato. Stesso fatto detto in 2 modi diversi sui 2 registri.

---

## 📐 Convenzioni di sviluppo

### Markup duplicato (no partial)

Header, menu overlay, footer, WhatsApp button sono **duplicati identici** in ogni pagina HTML (~80 righe ripetute × 14 pagine). Decisione esplicita per evitare ogni rischio di rottura del workflow Decap. Per cambiare un link nel menu, modificare in 14 file (operazione rara, accettabile per sito di questa dimensione).

### `<head>` boilerplate

Ogni pagina deve avere, **nell'ordine**:
1. `<meta charset>`, `<meta viewport>`
2. `<title>` unico, `<meta name="description">`
3. `<link rel="canonical">`
4. OG tags (`og:type`, `og:title`, `og:description`, `og:url`, `og:image`, `og:locale="it_IT"`, `og:site_name="SaraMore Yoga"`)
5. `twitter:card="summary_large_image"`
6. `theme-color="#FAF7F2"`, favicon, apple-touch-icon
7. `<meta name="google-site-verification" content="M94JaFm0WuOHCsYHza67R7moak7UWUXmkqrs6HVyhec">`
8. **Preconnect**: `<link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>` (FontAwesome). Sulle 5 pagine col blocco recensioni anche `https://lh3.googleusercontent.com` (avatar).
9. **Preload immagine hero** (se la pagina ne ha una)
10. **Preload font**: `inter-300-600.woff2` + `cormorant-400-600.woff2` (NO italic, è optional)
11. `<link rel="stylesheet" href="/assets/css/main.css">` **blocking** — NON usare `media="print" onload` trick (causava CLS, vedi `82325b3`)
12. FontAwesome con `media="print" onload="this.media='all'"` + `<noscript>` fallback
13. Netlify Identity widget: SOLO su `/` (necessario per flow invito Decap CMS)
14. JSON-LD schema.org `<script type="application/ld+json">`

### Pattern preload font

```html
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/inter-300-600.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/cormorant-400-600.woff2" crossorigin>
```

NON preloadare `cormorant-italic-400.woff2` — è `font-display: optional` di proposito.

### Pattern preload immagine hero

Home:
```html
<link rel="preload" as="image" href="/img/1-1080.webp"
      imagesrcset="/img/1-640.webp 640w, /img/1-1080.webp 1080w"
      imagesizes="(max-width: 768px) 100vw, 900px"
      fetchpriority="high">
```

Sub-pagine: usa nomi semantici (vedi tabella img sopra). Es. `/lezioni-di-gruppo/` → `lezione-yoga-gruppo-genova-virabhadrasana-{960,1440}.webp`.

### Pattern `<img>` con responsive srcset

**Hero above-the-fold** (NO `loading=lazy`, SI `fetchpriority=high`):
```html
<img src="/img/1-1080.webp"
     srcset="/img/1-640.webp 640w, /img/1-1080.webp 1080w"
     sizes="(max-width: 768px) 100vw, 900px"
     alt="..."
     width="1080" height="1907"
     fetchpriority="high"
     decoding="async">
```

**Foto below-the-fold**:
```html
<img src="/img/2-1024.webp"
     srcset="/img/2-512.webp 512w, /img/2-1024.webp 1024w"
     sizes="(max-width: 768px) 100vw, 450px"
     alt="..."
     width="1024" height="1365"
     loading="lazy" decoding="async">
```

**Logo header** (240×240 webp, 6.7KB):
```html
<img src="/img/5-240.webp" alt="SaraMore Yoga" width="240" height="240" fetchpriority="high">
```

Su `privacy-policy` e `termini` il logo è senza `fetchpriority` (pagine `noindex`).

### JSON-LD schema.org

Ogni pagina ha JSON-LD nel `<head>`. Usare `@id` per cross-reference:
- Person Sara → `https://saramoreyoga.com/#sara`
- Business → `https://saramoreyoga.com/#business`
- Website → `https://saramoreyoga.com/#website`

**Schema type LocalBusiness**: usare `["LocalBusiness", "HealthAndBeautyBusiness"]`. **NON** `YogaStudio` (non è un type formalmente definito su schema.org → errore validatore).

**Tipi usati**:
- `LocalBusiness + HealthAndBeautyBusiness` ovunque (almeno versione minima con address e geo)
- `Person` (Sara) su home + chi-sono + gravidanza
- `Service` su lezioni-di-gruppo, lezioni-individuali, yoga-gravidanza-genova, yoga-genova-prezzi
- `FAQPage` su home (4Q), lezioni-di-gruppo (4Q), lezioni-individuali (5Q), yoga-gravidanza-genova (10Q), yoga-in-gravidanza (10Q), anukalana-yoga (5Q), yoga-genova-prezzi (5Q), yoga-genova-carignano (6Q)
- `Article` su pillar pages (yoga-in-gravidanza, anukalana-yoga)
- `BreadcrumbList` su pillar/landing/articoli blog
- `BlogPosting` su articoli blog (auto da `build-blog.js`)
- `VideoObject` su articoli blog con `youtube_url` (auto)
- `CollectionPage` su /eventi/ + categorie blog
- `ProfilePage` su chi-sono
- `ContactPage` su contatti
- `Blog` su /blog/
- `Event` su /eventi/ (auto da `build-schema.js`)

**Niente `inLanguage`** sui tipi LocalBusiness (warning validatore). Solo su `WebPage`/`ContactPage`/articoli.

**Anti-spam Reviews**: il blocco visibile (body) e il blocco JSON-LD (head) devono mostrare gli STESSI dati. Garantito da `build-reviews.js` che li popola dallo stesso fetch ad ogni build.

**Schema rollback (commit `698932c` 2026-05-05)**: `Service.aggregateRating` + `review[]` su 3 service pages NON eligibile per Review Snippet rich result Google. La lista parent valida è Product/Recipe/Book/Movie/HowTo/ecc — NON Service. Per local services come yoga le stelline SERP arrivano da GBP Knowledge Panel + Local Pack, non da schema on-site. Il blocco recensioni resta visibile come trust signal HTML, zero schema.

### CSS patterns (pillar pages + blog)

**Pillar pages**:
- `.long-form` — wrapper sezioni body lunghe: `<p>` con `margin-bottom: 1.15em`, `<h3>` serif 1.55rem, link sage. Sostituisce gli inline style ripetuti `<div style="max-width: 720px; margin: 25px auto; ...">`.
- `.trimestre-section` — pattern card a piena larghezza per sezioni multiple sequenziali (NON grid 3 colonne). Usato per i 3 trimestri della pillar gravidanza. Riusabile per "X step / Y fasi" con contenuto > 100 parole per step.
- `.long-form .pullquote` — pull-quote sage italic grandi a interruzione di sezione lunga.
- **NON usare** `.trimestre-grid` (vecchio pattern 3 card affiancate) per contenuti lunghi: muro illeggibile. Deprecata per pillar.

**Pricing landing** (`/yoga-genova-prezzi/`): `.price-table`.
**Schedule landing** (`/yoga-genova-carignano/`): `.schedule-table`.

**Blog/post** (~290 righe in fondo a `main.css`):
- `.blog-cat-grid` + `.blog-cat-card` — hub categorie (grid responsive con icona FontAwesome + descrizione + count)
- `.blog-cat-card-empty` — categoria con count=0 (opacity 0.6, cursor not-allowed, no hover)
- `.blog-card-img-placeholder` — placeholder grafico se articolo no cover/video
- `.blog-card-cat` — badge sage categoria nelle card
- `.post-container`, `.post-header`, `.post-meta`, `.post-category`, `.post-summary`
- `.post-cover`, `.post-video-wrap`, `.post-video`, `.post-video-label` — cover/video responsive 16:9
- `.post-body` — stili h2/h3, blockquote, code, pre, table GFM, immagini
- `.post-toc` — mini-TOC sage italic con border-left
- `.post-tags`, `.post-tag` — pill grigie
- `.post-related` — box terracotta "Approfondisci"

**Reviews** (`build-reviews.js`):
- `.google-reviews`, `.gr-header`, `.gr-logo`, `.gr-rating-*`
- `.gr-reviews-grid` (5 card responsive)
- `.gr-review-card`, `.gr-review-avatar`, `.gr-review-meta`, `.gr-review-text`, `.gr-cta`

### A11y patterns (skip-link, main, menu trap, FAQ)

Implementato Round 2 (commit `680f9a2` 2026-05-08).

**`<main id="main">`** wrapper su 14 pagine. Sostituisce `<div class="container">` (e `<div class="legal-container">` su privacy/termini). **`<a href="#main" class="skip-link">Salta al contenuto</a>`** come primo elemento di `<body>`. Off-screen di default, visibile su `:focus`.

**Hamburger button**: `<button type="button" class="nav-toggle" aria-label="Apri menu" aria-expanded="false" aria-controls="menu-overlay">` — NON `<div onclick>`. Il bottone "Chiudi" del menu overlay è già `<button>` (warning Lighthouse).

**Menu mobile focus trap**: `toggleMenu()` sincronizza `aria-expanded`, sposta il focus al primo `.menu-link` all'apertura, restituisce focus al toggle alla chiusura. `menuKeyHandler` intercetta `Escape` (chiude) e `Tab/Shift+Tab` (focus trap circolare).

**FAQ accessible**: `initFaq()` aggiunge dinamicamente `role="button"`, `tabindex="0"`, `aria-expanded`, `aria-controls` alle `.faq-question`. Handler `keydown` per Enter + Space (con `preventDefault` per evitare scroll).

**`prefers-reduced-motion`**: `@media (prefers-reduced-motion: reduce)` in fondo a `main.css` disabilita animation/transition + override `.fade-in` opacity:1 per utenti con sensibilità al movimento.

**Contrasto WCAG AA** (commit `3134418`): `--text-light` `#8A8A85` → `#6B6B66` (3.0 → 4.97), breadcrumb link dark + underline sage offset 3px, post-meta opacity 0.5 → 0.7. Footer P.IVA + copyright opacity rimosse inline su 22 file.

### Wikidata `sameAs` (entity disambiguation per Google KG + LLM)

Aggiunto SOLO sui 4 `sameAs` array già esistenti: home `#business`, home `#sara`, chi-sono `#sara`, contatti `#business`. Le pagine con stub `#business` minimale (lezioni-*, gravidanza, eventi) NON toccate — Google merge entità via `@id` cross-page.

**Health check trimestrale**: verificare che le pagine Wikidata non siano cancellate per "lack of notability". Se cancellate, rimuovere il `sameAs` corrispondente.

### `hasMap` (entity merge GBP)

Aggiunto al JSON-LD `LocalBusiness` di `index.html` + `contatti/index.html`:
```json
"hasMap": "https://maps.app.goo.gl/GA3Qut4REbwjiaEh8"
```
Segnale entity merge per Google KG. Lavora in coppia con `sameAs[3]` (stessa URL GBP) e con il Maps Embed iframe pinnato al Place ID.

### Mappa contatti (Maps Embed API)

```html
<iframe src="https://www.google.com/maps/embed/v1/place?key={KEY}&q=place_id:ChIJdf86kA9D0xIRU9TR4qz8gQY&language=it"
        title="SaraMore Yoga — Studio Equilibra, Piazza Alessi 2/3, Genova"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen></iframe>
```

Pinnato al Place ID GBP → la card embeddata È la scheda canonica del business (entity signal a Google KG). Gratis illimitato (no per-call billing). Sotto, link `https://maps.app.goo.gl/GA3Qut4REbwjiaEh8`.

**Sicurezza key**: la key è esposta in HTML statico. Mitigato da HTTP referrer restriction in Google Cloud Console (`saramoreyoga.com/*` + `*.netlify.app/*`). Pre-5 maggio 2026 si usava OpenStreetMap embed.

### `_redirects` (Netlify)

3 layer:
1. **Shopify legacy** — `/products/*` → `/lezioni-individuali/`, `/services/*` → `/`
2. **App v2 dismessa** — `/auth/*` → `/contatti/`, `/events/*` → `/eventi/`, `/legal/*` → `/contatti/`, ecc.
3. **Migrazione SPA → multi-pagina** — `/privacy.html` → `/privacy-policy/`, `/termini.html` → `/termini/`

ATTENZIONE: `/classes.json` e `/events.json` NON sono nei redirects. Restano raggiungibili (li usa il JS via `fetch()`). Sono solo `Disallow:` in `robots.txt`.

### `robots.txt` AI bot allow

Allow esplicito: OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Claude-SearchBot, Claude-User, ClaudeBot, GPTBot, Google-Extended, Applebot-Extended.
Disallow: `/admin/`, `/uploads/`, `/classes.json`, `/events.json`, `/.netlify/`.

### Menu di navigazione (uniforme su tutte le pagine)

```
Home                  → /
Lezioni di gruppo     → /lezioni-di-gruppo/
Lezioni individuali   → /lezioni-individuali/
Yoga in gravidanza    → /yoga-gravidanza-genova/
Chi sono              → /chi-sono/
Eventi                → /eventi/
Blog                  → /blog/
Contatti              → /contatti/
```

### Hash anchor SPA legacy

Deep link `/#orari`, `/#chisono` ricevuti via Instagram/WhatsApp non gestiti da Netlify (gli hash non arrivano al server). Andrebbero gestiti in `assets/js/main.js` con un fallback iniziale (mappa hash → URL reali). **Attualmente non implementato.**

### Pattern noindex per nuove pagine

Per pagine in scrittura: `<meta name="robots" content="noindex, follow">` + commento `<!-- TODO: rimuovere noindex quando contenuto pubblicato -->`. `follow` permette a Google di scoprire i link interni alle pagine indicizzate. Cleanup massivo: `grep -rn "TODO: rimuovere noindex" .`

### Pattern placeholder

Sezioni "da scrivere" → `<div class="placeholder-section">` (stile giallo evidente in pagina) + meta `[Da scrivere — Tipo]` + descrizione + target parole. Indica anche quando il blocco JSON-LD `FAQPage` ha solo dummy Q da popolare col contenuto finale.

### Convenzioni scrittura contenuti (long-form pillar + blog)

- **Bold strategici 2-3 per paragrafo** sulle keyword SEO + frasi-ancora per scansione (~180 `<strong>` su pagina 3.500 parole).
- **`<em>` su asana sanscriti** (es. `<em>Tadasana</em>`, `<em>Marjariasana</em>`). Quando l'asana è anche keyword SEO importante: `<strong><em>Asana</em></strong>`.
- **`<em>` su termini tecnici stranieri** (*Reformer*, *core*, *Vinyasa*).
- **Citazioni scientifiche**: autore + anno + rivista in `<em>` se presente (es. "Babbar et al. (2012), *Obstet Gynecol*"). No link uscenti.
- **Disclaimer medico** (su gravidanza): blocco evidenziato (`background: var(--bg-warm)`, border-radius, padding) con `<strong>Una precisazione importante.</strong>` + testo `font-size: 0.92rem`.
- **Internal linking distribuito** (10-15 link interni per articolo lungo): pillar 2-3×, landing locale 2-3×, ancore variate.
- **External linking**: per citazioni oneste / E-E-A-T (es. yogasomatico.it ×7 per riconoscere Laura come fonte). No backlinking promozionale.
- **H2 ogni 200-400 parole**, H3 dove servono sub-cases. Sweet spot: 3.000-4.000 parole con 7-8 H2 = ranking + TOC auto.
- **CTA WhatsApp inline** in chiusura body + auto-CTA template alla fine.
- **Tono Sara**: italiano fluido, prima persona, "amica esperta", no spiritualismo vacuo, no overclaim. Esempio firma intro: `<p style="font-style:italic; color:var(--sage); margin-top:25px;">Sara</p>`.

**Regola forte**: niente copia letterale tra pillar nazionale e landing locale. Stesso fatto detto in 2 modi diversi sui 2 registri (pillar = didattico, landing = conversion).

### Workflow encoding articoli blog

Markdown spesso con mojibake UTF-8→Latin-1 (è → Ã¨, à → Ã , — → â, 💬 → ð¬). Procedura: trick `latin-1.encode → utf-8.decode` in Python + 3+ sentinel pre-fix per char multi-byte non recuperabili (em-dash, freccia, emoji) + regex contesto-aware `(letter)�` → à vs `�` → È + normalizzazione NBSP. Pattern script reusabile (vedi `tmp/yoga-somatico-fix.py`).

---

## ⚙️ Build scripts (Netlify deploy chain)

Eseguiti in ordine: `npm install && node build-schema.js && node build-blog.js && node build-reviews.js`. Tutti idempotenti, fail-soft, possono essere lanciati anche localmente.

### `build-schema.js`

Legge `events.json`. Per ogni evento attivo con data parsabile in italiano (es. "27 Febbraio - Ore 18:00") inietta `<script type="application/ld+json">` di tipo Event nei marker `<!-- BUILD:EVENTS:START/END -->` di `eventi/index.html`.

Idempotente: se non ci sono eventi attivi/parsabili, blocco svuotato senza errore.

Riferimenti nel codice:
- `MONTHS_IT` mapping mesi italiani → numeri
- `parseItalianDate(input, fallbackYear)` parser lenient
- `locationToSchema(loc)` riconosce "Equilibra" e "Jakukai" → PostalAddress

Hint Decap per Sara: includere giorno + mese in italiano + (se possibile) "Ore HH:MM". Anno opzionale (default = corrente).

### `build-blog.js`

~600 righe Node.js no framework. Pipeline:
1. Legge `blog/posts/*.md` (frontmatter `gray-matter`, body `marked` GFM on)
2. Filtra `published: true`, valida categoria + title + date, ordina per data desc
3. Estrae `youtube_id` da `youtube_url` (3 pattern: youtu.be / watch?v= / embed/)
4. Per articolo → `/blog/<categoria>/<slug>/index.html` con: meta + OG + canonical + JSON-LD `BlogPosting` + `BreadcrumbList` + (se video) `VideoObject` + iframe YouTube responsive 16:9
5. Per categoria con count > 0 → `/blog/<categoria>/index.html` con `CollectionPage` + `BreadcrumbList` + grid card
6. `/blog/index.html` (hub) → 5 card categoria (cliccabili se count>0, `.blog-cat-card-empty` altrimenti) + grid 6 ultimi articoli
7. Aggiorna `sitemap.xml` tra marker `<!-- BUILD:BLOG-URLS:START/END -->` (idempotente)
8. Popola marker `<!-- BUILD:BLOG-GRAVIDANZA:START/END -->` su `/yoga-in-gravidanza/` e `<!-- BUILD:BLOG-ANUKALANA:START/END -->` su `/anukalana-yoga/`

**Decisioni tecniche**:
- `marked` ^14 (no markdown-it, no DOMPurify — Sara è l'unica autrice via Decap)
- `gray-matter` ^4 + helper `normalizeDate()`: `js-yaml` parsa `date: YYYY-MM-DD` come `Date` object → ricostruisce ISO via `getUTCFullYear/Month/Date` per evitare slittamenti timezone
- GFM tables/footnotes: ON
- TOC auto: solo se 4+ heading h2/h3. Helper `injectHeadingIds()` post-process `marked` (v14 ha rimosso `headerIds`/`headerPrefix`) → inietta `id="sec-<slug>"` (slugify diacritic-safe NFD)
- Reading time: 220 wpm
- Cover articolo body img: usa **path relativo** (`post.cover`); og:image + JSON-LD restano absolute URL come da Google Structured Data spec

**Cross-linking automatico** (box "Approfondisci" + CTA WhatsApp):
- gravidanza → pillar `/yoga-in-gravidanza/` + CTA `/yoga-gravidanza-genova/`
- anukalana → `/anukalana-yoga/` + CTA `/lezioni-di-gruppo/`
- pratica → `/anukalana-yoga/` + CTA `/lezioni-di-gruppo/`
- genova → `/yoga-genova-prezzi/` + CTA `/lezioni-di-gruppo/`
- salute → `/lezioni-individuali/` + CTA `/lezioni-individuali/`

**Pubblicare un articolo** dallo scheletro: `published: false` → sostituire body → `published: true` → `node build-blog.js` → materializzato in `/blog/<cat>/<slug>/index.html`, sitemap auto-aggiornata, marker pillar popolato, hub blog rigenerato.

**Articoli blog (stato 8 maggio 2026)**:

| # | Categoria | Slug | KW | Parole | Reading | Stato |
|---|---|---|---|---|---|---|
| 1 | gravidanza | `come-scegliere-corso-yoga-gravidanza` | corso yoga in gravidanza | — | — | scheletro `published: false` |
| 2 | anukalana | `yoga-somatico` | yoga somatico (720 vol) | 4.106 | 19 min | **PUBBLICATO** |
| 3 | pratica | `posizione-del-piccione-yoga` | posizione del piccione yoga | 3.884 | 18 min | **PUBBLICATO** |
| 4 | genova | `yoga-pilates-genova-differenze` | yoga pilates genova | 3.165 | 14 min | **PUBBLICATO** |
| 5 | salute | `come-iniziare-a-meditare` | come iniziare a meditare | 2.200 | 10 min | **PUBBLICATO** |

### `build-reviews.js`

~250 righe Node.js zero deps. Pipeline:
1. GET `places.googleapis.com/v1/places/{PLACE_ID}` con header `X-Goog-FieldMask: displayName,rating,userRatingCount,reviews,googleMapsUri` + `languageCode=it`
2. Parsing JSON, render HTML statico fra marker `<!-- BUILD:REVIEWS:START/END -->` su 5 pagine: `index.html`, `chi-sono/`, `lezioni-di-gruppo/`, `lezioni-individuali/`, `yoga-gravidanza-genova/`
3. Render: logo Google 4 colori, rating "5,0" + counter, grid 5 card con foto reviewer (lazy + no-referrer), nome (link al profilo Google), stelle, time relativo IT, testo troncato 280 char, footer link a GBP

**Env vars Netlify** (settate via dashboard):
- `GOOGLE_PLACES_API_KEY` (secret)
- `GOOGLE_PLACE_ID` = `ChIJdf86kA9D0xIRU9TR4qz8gQY`

**Comportamento fail-soft**: env vars mancanti o API fail → skip senza rompere build. Marker committati vuoti, materializzati ad ogni build.

**Costo Places API**: ~$0.15-0.30/mese (5 fetch al giorno × ~30 giorni con field masking).

---

## 🚧 Vincoli rigidi (NON toccare)

- `netlify/functions/book.js` — logica prenotazione in produzione
- `classes.json` e `events.json` — dati Sara via Decap
- `admin/index.html` — entry Decap
- `img/` esistenti e `uploads/` — asset
- `assets/fonts/` — font self-hostati
- **Palette CSS, font, identità visiva**: Cormorant Garamond + Inter, palette earthy `--bg #FAF7F2`, `--sage #7C8B6F`, `--terracotta #C08B6B`, `--dark #2A2A28`
- Logica JS funzionante: `loadClasses()`, `loadEvents()`, `submitBooking()`, `openDetail()`/`closeDetail()`, fade-in observer, focus trap menu
- Modal booking, modal event detail
- WhatsApp button flottante, link Stripe in eventi
- Tag `<img>` con `width`/`height` espliciti (CLS = 0)
- `font-display: optional` su Cormorant italic
- `<main id="main">` + `class="skip-link"` + `<button class="nav-toggle">` con aria-* (pattern a11y consolidato Round 2)

**Nessun framework nuovo**: no Astro/React/Next/bundler. Resta HTML + CSS + JS vanilla. Nessuna dipendenza runtime aggiunta.

---

## ⚡ Performance snapshot

### PSI mobile https://saramoreyoga.com/

| Metrica | Pre-refactor | Attuale (atteso) | Target |
|---|---|---|---|
| Performance score | ~50 | ~91-92 | 90+ |
| FCP | 2.9s | ~1.5s | <1.8s ✅ |
| LCP | 4.4s | ~1.8s | <2.5s ✅ |
| TBT | n/a | 0ms ✅ | <200ms |
| CLS | n/a | 0 ✅ | <0.1 |
| Speed Index | 4.6s | ~3.0s | <3.4s |
| Accessibility score | ~85 | ~95+ | 90+ |
| SEO score | ~95 | ~96-100 | 90+ |

PSI desktop: ~98.

### Interventi applicati (cumulativi)

1. **Self-hosted fonts** (`a3256fc`): 3 woff2 latin in `/assets/fonts/`. 2 preloaded. Italic con `font-display: optional` (`ee54d1b`). -750ms latenza vs Google Fonts.

2. **Immagini** (`a3256fc`): logo 5.png 33KB → 5-240.webp 6.7KB. 2-1024 q60: 217 → 156KB. Hero responsive srcset 640w/1080w o 960w/1440w. File 5.png mantenuto (URL JSON-LD `logo`).

3. **JS** (`cfe855a` + `ee54d1b` + `4e946ab`): rimosso codice SPA morto + PWA banner UA detection. Init `DOMContentLoaded`. `<script defer>`. Netlify Identity solo su `/`.

4. **Hero LCP fix** (`5a22319`): rimosso `class="fade-in"` da `.hero-img` su home. **Lezione**: mai `fade-in` su elementi LCP-candidate (Lighthouse aspetta la transizione).

5. **Crawlability**: bottone "Chiudi" menu da `<a href="javascript:void(0)">` a `<button>`.

6. **Preconnect CDN** (`4f15df4`): `cdnjs.cloudflare.com` su 14 file + `lh3.googleusercontent.com` su 5 file con reviews. -50-150ms FCP.

7. **A11y Round 2** (`680f9a2`): `<main>` + skip-link + FAQ keyboard + menu focus trap + reduced-motion. Lighthouse a11y: 85 → 95+.

### Tentativi falliti (NON ripetere)

**Critical CSS inline + main.css async** (`a3256fc`, revertito in `82325b3`): pattern `<link rel="stylesheet" href="/assets/css/main.css" media="print" onload="this.media='all'">`. **Causava CLS massivo** perché il critical CSS non copriva `img{max-width:100%}`, `.locations-grid`, `.services-grid` → immagini renderizzavano a dimensione intrinseca (1080×1907). PSI 70 → 67. Riportato a blocking.

Se si riprova: critical CSS DEVE includere TUTTI i selettori che vincolano le dimensioni di elementi above-the-fold.

**`Service.aggregateRating` + `review[]` schema** (`eb29354`, revertito in `698932c`): Service NON è parent valido per Review Snippet rich result Google. Per yoga le stelline SERP arrivano da GBP, non da schema on-site.

---

## 📋 Aperto / In programma

### Carte attive (vedi `BACKLOG.md`)

- **Articolo blog gravidanza** (#1) — sblocca card categoria sull'hub blog
- **Hash anchor legacy** — IIFE in `main.js` per redirect `/#orari` → `/lezioni-di-gruppo/`, `/#chisono` → `/chi-sono/`
- **Rate limit `book.js`** — Round 3 a11y/sicurezza (counter Netlify Blobs per IP, max 5 prenotazioni / 10 min)
- **HTTP referrer restriction key Maps Embed** — DEFERRED (carta zero-balance)

### Cleanup ulteriore (basso ROI)

- **FontAwesome eliminazione**: ~30 icone su 7000. SVG inline risparmierebbe ~80KB.
- **`fade-in` review**: verificare che nessun altro elemento above-the-fold (`/yoga-gravidanza-genova/`, ecc.) abbia il problema dell'LCP killed da fade-in.
- **Forced reflow** ~70ms (probabilmente IntersectionObserver). Accettabile per ora.

### Future SEO

- Sitemap automatica (vs file statico) basata sull'enumerazione directory
- Web Vitals RUM (Vercel Analytics o equivalente)
- **IndexNow** valutato e scartato (Google non partecipa, Bing IT ~3% market share, ROI low). Riconsiderare se traffico Bing significativo da GSC.
- **Bing Webmaster Tools** — setup manuale in corso. Quando workflow stabile, valutare automazione via Submit URL API.

---

## 📝 Note operative

- **Quando in dubbio, chiedi a Giuseppe** prima di decisioni grosse.
- **Privilegia conservazione**: tra "modificare X" e "lasciare X", lascia.
- **Italiano fluido**, no anglicismi gratuiti ("prenotazione" non "booking").
- **Tono di Sara**: gentile, presente, pratica. No motivazionale-spirituale-vacuo. ("Non insegno posizioni perfette. Insegno a stare bene nel proprio corpo, con il proprio respiro.")
- **Dati intoccabili**: `classes.json`, `events.json`, P.IVA, indirizzo, telefono. Mai inventare.
- **Niente prezzi pubblici** fuori da `/yoga-genova-prezzi/`. CTA WhatsApp altrove.
- **Niente embed reel/social**: scelta esplicita di Giuseppe. Solo `<a>` testuali con icona a Instagram/Facebook/GBP.
- **Footer**: copyright "© 2026 SaraMore Yoga di Sara Maggiori" + P.IVA + sede legale + link a tutte le pagine + privacy/termini.
- **Ogni intervento performance va misurato con PSI mobile prima e dopo**. Non assumere un guadagno: misuralo.
- **Push autorizzazione esplicita**: Giuseppe autorizza ogni push. Mai pushare senza "vai"/"push"/"pusha"/"commit".
- **Verifica prima di affermare**: prima di dare colpa a CDN esterni, controllare `git status` / file locali (lezione del 5 maggio: 2 file zafu untracked, non era CDN). Prima di dire "X non esiste" cercare/verificare.

---

## 🛠 Comandi utili

### Sviluppo locale

```bash
# Server statico
python3 -m http.server 8765
# poi http://localhost:8765

# Build manuali
node build-schema.js
node build-blog.js
node build-reviews.js   # richiede env: GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID

# Validazione JSON-LD su tutte le pagine
python3 - <<'PY'
import re, json
from pathlib import Path
PAGES = ["index.html"] + [str(p) for p in Path(".").glob("*/index.html") if "admin/" not in str(p)]
for p in PAGES:
    html = Path(p).read_text()
    blocks = re.findall(r'<script type="application/ld\+json">\s*(.+?)\s*</script>', html, re.DOTALL)
    for blk in blocks:
        try: json.loads(blk)
        except json.JSONDecodeError as e: print(f"FAIL {p}: {e}")
    print(f"OK {p}: {len(blocks)} JSON-LD")
PY
```

### Compressione immagini (libwebp 1.6.0+)

```bash
cwebp -q 75 -m 6 input.jpg -resize 1080 0 -o output-1080.webp
cwebp -q 60 -m 6 input.jpg -resize 1024 0 -o output-1024.webp  # ritratti grandi
cwebp -q 90 -m 6 logo.png -resize 240 240 -o logo-240.webp     # logo qualità alta

# Foto repertorio Sara: pipeline deterministica (no AI, no metadata pollution)
magick input.jpeg -auto-level -modulate 100,106,100 -unsharp 0x0.75+0.5+0 -strip out.jpg
cwebp -q 78 -m 6 out.jpg -resize 1080 0 -o nome-seo-1080.webp
```

### Verifiche post-deploy

```bash
# Tutte le pagine devono tornare 200
for path in / /lezioni-di-gruppo/ /lezioni-individuali/ /yoga-gravidanza-genova/ \
            /chi-sono/ /eventi/ /contatti/ /blog/ /privacy-policy/ /termini/ \
            /yoga-in-gravidanza/ /anukalana-yoga/ /yoga-genova-prezzi/ /yoga-genova-carignano/; do
  echo "[$(curl -s -o /dev/null -w '%{http_code}' https://saramoreyoga.com$path)] $path"
done

# Redirect 301
for url in /products/test /auth/signup /events/cmf123 /legal/privacy-policy /book /privacy.html /termini.html; do
  curl -sI "https://saramoreyoga.com$url" | head -3
done

# Font self-hostati
for f in inter-300-600 cormorant-400-600 cormorant-italic-400; do
  echo "[$(curl -s -o /dev/null -w '%{http_code}' https://saramoreyoga.com/assets/fonts/$f.woff2)] $f.woff2"
done

# Config files
curl -s https://saramoreyoga.com/llms.txt | head
curl -s https://saramoreyoga.com/robots.txt
curl -s https://saramoreyoga.com/sitemap.xml | grep '<loc>' | wc -l
```

### Validatori esterni

- Schema.org: https://validator.schema.org/
- Google Rich Results: https://search.google.com/test/rich-results
- PageSpeed Insights: https://pagespeed.web.dev/analysis/https-saramoreyoga-com (mobile + desktop)
- Lighthouse: DevTools → Lighthouse → Accessibility + SEO + Performance
- WAVE (a11y): https://wave.webaim.org/

### Decap CMS

Login: `https://saramoreyoga.com/admin/`. Sara può:
- Modificare lezioni in `classes.json`
- Modificare eventi in `events.json` (genera Event JSON-LD al deploy successivo via `build-schema.js`)
- Scrivere articoli blog → `blog/posts/*.md` → renderizzati da `build-blog.js`

---

## 🎯 Contesto strategico

Sara fa ~2.500€/mese con 50 clienti attivi, modello "insegnante ospite". Tetto fisico ~4.000€. Per crescere serve visibilità → SEO + AI search + GBP.

Pre-refactor il sito era invisibile (2 pagine indicizzate su 42 URL note, 20 click in 3 mesi). Con la nuova struttura ogni pagina è una porta che intercetta una query, ogni schema è una citazione potenziale in ChatGPT/Claude/Perplexity, la pagina gravidanza è la singola URL a più alto ritorno potenziale.

Successo si misura in 3-6 mesi su: impressioni in GSC, posizioni medie per "yoga Genova", "yoga gravidanza Genova", "lezioni yoga Carignano", citazioni in risposte AI, contatti WhatsApp dal sito.

---

## 📚 Glossario

| Termine | Cosa è |
|---|---|
| **Decap** | CMS git-based per Sara (era Netlify CMS). Login via Netlify Identity. |
| **Anukalana** | Approccio yoga di Sara, "integrazione" — adatta yoga al corpo. Sviluppato da Jacopo Ceccarelli, scuola Samadhi Firenze. |
| **Studio Equilibra** | Sede operativa principale, Piazza Alessi 2/3, Genova Carignano. |
| **Dojo Jakukai** | Sede operativa secondaria, Via Fieschi 20. |
| **GBP** | Google Business Profile. URL canonico `https://maps.app.goo.gl/GA3Qut4REbwjiaEh8`, Place ID `ChIJdf86kA9D0xIRU9TR4qz8gQY`, 25 recensioni 5/5 al 8 mag 2026. |
| **GSC** | Google Search Console. |
| **PSI** | PageSpeed Insights. |
| **CWV / LCP / FCP / TBT / CLS** | Core Web Vitals: largest contentful paint, first contentful paint, total blocking time, cumulative layout shift. |
| **font-display: optional** | Browser carica il font solo se arriva entro ~100ms; altrimenti fallback definitivo (no swap, no CLS). Usato per Cormorant italic. |
| **fetchpriority** | Hint browser per prioritizzare risorse critiche above-the-fold. |
| **build-schema.js** | Inietta Event JSON-LD in /eventi/ al deploy. |
| **build-blog.js** | Render blog (articoli/categorie/hub) + sitemap + marker pillar al deploy. |
| **build-reviews.js** | Fetch Google Places API + render HTML reviews su 5 pagine al deploy. |
| **EAA** | European Accessibility Act, in vigore giugno 2025. WCAG 2.1 AA mandatorio per ecommerce/servizi. |
| **Pillar / Landing** | Pillar = pagina lunga didattica nazionale (es. /yoga-in-gravidanza/). Landing = pagina corta conversion locale (es. /yoga-gravidanza-genova/). Convivono senza copia letterale. |

---

## 📜 Storia (commit milestone)

Tabella compressa per fase. Per dettagli sui singoli commit vedere `git log <hash>` (più affidabile della prosa).

### Fase 1 — Refactor SPA → multi-pagina + perf (2 maggio 2026)

| Commit | Significato |
|---|---|
| `4975a0e` | Trasformazione SEO/LLM/multi-pagina (10 URL, JSON-LD, schema, sitemap, llms.txt) |
| `dceca4a` | Meta tag GSC verification |
| `d5fe0f8` | sitemap.xml + robots.txt |
| `c723d7c` | Rimuove card Chi Sono dal quick-nav, elimina manifest.json |
| `b38d420` | CTA Chi Sono styled, footer dati legali |
| `cfe855a` | Rimuove Netlify Identity da 7 subpages, DOMContentLoaded init, dead SPA code |
| `a3256fc` | Self-host font + ricomprimi immagini + logo webp |
| `82325b3` | Revert: critical CSS inline + main.css async (causava CLS) |
| `ee54d1b` | Italic font-display:optional + defer main.js |
| `5a22319` | Rimuove fade-in da .hero-img su home (LCP killer) |
| `04a7148` | Docs: CLAUDE.md v1 |
| `960d38f` | sameAs Wikidata in JSON-LD (Q139618286 + Q139618479) |

### Fase 2 — Refactor alberatura + blog system + content + Google Reviews (4-5 maggio 2026)

| Commit / Sprint | Significato |
|---|---|
| `96d530e` Sprint 1 | 5 nuove pagine pillar/landing (noindex iniziale) + footer Approfondimenti su 13 pagine + GBP integrato |
| `96d530e` Sprint 1.1 | Pubblicazione `/yoga-in-gravidanza/` (~3.500 parole) + pattern CSS `.long-form` + `.trimestre-section` |
| `96d530e` Sprint 1.2 | Pubblicazione `/anukalana-yoga/` + `/yoga-genova-prezzi/` (18 Offer JSON-LD) + pattern CSS `.price-table` |
| `96d530e` Sprint 1.3 | Pubblicazione `/yoga-genova-carignano/` + pattern CSS `.schedule-table` + eliminazione `/yoga-genova-centro-storico/` |
| `96d530e` Sprint 1.4 | GBP URL canonico `maps.app.goo.gl/GA3Qut4REbwjiaEh8`, coordinate verificate 44.402534/8.938980 |
| `96d530e` Sprint 2 | Sistema blog: `build-blog.js` + Decap config + deps `marked` + `gray-matter` + CSS blog/post (~290 righe) |
| `96d530e` Sprint 2.1 | Fix 3 bug blog: `injectHeadingIds()`, `header` CSS scope `body > header`, doppio escape TOC |
| `96d530e` Contenuti #1 | Pubblicati 3 articoli pillar: yoga-somatico, posizione-del-piccione, yoga-pilates-genova |
| `96d530e` Contenuti #2 | Pubblicato 4° articolo: come-iniziare-a-meditare |
| `96d530e` 404-safe | Hub blog: card categoria con count=0 → `.blog-cat-card-empty` (no link rotto) |
| `96d530e` AI-crawler | Rewrite llms.txt + sitemap.xml riordinata 7 blocchi |
| `3134418` | A11y contrasto WCAG AA + breadcrumb link distinguibili |
| `d4d108e` | BACKLOG.md (24 carte) |
| `b37123f` | CLAUDE.md + BACKLOG.md aggiornati |
| `a09622e` / `7b7b00e` | Docs CARD-026 (build-reviews.js plan) |
| `e30515d` | Google Reviews integration via Places API (build-reviews.js) |

### Fase 3 — Maps Embed + foto repertorio + cleanup + a11y Round 1+2 (5-8 maggio 2026)

| Commit | Significato |
|---|---|
| `698932c` | Rollback phase 2 schema (Service.aggregateRating non eligibile rich snippet Google) |
| `29b2195` | Swap OSM iframe → Google Maps Embed API + `hasMap` JSON-LD |
| `c41e0e4` | Docs: aggiunge commit 698932c |
| `ff9a11f` | Foto repertorio 2026 + cleanup palinsesto + fix build-blog body img |
| `b76b330` | Fix img zafu-meditazione webp mancanti (404 in prod) |
| `4e946ab` | Rimuove banner PWA e relative logiche app (z-index conflict + cleanup) |
| `4f15df4` | A11y/perf/ux Round 1: modal eventi src vuoto, prefers-reduced-motion, preconnect CDN |
| `680f9a2` | A11y Round 2: `<main>` landmark + skip-link + FAQ keyboard + menu focus trap + nav-toggle button |
