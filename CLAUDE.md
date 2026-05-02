# saramoreyoga.com — Documentazione del progetto

> Sito di **Sara Maggiori** (brand: **SaraMore Yoga**), insegnante di yoga a Genova. In produzione su Netlify, dominio canonico **`https://saramoreyoga.com`** (no www). Sito multi-pagina, ottimizzato SEO + crawlable da AI, gestibile da Sara via Decap CMS.

## Stato attuale (2 maggio 2026)

Il sito è stato trasformato dal monolite SPA originale (un solo `index.html` con 6 viste mostrate via `display: none`) a una struttura multi-pagina vera con **10 URL indicizzabili**, ognuna con HTML reale, JSON-LD schema.org e meta SEO completi. Successivamente sottoposto a una sessione intensa di ottimizzazione performance (PSI mobile da ~50 a ~90 atteso).

### Commit milestone

| Commit | Data | Significato |
|---|---|---|
| `4975a0e` | 2026-05-02 | feat: trasformazione SEO/LLM/multi-pagina (10 URL, JSON-LD, schema, sitemap, llms.txt) |
| `dceca4a` | 2026-05-02 | feat: meta tag Google Search Console verification |
| `d5fe0f8` | 2026-05-02 | feat: sitemap.xml e robots.txt |
| `c723d7c` | 2026-05-02 | fix: rimuove card Chi Sono dal quick-nav, elimina manifest.json |
| `b38d420` | 2026-05-02 | fix: CTA Chi Sono styled, footer dati legali |
| `cfe855a` | 2026-05-02 | perf: rimuove Netlify Identity da 7 subpages + DOMContentLoaded init + dead SPA code rimosso |
| `a3256fc` | 2026-05-02 | perf: self-host font + critical CSS inline + logo webp + ricomprimi 2-1024 |
| `82325b3` | 2026-05-02 | revert: critical CSS inline + main.css async (causava CLS) |
| `ee54d1b` | 2026-05-02 | perf: italic font-display:optional + defer main.js |
| `5a22319` | 2026-05-02 | fix: rimuove fade-in da .hero-img su home (LCP killer) |

---

## Struttura del codebase

