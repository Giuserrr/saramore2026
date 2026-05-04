# saramoreyoga.com — Documentazione del progetto

> Sito di **Sara Maggiori** (brand: **SaraMore Yoga**), insegnante di yoga a Genova. In produzione su Netlify, dominio canonico **`https://saramoreyoga.com`** (no www). Sito multi-pagina, ottimizzato SEO + crawlable da AI, gestibile da Sara via Decap CMS.

## Stato attuale (4 maggio 2026)

Il sito ha superato due fasi di lavoro:

- **Fase 1 (2 maggio 2026)** — Trasformazione del monolite SPA in multi-pagina (10 URL indicizzabili) + ottimizzazione performance (PSI mobile da ~50 a ~90 atteso). Tutti i commit della fase 1 nella tabella sotto.
- **Fase 2 — Sprint 1 (4 maggio 2026)** — Refactor alberatura: 5 nuove pagine pillar/landing in `noindex,follow` con scheletro + JSON-LD completo + integrazione GBP cross-page. Vedi sezione "Sprint roadmap" sotto.

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
| `04a7148` | 2026-05-02 | docs: CLAUDE.md aggiornato con stato dell'arte completo (516 righe) |
| `960d38f` | 2026-05-02 | seo: aggiunge sameAs Wikidata in schema.org JSON-LD (Q139618286 + Q139618479) |
| `[Sprint 1 — pending push]` | 2026-05-04 | feat: 5 nuove pagine pillar/landing (noindex) + footer Approfondimenti su 13 pagine + GBP integrato + placeholder content style |
| `[Sprint 1.1 — pending push]` | 2026-05-04 | feat: contenuti completi + pubblicazione `/yoga-in-gravidanza/` (noindex rimosso, sitemap aggiornata, +1 URL = 11) + nuovi pattern CSS `.long-form` + `.trimestre-section` per pillar pages |
| `[Sprint 1.2 — pending push]` | 2026-05-04 | feat: pubblicazione `/anukalana-yoga/` (12 URL) + `/yoga-genova-prezzi/` (13 URL, con listino 2026 pubblico + 18 Offer JSON-LD), nuovo pattern CSS `.price-table`, link "Tutti i prezzi 2026 →" su 3 commerciali (gruppo/individuale/gravidanza), policy prezzi cambiata in CLAUDE.md |
| `[Sprint 1.3 — pending push]` | 2026-05-04 | feat: pubblicazione `/yoga-genova-carignano/` (14 URL, con tabella orari, FAQ logistiche, OSM map) + nuovo pattern CSS `.schedule-table`, eliminazione `/yoga-genova-centro-storico/` (link footer puliti su 12 file) |
| `[Sprint 1.4 — pending push]` | 2026-05-04 | seo: GBP URL canonico `maps.app.goo.gl/GA3Qut4REbwjiaEh8` (era `share.google/...`), coordinate corrette 44.402534/8.938980 (era off ~40m), bbox OSM ricentrato su 12 file HTML + CLAUDE.md |
| `[Sprint 2 — pending push]` | 2026-05-04 | feat: sistema blog backend completo — `build-blog.js` (parser md + renderer articoli/categorie/hub + update sitemap + marker pillar), `admin/config.yml` esteso (category, youtube_url), deps `marked` + `gray-matter`, `netlify.toml` build aggiornato, CSS `.blog-cat-grid` + `.post-*` (~290 righe). YouTube embed opzionale. Test articolo dummy con/senza video → JSON-LD valido (BlogPosting + BreadcrumbList + VideoObject), idempotente, sitemap auto-aggiornata via marker `BUILD:BLOG-URLS:START/END`. |
| `[Sprint 2.1 — pending push]` | 2026-05-04 | fix: tre bug post-pubblicazione primi articoli blog. (1) `marked` v14 ha rimosso `headerIds`/`headerPrefix` → aggiunto helper `injectHeadingIds()` post-process che inietta `id="sec-<slug>"` su h2/h3 (slugify diacritic-safe NFD), così `buildTOC()` può generare il TOC. (2) Fix CSS scope: `header { position: fixed; ... }` (type-selector globale) colpiva anche `<header class="post-header">` dentro `<article>`, schiacciando meta+h1+summary in orizzontale dietro l'header del sito → cambiato in `body > header { ... }`, che colpisce solo l'header di pagina (figlio diretto di body). (3) Fix `buildTOC()` doppio escape: il testo dei heading è già HTML-escaped da `marked`, ri-escape via `escapeHtml()` produceva `&amp;quot;` (browser mostrava `&quot;` letterale) → rimosso il secondo escape, l'output `&quot;` viene ora correttamente decodificato dal browser come `"`. Bonus: container wrapping ora applicato anche a article + category page (pattern uniforme con resto del sito, `padding-top: 140px` per non finire sotto header fixed). |
| `[Sprint contenuti #1 — pending push]` | 2026-05-04 | feat: pubblicati 3 dei 5 articoli pillar del blog (5 calendarizzati, 3 fatti). Procedura: scheletri md `published: false` predefiniti per i 5 articoli + sblocco progressivo a contenuto pronto. Articoli pubblicati: (a) `/blog/genova/yoga-pilates-genova-differenze/` 3.165 parole 14 min, KW "yoga pilates genova" KD 50, 8 H2 + 10 H3 → TOC, internal linking distribuito 16 link verso pillar/landing. (b) `/blog/anukalana/yoga-somatico/` 4.106 parole 19 min, KW "yoga somatico" 720 vol, 7 H2 → TOC, citazioni oneste a [yogasomatico.it](https://www.yogasomatico.it/) (Laura, founder Yoga Somatico®) ×7, marker `BUILD:BLOG-ANUKALANA` popolato su pillar. (c) `/blog/pratica/posizione-del-piccione-yoga/` 3.884 parole 18 min, KW "posizione del piccione yoga", 7 H2 → TOC. Tutti gli articoli: BlogPosting + BreadcrumbList JSON-LD validi, niente VideoObject (no YouTube ancora). Cover provvisorie ruotando 4 foto Sara esistenti in `/img/`. |
| `[Sprint contenuti #2 — pending push]` | 2026-05-04 | feat: pubblicato il 4° articolo `/blog/salute/come-iniziare-a-meditare/` (~2.200 parole, ~10 min reading time, KW "come iniziare a meditare", 8 H2 → TOC). Sitemap auto-aggiornata a 22 URL (+ categoria `/blog/salute/` + articolo). Internal linking: pillar Anukalana (richiamo allo stile), pagina /eventi/ ×2 (CTA verso appuntamento mensile yoga + meditazione con Francesca, tema Mettā / Loving Kindness). External: nessun link uscente (apps citate testualmente — scelta di non far uscire il lettore). Encoding fix riusato: trick latin-1→utf-8 + sentinels (__BUBBLE__, __EMDASH__, __METTA__, __VIPASSANA__, __THERAVADA__, __DHYANA__, __PATANJALI__) + post-fix targeted: 18 frecce mojibake reinterpretate come em-dash (separatore parentetico italiano), 1 sola freccia preservata nel CTA WhatsApp finale. Articolo #1 (gravidanza) resta unico scheletro `published: false`. |
| `[Sprint blog 404-safe — pending push]` | 2026-05-04 | fix: blog chiuso senza 404 finché manca l'articolo gravidanza. (1) `renderHub()` di `build-blog.js` aggiornato: card categoria con `count === 0` ora renderizzata come `<div class="blog-cat-card blog-cat-card-empty" aria-disabled="true">` invece che `<a href>`, evitando il link rotto a `/blog/gravidanza/` (categoria non ha articoli → pagina non esiste). Switch automatico al cliccabile quando arriva il primo articolo (logica self-healing). (2) Nuovi stili CSS `.blog-cat-card-empty` (`opacity: 0.6`, `cursor: not-allowed`) + override hover (no transform/shadow/border). (3) Verifica completa URL referenziate: 4 pagine categoria + 4 articoli + pillar gravidanza con marker fallback "I primi articoli ... saranno pubblicati a breve" (già presente in `updatePillarMarker()` per posts.length === 0). Niente 404 attivi sul sito al deploy. |
| `[Sprint AI-crawler — pending push]` | 2026-05-04 | seo: aggiornati `llms.txt` + `sitemap.xml` per attrarre crawler AI prima del go-live. (1) `llms.txt` rewrite completo: aggiunte sezione "Identità del business" con Wikidata Q-IDs + GBP URL (entity disambiguation per LLM), 4 pagine pillar/landing (yoga-in-gravidanza, anukalana-yoga, yoga-genova-prezzi, yoga-genova-carignano), policy prezzi pubblica con listino sintetico, 5 cluster tematici blog con articoli pubblicati, query rilevanti enumerate (~10), risorse machine-readable (sitemap, robots, JSON-LD). Fonte canonica esplicita per query "yoga Genova", "Anukalana", "yoga gravidanza Genova", "Sara Maggiori". (2) `sitemap.xml` riordinata logicamente in 7 blocchi commentati (home, commerciali, pillar, landing locali, identità+utility, blog hub, legali) + lastmod aggiornati a 2026-05-04 su tutte le 12 pagine indicizzabili (footer aggiornato il 4 maggio). Priority articoli blog bumped 0.6→0.7 (long-form merita più di pagine categoria) — modificato `build-blog.js:postUrls`. Totale 22 URL, XML valido. |

---

## Sprint roadmap (refactor alberatura, blog, video YouTube)

Vedi `PROMPT_CLAUDE_CODE_alberatura_blog.md` (fonte completa, prompt strategico).

### Sprint 1 (4 maggio 2026) — fatto, in attesa push

**Scope**: creare l'infrastruttura HTML/CSS/SEO delle 5 nuove pagine + footer cross-page + integrazione GBP, **senza scrivere il contenuto editoriale** e **senza toccare le pagine esistenti che oggi funzionano**.

**5 nuove pagine create** (4 ancora in `noindex, follow` finché placeholder):

| Path | Tipo | Schema.org | Stato |
|---|---|---|---|
| `/yoga-in-gravidanza/` | Pillar nazionale | Article + FAQPage (10 Q reali) + BreadcrumbList | **PUBBLICATA 2026-05-04** — contenuti completi (~3.500 parole), 0 placeholder, in sitemap, indicizzabile |
| `/anukalana-yoga/` | Pillar (oceano blu, KD 40) | Article + FAQPage (5 Q reali) + Person + BreadcrumbList | **PUBBLICATA 2026-05-04** — 7 sezioni complete + 5 FAQ, 0 placeholder, in sitemap, indicizzabile |
| `/yoga-genova-prezzi/` | Landing locale (KD 22) | Service (18 Offer) + FAQPage (5 Q reali) + LocalBusiness + BreadcrumbList | **PUBBLICATA 2026-05-04** — listino completo + 5 sezioni + 5 FAQ, 0 placeholder, in sitemap, indicizzabile |
| `/yoga-genova-carignano/` | Landing locale | Service + LocalBusiness + BreadcrumbList + FAQPage (6 Q reali) + OSM map | **PUBBLICATA 2026-05-04** — 6 sezioni + 6 FAQ logistiche + tabella orari, 0 placeholder, in sitemap, indicizzabile |
| ~~`/yoga-genova-centro-storico/`~~ | — | — | **ELIMINATA 2026-05-04** (decisione: non si è rivelata sostenibile come landing locale separata; pagina e directory rimosse, link footer puliti su 13 file) |

**Pattern noindex**: ogni nuova pagina ha `<meta name="robots" content="noindex, follow">` + commento `<!-- TODO: rimuovere noindex quando contenuto pubblicato -->`. `follow` permette a Google di scoprire i link interni alle pagine indicizzate. Per togliere il noindex in massa quando i contenuti sono pronti: `grep -rn "TODO: rimuovere noindex" .`

**Pattern placeholder**: ogni sezione "da scrivere" è marcata con `<div class="placeholder-section">` (stile giallo evidente in pagina) + meta tag `[Da scrivere — Tipo]` + descrizione di cosa va scritto + target parole. Stile CSS aggiunto in fondo a `assets/css/main.css`. Indica anche quando il blocco JSON-LD `FAQPage` in `<head>` ha solo 2 Q dummy e va popolato col contenuto finale.

**Pattern CSS pillar pages** (introdotti 2026-05-04 lavorando su `/yoga-in-gravidanza/`, riusabili sulle altre 4):
- `.long-form` — wrapper sezioni body lunghe: `<p>` con `margin-bottom: 1.15em`, `<h3>` serif 1.55rem con aria, link sage. Sostituisce gli inline style ripetuti `<div style="max-width: 720px; margin: 25px auto; font-size: 0.98rem; line-height: 1.85; color: var(--text);">`. **Da usare sempre nelle pillar pages** al posto degli inline style.
- `.trimestre-section` — pattern card a piena larghezza per sezioni multiple sequenziali (NON grid 3 colonne). Usato per i 3 trimestri della pillar gravidanza. Pattern riusabile per qualunque "X step / Y fasi" su pillar pages quando il contenuto per step è > 100 parole.
- `.long-form .pullquote` — disponibile per pull-quote sage italic grandi a interruzione di sezione lunga.
- **NON usare** `.trimestre-grid` (vecchio pattern 3 card affiancate) per contenuti lunghi: card strette + paragrafi multipli = muro illeggibile. La classe esiste ancora nel CSS per casi futuri ma è deprecata per pillar.

**Scrittura contenuti — convenzioni applicate su `/yoga-in-gravidanza/`** (riferimento per le 4 pagine seguenti):
- **Bold strategici**: 2-3 `<strong>` per paragrafo, su keyword SEO (asana nominati, concetti tecnici, città, settimane chiave) e frasi-ancora che permettono lettura a scansione. ~180 `<strong>` totali / 79 paragrafi sulla pagina pubblicata.
- **`<em>` su asana sanscriti** (es. `<em>Tadasana</em>`, `<em>Marjariasana</em>`, `<em>Baddha Konasana</em>`). Quando l'asana è anche keyword SEO importante: `<strong><em>Asana</em></strong>`.
- **Citazioni scientifiche**: autore + anno (es. "Babbar et al. (2012)") + rivista in `<em>` se presente, no link uscenti.
- **Disclaimer medico**: blocco evidenziato (background `var(--bg-warm)`, border-radius, padding) con `<strong>Una precisazione importante.</strong>` e testo in `font-size: 0.92rem`.
- **Tono Sara**: italiano fluido, prima persona, registro "amica esperta", no spiritualismo vacuo, no overclaim. Esempio firma intro: `<p style="font-style:italic; color:var(--sage); margin-top:25px;">Sara</p>`.

**Footer "Approfondimenti"**: aggiunto a 13 pagine (10 esistenti escluse privacy/termini perché noindex + 5 nuove). Usa classe `.footer-approfondimenti`. Privacy/termini lasciate intatte (footer minimale con solo legali).

**Footer "Sui social"**: nuova mini-row con Instagram + Facebook + **Profilo Google (GBP)** su 13 pagine. Stessa classe.

**Internal linking aggiunto in home**:
- Sezione "Stili che pratico" → riga finale linka a `/anukalana-yoga/`
- Sezione SEO long-form "Yoga in gravidanza" → CTA inline `Guida completa allo yoga in gravidanza →` linka a `/yoga-in-gravidanza/`

**GBP integration** (richiesto da Giuseppe il 4 maggio):
- URL: `https://maps.app.goo.gl/GA3Qut4REbwjiaEh8` (URL canonico Google Maps mobile, valido per Knowledge Graph — sostituisce il vecchio `share.google/...` 4 maggio 2026)
- Aggiunto a `sameAs` di `#business` su `index.html` e `contatti/index.html` (4° elemento, dopo Wikidata)
- Aggiunto come link visibile in `/contatti/` nel blocco social (icona Google)
- Aggiunto al footer "Sui social" su 13 pagine
- **DONE 4 maggio 2026**: sostituito `share.google/LxjIxJfkbdWM0LHAq` con `maps.app.goo.gl/GA3Qut4REbwjiaEh8` su 12 file HTML (15 occorrenze) + CLAUDE.md. Il nuovo URL è il canonico Google Maps mobile, legato al Place ID del business e più stabile per Knowledge Graph e local SEO.

**File modificati Sprint 1**:
- Creati Sprint 1: 5× `<dir>/index.html` (yoga-in-gravidanza, anukalana-yoga, yoga-genova-prezzi, yoga-genova-carignano, yoga-genova-centro-storico) — la 5° eliminata 4 maggio 2026
- Modificati: `index.html` (link pillar + footer), `assets/css/main.css` (placeholder + footer-approfondimenti + breadcrumb), 7× `<dir>/index.html` esistenti per footer Approfondimenti/Social, `contatti/index.html` (sameAs + link visibile GBP)
- **NON modificati**: `yoga-gravidanza-genova/`, `chi-sono/`, `lezioni-di-gruppo/`, `lezioni-individuali/`, `eventi/`, `blog/`, `privacy-policy/`, `termini/` per il body (solo footer aggiornato)
- **NON aggiornati**: `sitemap.xml` (no nuove URL finché noindex), `_redirects`, `netlify.toml`, `package.json`, `llms.txt`

### Sprint 2 (4 maggio 2026) — fatto, in attesa push

**Scope**: sistema blog backend statico completo. Sara può scrivere articoli da Decap (`/admin/`), `build-blog.js` gira al deploy Netlify e materializza tutto in HTML statico.

**Cosa fa `build-blog.js`** (≈600 righe Node.js, no framework):
1. Legge `blog/posts/*.md` (frontmatter via `gray-matter`, body via `marked` GFM on)
2. Filtra `published: true`, valida categoria + title + date, ordina per data desc
3. Estrae `youtube_id` da `youtube_url` (3 pattern: youtu.be / watch?v= / embed/)
4. Per articolo → `/blog/<categoria>/<slug>/index.html` con: meta complete + OG + canonical + JSON-LD `BlogPosting` + `BreadcrumbList` + (se video) `VideoObject` + iframe YouTube responsive 16:9
5. Per categoria con almeno 1 articolo → `/blog/<categoria>/index.html` con CollectionPage + BreadcrumbList + grid card
6. `/blog/index.html` (hub) → 5 card categoria + grid 6 ultimi articoli (oppure empty state se 0 articoli)
7. Aggiorna `sitemap.xml` tra marker `<!-- BUILD:BLOG-URLS:START/END -->` (idempotente, no duplicati)
8. Popola marker `<!-- BUILD:BLOG-GRAVIDANZA:START/END -->` su `/yoga-in-gravidanza/` e `<!-- BUILD:BLOG-ANUKALANA:START/END -->` su `/anukalana-yoga/`

**Decisioni tecniche prese e applicate**:
- Markdown lib: `marked` ^14.0.0 (no markdown-it, no DOMPurify — Sara è l'unica autrice via Decap)
- Frontmatter: `gray-matter` ^4.0.3 (fix necessario: `js-yaml` parsa `date: YYYY-MM-DD` come `Date` object → helper `normalizeDate()` ricostruisce ISO via `getUTCFullYear/Month/Date` per evitare slittamenti timezone)
- GFM tables/footnotes: ON
- TOC auto: SI ma solo se l'articolo ha 4+ heading h2/h3 (helper `buildTOC()` legge gli `id="sec-..."` generati da `marked`)
- Reading time: SI, calcolato a 220 wpm
- YouTube embed: 100% opzionale → senza `youtube_url`, l'articolo non ha `<iframe>` né `VideoObject` JSON-LD. Niente feature obbligata. Quando Sara aprirà il canale YouTube basterà aggiungere il `sameAs` ai 4 punti (commento TODO da iniettare in Sprint successivo o all'apertura canale)

**Pattern CSS introdotti** (`assets/css/main.css` ~290 righe in fondo):
- `.blog-cat-grid` + `.blog-cat-card` — hub categorie (grid responsive con icona FontAwesome + descrizione + count articoli)
- `.blog-card-img-placeholder` — placeholder grafico quando articolo non ha cover né video
- `.blog-card-cat` — badge sage per categoria nelle card
- `.post-container`, `.post-header`, `.post-meta`, `.post-category`, `.post-summary` — header articolo
- `.post-cover`, `.post-video-wrap`, `.post-video`, `.post-video-label` — cover/video responsive 16:9
- `.post-body` — body articolo con stili per h2/h3, blockquote, code, pre, table GFM, immagini
- `.post-toc` — mini-TOC sage italic con border-left
- `.post-tags`, `.post-tag` — pill grigie per tag
- `.post-related` — box terracotta "Approfondisci" che linka alla pillar di riferimento

**Cross-linking automatico**: ogni articolo ha alla fine box "Approfondisci" + CTA WhatsApp che linka alla pillar/landing più rilevante per la categoria:
- gravidanza → `/yoga-in-gravidanza/` (pillar) + CTA `/yoga-gravidanza-genova/` (local)
- anukalana → `/anukalana-yoga/` (pillar) + CTA `/lezioni-di-gruppo/`
- pratica → `/anukalana-yoga/` + CTA `/lezioni-di-gruppo/`
- genova → `/yoga-genova-prezzi/` + CTA `/lezioni-di-gruppo/`
- salute → `/lezioni-individuali/` + CTA `/lezioni-individuali/`

**404-safe sull'hub** (risolto 4 maggio 2026 in `Sprint blog 404-safe`): l'hub `/blog/` mostra sempre tutte e 5 le card categoria, ma quelle con `count === 0` vengono renderizzate come `<div class="blog-cat-card-empty">` (opacity 0.6, cursor not-allowed, no hover) invece di `<a href>`. Switch automatico al cliccabile quando arriva il primo articolo. Stato 4 mag 2026: 4 categorie cliccabili (anukalana, pratica, genova, salute), 1 disabled (gravidanza, in attesa video).

**File modificati Sprint 2**:
- Creato: `build-blog.js`
- Modificati: `admin/config.yml` (3 campi blog: category select 5 opzioni, youtube_url string optional, hint dedicato), `package.json` (deps marked + gray-matter), `netlify.toml` (build: `npm install && node build-schema.js && node build-blog.js`), `assets/css/main.css` (+290 righe blog/post)
- `package-lock.json` rigenerato da `npm install`
- Test eseguiti con 2 dummy (`2026-05-04-test-articolo-base.md` cat:pratica + `2026-05-04-test-articolo-video.md` cat:gravidanza con youtube_url Rickroll), JSON-LD validato, idempotenza verificata, dummy + directory generate puliti dopo verifica

**Da fare ANCORA in Sprint 3** (verifica deploy + opzionale):
- Verifica deploy preview Netlify (`build-blog.js` deve girare senza errori dato che `marked` + `gray-matter` ora sono in `package.json`)
- PSI mobile check post-deploy (target ≥85)
- Aggiornare `llms.txt` con sezione "Cluster tematici" (5 categorie blog)
- Sprint 3 originale ridotto a verifica post-deploy: il rendering articoli/categorie/hub e il sitemap update sono già coperti da `build-blog.js`

### Sprint 3 (in attesa) — Template blog + sitemap + llms.txt + netlify.toml

**Scope**: completare il rendering articoli/categorie, aggiornare config files.

**Da fare**:
1. Template HTML articolo (con/senza YouTube embed responsive 16:9)
2. Template HTML pagina categoria
3. Template HTML hub `/blog/` aggiornato (5 card categoria + grid ultimi 6)
4. Aggiornare `sitemap.xml` con tutte le URL (5 nuove pagine + 5 categorie blog + articoli pubblicati)
5. Aggiornare `llms.txt` con sezione "Cluster tematici"
6. Aggiornare `netlify.toml` (già fatto in Sprint 2 se merge unico)
7. Verifica deploy su URL preview Netlify
8. PSI mobile check (target: ≥85, era ~90 prima refactor)

### Sprint contenuti (parallelo) — scrittura testi

Tu/Sara scrivete i testi per le pagine nuove. Quando una pagina ha contenuto reale completo:
1. Rimuovere `<meta name="robots" content="noindex, follow">` e il commento TODO
2. Aggiungere URL a `sitemap.xml`

**Stato decisioni 4 maggio 2026** (aggiornamento sui piani originali):
- Pagine pillar/landing pubblicate: `/yoga-in-gravidanza/`, `/anukalana-yoga/`, `/yoga-genova-prezzi/`, `/yoga-genova-carignano/` — 4/5 (centro-storico eliminata)
- **Alleggerimento `/yoga-gravidanza-genova/` → SCARTATO**: Giuseppe ha deciso 4 maggio di non procedere con la riscrittura sintetica della landing. La pagina resta com'è (~2000 parole, FAQPage 10 Q, conversion-oriented). Pillar `/yoga-in-gravidanza/` e landing `/yoga-gravidanza-genova/` convivono, registri intenzionalmente diversi (pillar = didattico nazionale, landing = conversion locale). Niente azioni richieste.
- **Alleggerimento `/chi-sono/` → RIMANDATO**: la sezione Anukalana di chi-sono non viene toccata adesso. Decisione di Giuseppe: l'ampliamento di chi-sono si farà a sito finito, in fase di review complessiva. Niente azioni richieste in questo Sprint.

**Articoli blog pubblicati 2026-05-04** (4 dei 5 calendarizzati):

| # | Categoria | Slug | KW principale | Parole | Reading time | Stato |
|---|---|---|---|---|---|---|
| 1 | gravidanza | `come-scegliere-corso-yoga-gravidanza` | corso yoga in gravidanza | — | — | scheletro `published: false` |
| 2 | anukalana | `yoga-somatico` | yoga somatico (720 vol) | 4.106 | 19 min | **PUBBLICATO** |
| 3 | pratica | `posizione-del-piccione-yoga` | posizione del piccione yoga | 3.884 | 18 min | **PUBBLICATO** |
| 4 | genova | `yoga-pilates-genova-differenze` | yoga pilates genova | 3.165 | 14 min | **PUBBLICATO** |
| 5 | salute | `come-iniziare-a-meditare` | come iniziare a meditare | 2.200 | 10 min | **PUBBLICATO** |

URL pubblici: `/blog/<categoria>/<slug>/`. Marker `BUILD:BLOG-ANUKALANA` su pillar Anukalana popolato (1 card articolo). Marker gravidanza vuoto (placeholder italic), si popolerà quando articolo #1 viene sbloccato. Cover provvisorie: foto Sara esistenti in `/img/` (rotazione 4 immagini), da sostituire quando arriveranno scatti professionali — basta cambiare il valore `cover:` nel frontmatter md.

**Procedura per pubblicare un articolo dallo scheletro**:
1. Mantenere lo scheletro `published: false` finché contenuto incompleto.
2. Sostituire body, aggiornare summary se serve.
3. `published: true` → run `node build-blog.js` → l'articolo viene materializzato in `/blog/<cat>/<slug>/index.html`, sitemap auto-aggiornata, marker pillar popolato (gravidanza/anukalana), hub blog rigenerato.
4. **Caratteristica Decap**: Sara potrà editare gli articoli da `/admin/` ("Blog (articoli)") senza scrivere markdown a mano — la collection è già configurata con select categoria + youtube_url opzionale.

**Regola esplicita di Giuseppe** (mantenuta come principio guida per tutto il sito): niente copia letterale tra pillar nazionale e landing locale. Stesso fatto detto in 2 modi diversi sui 2 registri (pillar = didattico, landing = conversion).

**Convenzioni di scrittura articoli blog** (validate sui primi 3 pubblicati):
- **Bold strategici 2-3 per paragrafo** sulle KW SEO + frasi-ancora per scansione.
- **Italic** su asana sanscriti (`*Eka Pada Rajakapotasana*`, `*Savasana*`, `*Vinyasa*`) + termini tecnici stranieri (*Reformer*, *Cadillac*, *core*).
- **Internal linking distribuito** (10-15 link interni per articolo lungo): pillar di riferimento 2-3×, landing locale 2-3×, ancore variate non duplicate.
- **External linking**: usato per citazioni oneste/E-E-A-T (es. yogasomatico.it ×7 nell'articolo yoga somatico, riconoscendo Laura come fonte di riferimento), no backlinking promozionale.
- **H2 ogni 200-400 parole**, H3 dove servono sub-cases. Articolo ~3.000-4.000 parole con 7-8 H2 = sweet spot per ranking + TOC auto.
- **CTA WhatsApp inline** in chiusura body + auto-CTA template alla fine (doppio rinforzo).

**Workflow encoding**: gli articoli arrivano in markdown con mojibake UTF-8→Latin-1 (è → Ã¨, à → Ã , — → â, 💬 → ð¬). Procedura ricorrente: trick `latin-1.encode → utf-8.decode` in Python + 3 sentinel pre-fix per char multi-byte non recuperabili (em-dash, freccia, emoji) + regex contesto-aware per `(letter)�` → à vs `�` → È + normalizzazione NBSP. Script reusabile per i prossimi articoli (vedi `tmp/yoga-somatico-fix.py` pattern).

---

## Struttura del codebase

```
/
├── index.html                          ← home (hero + 3 service card + SEO long-form + locations + FAQ + final CTA)
├── lezioni-di-gruppo/index.html        ← palinsesto + classes-container + booking + FAQ
├── lezioni-individuali/index.html      ← landing servizio premium + FAQ
├── yoga-gravidanza-genova/index.html   ← landing SEO ~2000 parole, FAQPage 10 Q — INVARIATA (alleggerimento scartato 4 mag 2026)
├── chi-sono/index.html                 ← bio + Anukalana + formazione — INVARIATA (rimandata a fine sito)
├── eventi/index.html                   ← grid + modal detail + Event JSON-LD (build-schema.js)
├── contatti/index.html                 ← sedi + OpenStreetMap embed + orari + GBP link (NEW maggio)
├── blog/index.html                     ← placeholder + template card (rifare in Sprint 3)
├── blog/posts/.gitkeep                 ← cartella per articoli Sara (Decap)
├── privacy-policy/index.html           ← migrata da /privacy.html (301 attivo, noindex)
├── termini/index.html                  ← migrata da /termini.html (301 attivo, noindex)
├── yoga-in-gravidanza/index.html       ← NUOVA Sprint 1 (pillar nazionale, noindex finché placeholder)
├── anukalana-yoga/index.html           ← NUOVA Sprint 1 — PUBBLICATA (pillar oceano blu, ~2.500 parole, indicizzabile)
├── yoga-genova-prezzi/index.html       ← NUOVA Sprint 1 — PUBBLICATA (landing prezzi 2026 + 18 Offer JSON-LD, indicizzabile)
├── yoga-genova-carignano/index.html    ← NUOVA Sprint 1 — PUBBLICATA (landing Carignano + OSM + 6 FAQ logistiche, indicizzabile)
[... yoga-genova-centro-storico/ — directory ELIMINATA 4 maggio 2026 ...]
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
├── sitemap.xml                         ← 10 URL reali (NON aggiornato Sprint 1: nuove pagine sono noindex)
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
Coordinate GPS sede operativa Carignano: 44.402534, 8.938980 (verificate dalla scheda GBP Google Maps, 4 mag 2026 — sostituiscono le precedenti Nominatim 44.4026216 / 8.9385083 che erano off di ~40m)
Coordinate GPS Dojo Jakukai (Via Fieschi 20): 44.4058513, 8.9372219 (verificate via Nominatim 2026-05-04)
Email: sara@saramoreyoga.com
Telefono/WhatsApp: +39 373 773 5552
Anno inizio attività: 2019
Lingua insegnamento: solo italiano
Categoria GBP: Insegnante di yoga — VERIFICATO (3 recensioni)
URL GBP: https://maps.app.goo.gl/GA3Qut4REbwjiaEh8 (canonico Google Maps mobile, 4 mag 2026)
Coordinate GBP verificate (visibili nella scheda Maps): 44.402534, 8.938980 — usate per OSM iframe e JSON-LD geo
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

**Policy prezzi (aggiornata 4 maggio 2026 — cambio rispetto alla precedente "niente prezzi pubblici")**: i prezzi sono pubblici **solo** sulla pagina-listino dedicata `/yoga-genova-prezzi/`. Le altre pagine commerciali (`/lezioni-di-gruppo/`, `/lezioni-individuali/`, `/yoga-gravidanza-genova/`) restano CTA WhatsApp + link "Tutti i prezzi 2026 →" verso la pagina-listino. La home, `/chi-sono/` e tutte le altre pagine non parlano di prezzi.

Schema JSON-LD: `Offer` con `price` numerici **solo** sul `Service` di `/yoga-genova-prezzi/` (18 offerte = listino completo, abilita rich snippet "prezzo da X€"). Le altre pagine mantengono `priceRange: "€€"` astratto sul `LocalBusiness`, senza Offer numerici.

Listino 2026 (riferimento): tessera annuale 20€, lezione singola gruppo 20€, mensile 1× 55€, mensile 2× 85€, mensile open 105€, pacchetto 10 gruppo 150€ (val. 6 mesi), individuale singola 55€, individuale prova 30€, pacchetto 4 individuali 195€, pacchetto 8 individuali 375€, gravidanza gruppo singola 22€, gravidanza gruppo mensile 60€, gravidanza individuale singola 50€ (più bassa di individuale standard di proposito — politica accessibilità documentata in pagina), gravidanza individuale prova 35€.

Cambio strategico rispetto alla regola precedente: Sara/Giuseppe hanno deciso 4 maggio 2026 di pubblicare il listino completo perché il mercato genovese è opaco (quasi nessuno espone i prezzi → trasparenza = vantaggio competitivo). Prima lezione gruppo sempre gratuita.

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

### Wikidata sameAs (entity disambiguation per Google KG + LLM)

Le entità business e Sara sono linkate alle rispettive Q-ID Wikidata via `sameAs` (commit `960d38f`):

- **SaraMore Yoga (#business)** → `https://www.wikidata.org/wiki/Q139618286`
- **Sara Maggiori (#sara)** → `https://www.wikidata.org/wiki/Q139618479`

Aggiunti SOLO sui 4 `sameAs` array già esistenti (home `#business` + home `#sara` + chi-sono `#sara` + contatti `#business`). Le pagine con stub `#business` minimale senza `sameAs` (lezioni-*, gravidanza, eventi) NON toccate — Google merge entità via `@id` cross-page.

**Health check trimestrale**: verificare che le pagine Wikidata non siano cancellate per "lack of notability" (Q-ID freschi, rischio non-zero). Se cancellate, rimuovere il `sameAs` corrispondente.

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
<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=8.9360%2C44.4005%2C8.9420%2C44.4045&layer=mapnik&marker=44.402534%2C8.938980"
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
- GBP (Google Business Profile) — **VERIFICATO** con 20 recensioni 5/5 stelle (4 maggio 2026, da 3 a 20 in poche settimane). Linkato come `sameAs` su `#business` (index + contatti) + link visibile in `/contatti/` + footer "Sui social" su 12 pagine. URL canonico (4 maggio 2026): `https://maps.app.goo.gl/GA3Qut4REbwjiaEh8`. Coordinate verificate dalla scheda Maps: **44.402534, 8.938980** (sostituiscono le precedenti 44.4026216, 8.9385083 ottenute da Nominatim — quelle puntavano "a caso", offset di ~40m est).
- **IndexNow** valutato e scartato (Google non partecipa, Bing IT ~3% market share, ROI non giustifica setup). Se in futuro emerge traffico Bing significativo da GSC, riconsiderare.
- **Bing Webmaster Tools** — setup in corso manualmente (submit URL via dashboard) maggio 2026. Quando il workflow è stabile, valutare automazione via Submit URL API.

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
| **GBP** | Google Business Profile — VERIFICATO (20 recensioni 5/5 al 4 mag 2026). URL canonico `https://maps.app.goo.gl/GA3Qut4REbwjiaEh8`. Coordinate verificate Maps: 44.402534, 8.938980. |
| **GSC** | Google Search Console. |
| **PSI** | PageSpeed Insights. |
| **CLS / LCP / TBT / FCP** | Core Web Vitals: layout shift, largest contentful paint, total blocking time, first contentful paint. |
| **font-display: optional** | Browser carica il font solo se arriva entro ~100ms; altrimenti fallback definitivo (no swap, no CLS). Usato per Cormorant italic. |
| **fetchpriority** | Hint browser per prioritizzare risorse critiche above-the-fold. |
| **build-schema.js** | Script Node che inietta Event JSON-LD in eventi/index.html al deploy Netlify. |