```
/
├── index.html                          ← home (hero + 3 service card + SEO long-form + locations + FAQ + final CTA)
├── lezioni-di-gruppo/index.html        ← palinsesto + classes-container + booking + FAQ
├── lezioni-individuali/index.html      ← landing servizio premium + FAQ
├── yoga-gravidanza-genova/index.html   ← landing SEO ~2000 parole, FAQPage 10 Q
├── chi-sono/index.html                 ← bio + Anukalana + formazione
├── eventi/index.html                   ← grid + modal detail + Event JSON-LD (build-schema.js)
├── contatti/index.html                 ← sedi + OpenStreetMap embed + orari disponibilità
├── blog/index.html                     ← placeholder + template card
├── blog/posts/.gitkeep                 ← cartella per articoli Sara (Decap)
├── privacy-policy/index.html           ← migrata da /privacy.html (301 attivo)
├── termini/index.html                  ← migrata da /termini.html (301 attivo)
├── assets/
│   ├── css/main.css                    ← CSS unificato + 3 @font-face self-hosted
│   ├── js/main.js                      ← JS unificato, ~9KB (caricato con `defer`)
│   └── fonts/                          ← 3 woff2 self-hosted (NUOVO maggio 2026)
│       ├── inter-300-600.woff2         ← 48KB, latin only, variabile 300-600
│       ├── cormorant-400-600.woff2     ← 38KB, latin only, variabile 400-600 normal
│       └── cormorant-italic-400.woff2  ← 23KB, latin only, italic 400 (font-display:optional)
├── classes.json                        ← dati lezioni (gestiti da Sara via Decap)
├── events.json                         ← dati eventi (gestiti da Sara via Decap)
├── robots.txt                          ← allow esplicito a 10 retrieval bot AI
├── sitemap.xml                         ← 10 URL reali
├── llms.txt                            ← briefing strutturato per LLM
├── _redirects                          ← 301 Shopify legacy + App v2 + privacy/termini
├── build-schema.js                     ← Node script: inietta Event JSON-LD da events.json
├── netlify.toml                        ← build: "npm install && node build-schema.js"
├── package.json                        ← deps: @netlify/blobs, resend
├── admin/
│   ├── config.yml                      ← Decap CMS config (con collection blog)
│   └── index.html                      ← Decap entry point — INTOCCABILE
├── netlify/functions/
│   └── book.js                         ← logica booking + Resend — INTOCCABILE
├── img/                                ← foto sito
│   ├── 1-640.webp                      ← hero home mobile (22KB)
│   ├── 1-1080.webp                     ← hero home desktop/retina (43KB)
│   ├── 2-512.webp                      ← about ritratto mobile (73KB)
│   ├── 2-1024.webp                     ← about ritratto desktop (156KB, q60)
│   ├── 3-640.webp                      ← chi-sono/individuali/gravidanza mobile (21KB)
│   ├── 3-1080.webp                     ← chi-sono/individuali/gravidanza desktop (40KB)
│   ├── 4-960.webp                      ← lezioni-di-gruppo palinsesto mobile (34KB)
│   ├── 4-1440.webp                     ← lezioni-di-gruppo palinsesto desktop (52KB)
│   ├── 5.png                           ← logo originale 500×500 (33KB) — usato SOLO in JSON-LD logo URL
│   ├── 5-240.webp                      ← logo visibile in pagina 240×240 (6.7KB)
│   └── orig/                           ← backup pre-compressione (gitignored, vedi .gitignore)
└── uploads/                            ← media CMS Decap
```

---

## Architettura del sito (3 pilastri + home)

**Commerciale**: `/lezioni-di-gruppo/`, `/lezioni-individuali/`, `/yoga-gravidanza-genova/`
**Identitario + utility**: `/chi-sono/`, `/eventi/`, `/contatti/`
**Content**: `/blog/` (+ collection Decap pronta, rendering articoli da implementare)
**Home**: `/` — 11 sezioni: hero, foto, trust-bar, 3 service-card (gruppo/individuale/gravidanza-highlight), SEO long-form 4 H3, locations grid, FAQ accordion 4Q, final CTA WhatsApp.

`/yoga-gravidanza-genova/` è la pagina commerciale più importante — specializzazione formale di Sara, bassa competizione locale, FAQPage con 10 domande candidata a rich snippet Google.

---

## Identità del business

```
Brand: SaraMore Yoga
Titolare: Sara Maggiori
P.IVA: 02988280992
Sede legale: Via Bixio 2, 16128 Genova GE, IT
Sede operativa principale: Studio Equilibra, Piazza Galeazzo Alessi 2/3, 16128 Genova GE (Carignano)
Sede operativa secondaria: Dojo Jakukai, Via Fieschi 20, Genova
Coordinate GPS Studio Equilibra: 44.4026216, 8.9385083 (verificate via Nominatim)
Email: sara@saramoreyoga.com
Telefono/WhatsApp: +39 373 773 5552
Anno inizio attività: 2019
Lingua insegnamento: solo italiano
Categoria GBP: Insegnante di yoga (creato e in attesa verifica)
Categoria schema.org: ["LocalBusiness", "HealthAndBeautyBusiness"] (founder = Person Sara Maggiori)
Google Site Verification: M94JaFm0WuOHCsYHza67R7moak7UWUXmkqrs6HVyhec

Profili social:
- Instagram: https://www.instagram.com/saramoreyoga/
- Facebook: https://www.facebook.com/saramoreyoga/

Formazione di Sara:
- Scuola: Samadhi S.s.d.r.l. (formazioneyoga.it, sede Firenze)
- Approccio: Anukalana Yoga (sviluppato da Jacopo Ceccarelli)
- Specializzazioni: Yoga in Gravidanza, Anukalana Yoga
- Riconoscimenti scuola: CONI, Yoga Alliance, conforme Norma UNI Insegnante di Yoga
```

**Importante: niente prezzi pubblici sul sito.** Sara preferisce che chi è interessato contatti via WhatsApp per il preventivo. Quindi nelle pagine commerciali e negli schema **niente** `<Offer price>` numerici (`priceRange: "€€"` è OK, è una fascia astratta). CTA sempre tipo "Contattami su WhatsApp per info e prezzi".

---

## Stack tecnico

- **HTML5 statico** (no framework). Niente Astro/React/Next/bundler. Resta HTML + CSS + JS vanilla.
- **Hosting**: Netlify, deploy automatico al `git push origin main`. Build step minimo: `npm install && node build-schema.js`.
- **Decap CMS** via Netlify Identity + Git Gateway (login: `/admin/`).
- **Netlify Functions**: `book.js` (logica prenotazione classes).
- **Netlify Blobs**: storage prenotazioni.
- **Resend**: invio email conferma.
- **Font self-hostati** in `/assets/fonts/` (NESSUNA dipendenza esterna da Google Fonts da maggio 2026).
- **PWA**: manifest + banner installazione (showBanner via `requestIdleCallback`).

---

## Vincoli rigidi (sempre validi)

### NON toccare

- `netlify/functions/book.js` (logica prenotazione, in produzione)
- `classes.json` e `events.json` (dati di Sara, gestiti da Decap)
- `admin/index.html` (entry Decap)
- `img/` esistenti e `uploads/` (asset)
- `assets/fonts/` (font self-hostati, vedi sezione "Performance")
- Palette CSS, font, identità visiva (Cormorant Garamond + Inter, palette earthy: `--bg #FAF7F2`, `--sage #7C8B6F`, `--terracotta #C08B6B`, `--dark #2A2A28`)
- Logica JS funzionante: `loadClasses()`, `loadEvents()`, `submitBooking()`, PWA banner, fade-in observer
- Modal booking, modal event detail
- WhatsApp button flottante, link Stripe in eventi
- Tag `<img>` con dimensioni width/height esplicite (servono per CLS = 0)
- `font-display: optional` su Cormorant italic (ridotto critical request chain, vedi sezione Performance)

### Nessun framework nuovo

Niente Astro, React, Next, bundler. Resta HTML + CSS + JS vanilla. Deploy static su Netlify. Nessuna dipendenza runtime aggiunta.

---

## Convenzioni di sviluppo

### Opzione A: markup duplicato (no partial)

Header, menu overlay, footer, WhatsApp button e PWA banner sono **duplicati identici** in ogni pagina HTML (~80 righe ripetute × 10 pagine). Decisione esplicita per evitare ogni rischio di rottura del workflow Decap. Se serve cambiare un link nel menu, modificare in 10 file (operazione rara, accettabile per sito di questa dimensione).

### `<head>` boilerplate per ogni pagina

Ogni nuova pagina deve avere, **nell'ordine**:
1. `<meta charset>`, `<meta viewport>`
2. `<title>` unico, `<meta name="description">`
3. `<link rel="canonical">`
4. OG tags (`og:type`, `og:title`, `og:description`, `og:url`, `og:image`, `og:locale="it_IT"`, `og:site_name="SaraMore Yoga"`)
5. `twitter:card="summary_large_image"`
6. `theme-color="#FAF7F2"`, favicon, apple-touch-icon
7. `<meta name="google-site-verification" content="M94JaFm0WuOHCsYHza67R7moak7UWUXmkqrs6HVyhec">`
8. Preload immagine hero (se la pagina ne ha una)
9. Preload font: `inter-300-600.woff2` + `cormorant-400-600.woff2` (NO italic, è optional)
10. `<link rel="stylesheet" href="/assets/css/main.css">` (blocking — IMPORTANTE: NON usare `media="print" onload` trick perché causava CLS, vedi changelog `82325b3`)
11. FontAwesome con `media="print" onload="this.media='all'"` + `<noscript>` fallback (non blocking, accettabile perché icone sono decorative)
12. Netlify Identity widget: SOLO su `/` (home) — necessario per il flow di invito. Rimosso da tutte le altre pagine (commit `cfe855a`).
13. JSON-LD schema.org `<script type="application/ld+json">`

### Pattern preload font (in tutte le 10 pagine)

```html
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/inter-300-600.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/cormorant-400-600.woff2" crossorigin>
```

NON preloadare `cormorant-italic-400.woff2` — è `font-display: optional` di proposito.

### Pattern preload immagine hero (esempi)

Home:
```html
<link rel="preload" as="image" href="/img/1-1080.webp"
      imagesrcset="/img/1-640.webp 640w, /img/1-1080.webp 1080w"
      imagesizes="(max-width: 768px) 100vw, 900px"
      fetchpriority="high">
```

Sub-pagine con foto 3 (chi-sono, individuali, gravidanza): usare `3-640` / `3-1080`.
Sub-pagina lezioni-di-gruppo (immagine palinsesto): usare `4-960` / `4-1440`.

### Pattern `<img>` con responsive srcset

Hero above-the-fold (NO `loading=lazy`, SI `fetchpriority=high`):
```html
<img src="/img/1-1080.webp"
     srcset="/img/1-640.webp 640w, /img/1-1080.webp 1080w"
     sizes="(max-width: 768px) 100vw, 900px"
     alt="..."
     width="1080" height="1907"
     fetchpriority="high"
     decoding="async">
```

Foto below-the-fold (about, card secondarie):
```html
<img src="/img/2-1024.webp"
     srcset="/img/2-512.webp 512w, /img/2-1024.webp 1024w"
     sizes="(max-width: 768px) 100vw, 450px"
     alt="..."
     width="1024" height="1365"
     loading="lazy" decoding="async">
```

**Logo header in tutte le pagine** (240×240 webp, 6.7KB):
```html
<img src="/img/5-240.webp" alt="SaraMore Yoga" width="240" height="240" fetchpriority="high">
```

Su privacy-policy e termini il logo è senza `fetchpriority` (pagine `noindex`).

### JSON-LD schema.org

Ogni pagina ha JSON-LD nel `<head>`. Usare `@id` per cross-reference:
- Person Sara → `https://saramoreyoga.com/#sara`
- Business → `https://saramoreyoga.com/#business`
- Website → `https://saramoreyoga.com/#website`

**ATTENZIONE schema type**: usare `["LocalBusiness", "HealthAndBeautyBusiness"]`. **NON** `YogaStudio` (non è un type formalmente definito su schema.org → errore validatore). Fix applicato in tutte le 6 pagine commerciali/identità.

Tipi usati:
- **LocalBusiness + HealthAndBeautyBusiness** ovunque (almeno la versione minima con address e geo)
- **Person** (Sara) su home + chi-sono + gravidanza
- **Service** su lezioni-di-gruppo, lezioni-individuali, yoga-gravidanza-genova
- **FAQPage** su home (4Q), lezioni-di-gruppo (4Q), lezioni-individuali (5Q), yoga-gravidanza-genova (10Q)
- **ProfilePage** su chi-sono
- **ContactPage** su contatti
- **Blog** su /blog/
- **Event** su /eventi/ (generati da `build-schema.js`)
- **CollectionPage** su /eventi/ (statico)

**Niente `inLanguage`** su tipi LocalBusiness (non è una property valida → warning validatore). Solo su pagine (`@type: WebPage`/`ContactPage`/...).

Privacy/termini hanno `<meta name="robots" content="noindex, follow">` (no JSON-LD).

### `build-schema.js` (mini build step)

Script Node che gira al deploy Netlify. Legge `events.json` e per ogni evento attivo con data parsabile in italiano (es. "27 Febbraio - Ore 18:00") inietta uno `<script type="application/ld+json">` di tipo Event nei marker `<!-- BUILD:EVENTS:START -->` / `<!-- BUILD:EVENTS:END -->` di `eventi/index.html`.

Idempotente: se non ci sono eventi attivi o parsabili, il blocco viene svuotato senza errore. Quando Sara aggiunge un evento via Decap, il prossimo deploy genera automaticamente lo schema.

Hint per Sara nella UI Decap: per il riconoscimento automatico, includere giorno + mese in italiano e — se possibile — orario nel formato "Ore HH:MM" o "HH:MM". Anno opzionale (default = anno corrente).

Riferimenti nel codice:
- `MONTHS_IT` mapping mesi italiani → numeri
- `parseItalianDate(input, fallbackYear)` parser lenient
- `locationToSchema(loc)` riconosce "Equilibra" e "Jakukai" e mappa su PostalAddress completo

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

Il bottone "Chiudi" del menu overlay è un `<button>` con `class="menu-link menu-close"` — NON un `<a href="javascript:void(0)">` (causava warning Lighthouse "non-crawlable link").

### Mappa contatti (sede operativa)

Embed **OpenStreetMap** (no API key, no Google Maps Platform):

```html
<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=8.9355%2C44.4006%2C8.9415%2C44.4046&layer=mapnik&marker=44.4026216%2C8.9385083"
        title="Studio Equilibra - Piazza Alessi 2/3, Genova"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"></iframe>
```

Sotto, link "Apri in Google Maps →" come deep link `https://www.google.com/maps/search/?api=1&query=...`. Mai embed Google Maps con API key (era il vecchio bug).

### Hash anchor SPA legacy

I deep link tipo `/#orari`, `/#chisono` ricevuti via Instagram/WhatsApp non possono essere gestiti da Netlify (gli hash non arrivano al server). Andrebbero gestiti in `assets/js/main.js` con un fallback all'inizio (mappa hash → URL reali). **Attualmente non implementato.**

### `_redirects` (Netlify)

Mapping completo dei 3 layer di archeologia digitale:
1. **Shopify legacy** — `/products/*` → `/lezioni-individuali/`, `/services/*` → `/`
2. **App v2 dismessa** — `/auth/*` → `/contatti/`, `/events/*` → `/eventi/`, `/legal/*` → `/contatti/`, ecc.
3. **Migrazione SPA → multi-pagina** — `/privacy.html` → `/privacy-policy/`, `/termini.html` → `/termini/`

ATTENZIONE: `/classes.json` e `/events.json` NON sono nei redirects. Devono restare raggiungibili (li usa il JS via `fetch()`). Sono solo `Disallow:` in `robots.txt` per evitare indicizzazione.

### `robots.txt` AI bot allow

Allow esplicito a: OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Claude-SearchBot, Claude-User, ClaudeBot, GPTBot, Google-Extended, Applebot-Extended.
Disallow: `/admin/`, `/uploads/`, `/classes.json`, `/events.json`, `/.netlify/`.

---

## Performance (snapshot 2 maggio 2026 dopo intervento intensivo)

### Numeri PSI mobile (https://saramoreyoga.com/)

| Metrica | Prima | Dopo (post `5a22319`) | Target |
|---|---|---|---|
| Performance score | ~50 | atteso ~90+ | 90+ |
| FCP | 2.9s | atteso ~1.5s | <1.8s ✅ |
| LCP | 4.4s | atteso ~1.8s | <2.5s ✅ |
| TBT | n/a | 0ms ✅ | <200ms |
| CLS | n/a | 0 ✅ | <0.1 |
| Speed Index | 4.6s | atteso ~3.0s | <3.4s |
| Critical chain max | 1441ms → 818ms → atteso ~600ms | | |

PSI desktop: 98.

### Interventi applicati

1. **Self-hosted fonts** (commit `a3256fc`):
   - 3 woff2 latin-only in `/assets/fonts/`
   - 2 preloaded in `<head>` (Inter + Cormorant normal)
   - Italic Cormorant: `font-display: optional` (commit `ee54d1b`) — il browser lo carica solo se disponibile entro ~100ms su mobile lento, altrimenti fallback a serif italic di sistema
   - Eliminata dipendenza Google Fonts (~750ms di latenza rimossi dal critical chain)

2. **Immagini** (commit `a3256fc`):
   - Logo `5.png` 33KB → `5-240.webp` 6.7KB (240×240, retina su display @120px)
   - `2-1024.webp` ricompresso q60: 217KB → 156KB
   - Tutte le hero usano responsive srcset 640w/1080w (foto 1, 3) o 960w/1440w (foto 4)
   - File `5.png` mantenuto perché citato come `logo` nei JSON-LD (è la URL ufficiale per Google Knowledge Panel)

3. **JS** (commit `cfe855a` + `ee54d1b`):
   - Rimosso codice SPA morto: `showHome`, `showPage`, `hideAll`, popstate handler, `loadFromHash` (-35 righe)
   - Init via `DOMContentLoaded` (era `window.load`)
   - `showBanner` wrappato in `requestIdleCallback`
   - `<script defer>` su tutte le 10 pagine
   - Netlify Identity widget rimosso da 7 sub-pagine (mantenuto solo su `/` per il flow invito)

4. **Hero LCP fix** (commit `5a22319`):
   - Rimosso `class="fade-in"` dal `<div class="hero-img">` su home
   - **Lezione**: il pattern `.fade-in { opacity: 0; transition: 0.8s; }` su elementi above-the-fold ritarda l'LCP misurato (Lighthouse aspetta che la transizione finisca). Mai usare `fade-in` su elementi LCP-candidate.

5. **Crawlability** (commit precedente):
   - Bottone "Chiudi" del menu overlay convertito da `<a href="javascript:void(0)">` a `<button>` (warning Lighthouse risolto)

### Tentativi falliti (NON ripetere)

**Critical CSS inline + main.css async** (commit `a3256fc`, revertito in `82325b3`): tentato pattern `<link rel="stylesheet" href="/assets/css/main.css" media="print" onload="this.media='all'">` con critical CSS inline. **Causava CLS massivo** perché il critical CSS non copriva `img{max-width:100%}`, `.locations-grid`, `.services-grid`: prima del load di main.css le immagini renderizzavano a dimensione intrinseca (1080×1907!) → layout shift catastrofico. PSI sceso da 70 a 67. Riportato a `main.css` blocking.

Se in futuro si vuole riprovare: il critical CSS DEVE includere TUTTI i selettori che vincolano le dimensioni di elementi above-the-fold, non solo header/hero/typography.

---

## Aperto / da fare in futuro

### Rendering pagine articolo blog

La collection `blog` Decap è configurata in `admin/config.yml`: Sara può scrivere articoli da `/admin/` → "Blog (articoli)". Ogni articolo finisce in `/blog/posts/<YYYY-MM-DD>-<slug>.md` con frontmatter (title, date, published, summary, cover, tags, body).

**Non è ancora implementato il rendering HTML degli articoli.** Quando Sara avrà 2-3 articoli pubblicati, aggiungere uno step a `build-schema.js` (o un nuovo `build-blog.js`) che:
1. Legge tutti i `.md` in `blog/posts/` con `published: true`
2. Genera `/blog/<slug>/index.html` per ogni articolo (markdown → HTML, frontmatter → meta + JSON-LD `BlogPosting`)
3. Aggiorna `/blog/index.html` rimpiazzando `.blog-empty` con la grid di card popolata
4. Aggiorna `sitemap.xml` con le URL articoli

Per ora `/blog/index.html` mostra il messaggio "I primi articoli sono in scrittura".

### Cleanup ulteriore

- **Hash anchor legacy**: aggiungere all'inizio di `main.js` un IIFE che redirige `/#orari` → `/lezioni-di-gruppo/`, `/#chisono` → `/chi-sono/`, ecc.
- **FontAwesome eliminazione**: usiamo solo ~30 icone su ~7000. Sostituire con SVG inline risparmierebbe ~80KB.
- **`fade-in` review**: verificare che nessun altro elemento above-the-fold su altre pagine (`chi-sono/.profile-img`, `lezioni-individuali/.hero-img`, ecc.) abbia il problema dell'LCP killed da fade-in. Su mobile la pagina `/yoga-gravidanza-genova/` potrebbe avere lo stesso pattern.
- **Forced reflow** ~70ms: probabilmente IntersectionObserver. Accettabile per ora.

### Ottimizzazioni future SEO

- Sitemap automatica (anziché file statico) basata sull'enumerazione delle directory
- Web Vitals monitoring (RUM con Vercel Analytics o simili)
- Schema.org `Review` se Sara raccoglierà testimonianze pubbliche
- GBP (Google Business Profile) — creato come "Insegnante di yoga", in attesa di verifica. Quando verificato, linkare in footer e su `/contatti/`.

---

## Note operative

- **Quando in dubbio, chiedi a Giuseppe** prima di prendere decisioni grosse.
- **Privilegia conservazione**: se devi scegliere tra "modificare X" e "lasciare X com'è", lascia.
- **Italiano fluido**, non tradotto. No anglicismi gratuiti tipo "booking" — usa "prenotazione".
- **Tono di Sara**: gentile, presente, pratica. Non motivazionale-spirituale-vacua. ("Non insegno posizioni perfette. Insegno a stare bene nel proprio corpo, con il proprio respiro.")
- **Dati intoccabili**: `classes.json`, `events.json`, P.IVA, indirizzo, telefono. Mai inventare.
- **Niente prezzi pubblici** mai. CTA WhatsApp invece.
- **Niente embed reel/social**: scelta esplicita di Giuseppe. Solo `<a>` testuali con icona a Instagram/Facebook.
- **Footer**: copyright "© 2026 SaraMore Yoga di Sara Maggiori" + P.IVA + sede legale + link a tutte le pagine + privacy/termini.
- **Ogni intervento performance va misurato con PSI mobile prima e dopo**. Non assumere un guadagno: misuralo.
- **Push autorizzazione esplicita**: Giuseppe autorizza ogni push. Mai pushare senza "vai"/"push"/"pusha"/"commit".

---

## Comandi utili

### Sviluppo locale

```bash
# Server statico locale per testare le pagine
python3 -m http.server 8765
# poi apri http://localhost:8765

# Esegui build-schema.js manualmente (per testare modifiche allo script)
node build-schema.js

# Validazione JSON-LD + meta su tutte le pagine
python3 - <<'PY'
import re, json, os
from pathlib import Path
PAGES = ["index.html", "lezioni-di-gruppo/index.html", "lezioni-individuali/index.html",
         "yoga-gravidanza-genova/index.html", "chi-sono/index.html", "eventi/index.html",
         "contatti/index.html", "blog/index.html", "privacy-policy/index.html", "termini/index.html"]
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
# Da brew install webp se non disponibile
cwebp -q 75 -m 6 input.jpg -resize 1080 0 -o output-1080.webp
cwebp -q 60 -m 6 input.jpg -resize 1024 0 -o output-1024.webp  # q=60 per ritratti grandi
cwebp -q 90 -m 6 logo.png -resize 240 240 -o logo-240.webp     # q=90 per logo (qualità alta)
```

### Verifiche post-deploy

```bash
# Tutte le pagine devono tornare 200
for path in / /lezioni-di-gruppo/ /lezioni-individuali/ /yoga-gravidanza-genova/ \
            /chi-sono/ /eventi/ /contatti/ /blog/ /privacy-policy/ /termini/; do
  echo "[$(curl -s -o /dev/null -w '%{http_code}' https://saramoreyoga.com$path)] $path"
done

# Tutti i redirect 301 devono deviare correttamente
for url in /products/test /auth/signup /events/cmf123 /legal/privacy-policy /book /privacy.html /termini.html; do
  curl -sI "https://saramoreyoga.com$url" | head -3
done

# Font self-hostati raggiungibili
for f in inter-300-600 cormorant-400-600 cormorant-italic-400; do
  echo "[$(curl -s -o /dev/null -w '%{http_code}' https://saramoreyoga.com/assets/fonts/$f.woff2)] $f.woff2"
done

# Config files
curl -s https://saramoreyoga.com/llms.txt | head
curl -s https://saramoreyoga.com/robots.txt
curl -s https://saramoreyoga.com/sitemap.xml | grep '<loc>' | wc -l   # deve essere 10
```

### Validatori esterni

- Schema.org: https://validator.schema.org/
- Google Rich Results: https://search.google.com/test/rich-results
- PageSpeed Insights: https://pagespeed.web.dev/analysis/https-saramoreyoga-com (mobile + desktop)
- Lighthouse: DevTools → Lighthouse → SEO + Performance

### Decap CMS

Login: `https://saramoreyoga.com/admin/` (Netlify Identity). Da qui Sara può:
- Modificare lezioni in `classes.json`
- Modificare eventi in `events.json` (genererà JSON-LD Event automaticamente al deploy successivo)
- Scrivere articoli del blog (salvati in `blog/posts/*.md` ma non ancora renderizzati come pagine HTML — vedi "Aperto" sopra)

---

## Contesto strategico

Sara fa ~2.500€/mese con 50 clienti attivi, modello "insegnante ospite". Il tetto fisico del modello è ~4.000€. Per crescere sopra serve visibilità nuova → SEO + AI search + GBP. Prima della trasformazione il sito era invisibile a Google (2 pagine indicizzate su 42 URL note, 20 click in 3 mesi). Con la nuova struttura ogni pagina è una porta che intercetta una query specifica, ogni schema è una citazione potenziale in ChatGPT/Claude/Perplexity, la pagina gravidanza è la singola URL con il più alto ritorno potenziale (servizio premium, bassa competizione locale, alto intent).

Il successo si misura in mesi (3-6) su: impressioni in GSC, posizioni medie per "yoga Genova", "yoga gravidanza Genova", "lezioni yoga Carignano", citazioni in risposte AI, contatti WhatsApp generati dal sito.

---

## Glossario rapido per chi prende in mano il progetto

| Termine | Cosa è |
|---|---|
| **Decap** | CMS git-based per Sara (era Netlify CMS). Login via Netlify Identity. |
| **Anukalana** | Approccio yoga di Sara, "integrazione" — adatta yoga al corpo, non viceversa. |
| **Studio Equilibra** | Sede operativa principale, Piazza Alessi 2/3, Genova Carignano. |
| **Dojo Jakukai** | Sede operativa secondaria, Via Fieschi 20. |
| **GBP** | Google Business Profile (creato, in attesa verifica). |
| **GSC** | Google Search Console. |
| **PSI** | PageSpeed Insights. |
| **CLS / LCP / TBT / FCP** | Core Web Vitals: layout shift, largest contentful paint, total blocking time, first contentful paint. |
| **font-display: optional** | Browser carica il font solo se arriva entro ~100ms; altrimenti fallback definitivo (no swap, no CLS). Usato per Cormorant italic. |
| **fetchpriority** | Hint browser per prioritizzare risorse critiche above-the-fold. |
| **build-schema.js** | Script Node che inietta Event JSON-LD in eventi/index.html al deploy Netlify. |
