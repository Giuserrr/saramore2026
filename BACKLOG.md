# Backlog SaraMore Yoga — da iterare dopo il go-live

> Stato 4 maggio 2026 sera, dopo commit `d4d108e` (push effettuato, sito live con tutte le modifiche di Sprint 1+2+contenuti+404-safe+AI-crawler+a11y WCAG AA). GSC + Bing submission completata. Da qui si itera.

---

## 🚀 Verifica deploy (subito, appena Netlify diventa verde)

### CARD-001 · PSI mobile check live
- **Cosa**: lanciare PageSpeed Insights su `https://saramoreyoga.com/` mobile + desktop
- **Target**: mobile ≥85, desktop ≥95
- **Pagine campione**: `/`, `/yoga-in-gravidanza/`, `/yoga-genova-prezzi/`, `/blog/anukalana/yoga-somatico/`
- **Note**: prima del refactor era ~50 mobile. Atteso ~90 dopo perf fix Sprint maggio. Se mobile <85 → blocker, da diagnosticare.

### CARD-002 · Rich Results Test
- **Cosa**: validare schema.org JSON-LD live
- **URL**: https://search.google.com/test/rich-results
- **Pagine prioritarie**:
  - `/yoga-genova-prezzi/` → 18 Offer (rich snippet "prezzo da X€")
  - `/yoga-in-gravidanza/` → FAQPage (10 Q, candidata FAQ rich result)
  - `/blog/anukalana/yoga-somatico/` → BlogPosting + BreadcrumbList
  - `/eventi/` → Event (se ce ne sono di attivi)

### CARD-003 · Google Search Console — ✅ FATTO 2026-05-04 sera
- Sitemap re-inviata (22 URL letti)
- "Request indexing" su 10 URL prioritari (home + 4 pillar/landing + 4 articoli + blog hub)
- Restanti 12 URL (categorie blog, privacy/termini) lasciate al crawl naturale
- **Follow-up**: tra 7-14 giorni verificare GSC → Pages → "Indicizzate" salito da ~10 verso 22

### CARD-004 · Bing Webmaster Tools — ✅ FATTO 2026-05-04 sera
- Tutti i 22 URL inviati (Bing ha quota più generosa di Google)
- **Follow-up**: 24-72h per indicizzazione. Bing alimenta anche ChatGPT search e Copilot — utile.

---

## 📈 SEO monitoraggio (3-6 mesi)

### CARD-005 · GSC tracking ranking
- **Query da monitorare** (impressions/position medie):
  - "yoga Genova" / "lezioni yoga Genova"
  - "yoga gravidanza Genova" / "corso yoga in gravidanza"
  - "Anukalana Yoga" / "Anukalana Genova"
  - "yoga Carignano"
  - "yoga somatico" / "differenza yoga pilates" / "posizione del piccione"
  - "Sara Maggiori yoga"
- **Cadence**: mensile, almeno per 6 mesi
- **Azione**: se una query è a pagina 2-3 dopo 3 mesi → ottimizzare l'articolo/pagina target

### CARD-006 · Wikidata Q-ID health check
- **Cosa**: verificare che le pagine Wikidata non siano cancellate per "lack of notability"
- **Q-ID**: Q139618286 (business), Q139618479 (Sara persona)
- **Cadence**: trimestrale
- **Azione se cancellate**: rimuovere `sameAs` dai 4 punti (home `#business`, home `#sara`, chi-sono `#sara`, contatti `#business`)

### CARD-007 · AI search verification
- **Cosa**: testare se gli LLM citano il sito su query rilevanti (proxy E-E-A-T per AI)
- **Cadence**: dopo 4-8 settimane dal go-live, poi trimestrale
- **Test query** (da provare su ChatGPT, Claude, Perplexity, Gemini):
  - "Insegnante di yoga a Genova Carignano"
  - "Cos'è l'Anukalana Yoga?"
  - "Yoga in gravidanza a Genova: chi consigli?"
  - "Yoga somatico cos'è"
- **Successo**: SaraMore Yoga citato come fonte/risultato

---

## ✍️ Contenuti blog

### CARD-008 · Articolo #1 gravidanza
- **Slug**: `/blog/gravidanza/come-scegliere-corso-yoga-gravidanza/`
- **KW**: "corso yoga in gravidanza"
- **Stato**: scheletro `published: false`, in attesa video shoot
- **Procedura**: video → frontmatter `youtube_url` → riempire body markdown → `published: true` → `node build-blog.js`
- **Effetto**: sblocca card gravidanza nell'hub blog (auto-cliccabile), popola marker `BUILD:BLOG-GRAVIDANZA` su pillar `/yoga-in-gravidanza/`, sitemap +1 URL

### CARD-009 · Setup canale YouTube + retrofit articoli
- **Stato attuale**: 0 video, articoli senza `youtube_url`. Sessione 2026-05-04 sera: deciso di girare i video prossimamente.
- **Quando Sara apre il canale**:
  1. Aggiungere `https://www.youtube.com/@<handle>` al `sameAs` di Sara (`#sara`) e business (`#business`) in 4 punti: home, chi-sono, contatti, /yoga-in-gravidanza/
  2. Aggiornare `llms.txt` con link canale
  3. Per articoli esistenti che hanno video pertinente: editare frontmatter `youtube_url` → rebuild → l'articolo guadagna `<iframe>` 16:9 + `VideoObject` JSON-LD
- **Articoli candidati a video**:
  - `/blog/pratica/posizione-del-piccione-yoga/` (demo asana, ovvio)
  - `/blog/anukalana/yoga-somatico/` (intervista/spiegazione)
  - articolo gravidanza CARD-008 (video classe gravidanza)
  - articolo meditazione (sessione guidata)
- **Nota onestà sui benefici** (riferimento conversazione 2026-05-04): video NON migliorano direttamente l'indicizzazione (ranking pagina invariato). Migliorano: (a) rich snippet SERP con thumbnail+play (CTR +20-40%), (b) presenza su YouTube come secondo motore di ricerca, (c) tab Video Google, (d) dwell time, (e) citazioni AI search.

### CARD-026 · Reviews Google integration via Places API (build-time fetch) — ✅ FATTO 2026-05-04 sera, fix 2026-05-05
- Phase 1 (commit `e30515d`): `build-reviews.js` (~250 righe), CSS `.google-reviews` (~140 righe), markers su home + chi-sono, env vars Netlify (manuali via dashboard), test locale verde.
- Phase 2 SCHEMA (commit `eb29354`) → **ROLLBACK** (commit `698932c`): tentato `Service.aggregateRating` + `review[]` su 3 service pages, ma Rich Results Test ha flaggato "Tipo di oggetto non valido". **Service NON è parent valido per Review Snippet rich result Google.** Schema rimosso, errore risolto. Resta il blocco visible su 5 pagine.
- **Stato finale**: blocco recensioni visibile su 5 pagine (home, chi-sono, lezioni-di-gruppo, lezioni-individuali, yoga-gravidanza-genova). Zero schema review on-site (impossibile per local services). Le stelline 5,0 ⭐ vivono su GBP Knowledge Panel + Local Pack, non in SERP organica.
- **Phase 3 eventuale (NON fatta)**: refresh automatico via Netlify Build Hook scheduled (cron settimanale), così le review si aggiornano anche senza push. Per ora refresh avviene ad ogni `git push`.

### CARD-027 · Maps Embed API + `hasMap` JSON-LD — ✅ FATTO 2026-05-05
- **Cosa**: swap iframe OpenStreetMap → Google Maps Embed API su `/contatti/` + `/yoga-genova-carignano/` (URL Embed pinnato al Place ID GBP `ChIJdf86kA9D0xIRU9TR4qz8gQY`). Aggiunto `"hasMap": "https://maps.app.goo.gl/GA3Qut4REbwjiaEh8"` al JSON-LD `LocalBusiness` su `index.html` + `contatti/index.html`.
- **Perché**: la card Maps Embed pinnata al Place ID È la scheda canonica del business (entity merge signal a Google KG, lavora in coppia con `sameAs` Wikidata e GBP URL); UX nativa con "Indicazioni"/"Salva"/"Apri in Maps"; Maps Embed API è gratis illimitato (zero call billing).
- **Solo aggiunte**: zero modifiche a JSON-LD esistente, sameAs, openingHoursSpecification, geo. Diff cleanup verificato.
- **Action richiesta a Giuseppe in GCP** (DA FARE):
  1. **Abilitare "Maps Embed API"** sul progetto Google Cloud (è una API service distinta da Places API, va abilitata separatamente). Console → API & Services → Library → cerca "Maps Embed API" → Enable.
  2. **HTTP referrer restriction sulla key** `AIzaSyDTH_hsOU1Q-7Ccmg8GOy-7k8-JS4xCpNo`: Console → API & Services → Credentials → click sulla key → Application restrictions: HTTP referrers → aggiungi `https://saramoreyoga.com/*`, `https://*.netlify.app/*` (per preview deploys). Senza questo step la key esposta in HTML può essere usata da chiunque (carta zero-balance comunque, rischio reale = 0).
- **Privacy**: Maps Embed setta cookie Google. Aggiungere riga nella privacy policy (DA FARE post-push, low priority).
- **Deferred (non fatto, valutato e scartato per ora)**: auto-sync `regularOpeningHours` da Places API → JSON-LD. Rischio: orari custom hardcoded sono diversi/più granulari di quelli GBP, sostituirli può disallineare le ore reali con quelle pubblicate. Riconsiderare se Sara aggiorna gli orari su GBP e li vuole sync sul sito.

### CARD-026-OLD-REFERENCE · Reviews Google integration via Places API (build-time fetch) — DESCRIZIONE STORICA
- **Cosa**: script Node `build-reviews.js` che gira al deploy Netlify, fetcha le ultime 5 review da Google Places API, materializza un blocco "Recensioni Google" in HTML statico su home + chi-sono con branding ufficiale (logo G colorato, nome reviewer, foto profilo, data, testo, link "Tutte le recensioni su Google →" verso scheda GBP).
- **Perché è la strada giusta** (vs alternative scartate):
  - ❌ **Schema `LocalBusiness.aggregateRating` manuale**: dal 2019 Google ha bloccato i "self-serving reviews" (review di entity A su sito di entity A) — niente stelline in SERP. Inoltre filtri "spammy structured data" 2026 più aggressivi.
  - ❌ **Widget terzi (Elfsight, Trustindex, EmbedSocial)**: stessa policy self-serving, niente stelline, +€10-30/mese, +150KB JS, perf hit, dipendenza esterna.
  - ❌ **Runtime JS fetch (Places JS API client-side)**: niente SEO benefit (crawler non vede review caricate via JS), perf hit a ogni page load, breaks PSI ~90.
  - ✅ **Build-time fetch + static output**: zero runtime JS, zero perf hit, PSI invariato, coerente con philosophy stack statico, review reali e "verified" via API ufficiale Google.
- **Limitazioni API note**:
  - Places API restituisce **max 5 review per call** (Google le sceglie per relevance, oppure si chiede sorting per newest). Non bypassabile.
  - Sample di 5 ruota nel tempo (ad ogni rebuild → sempre fresche) — pattern identico a quello di redyoga.it
  - Le restanti review vivono solo su GBP, linkate via "Tutte le recensioni su Google (50+) →"
- **Stelline in SERP** (rich snippet):
  - `LocalBusiness.aggregateRating` con review reali NON produce stelline (self-serving rule attiva)
  - **Workaround**: attaccare `aggregateRating` + `review` array a schema `Service` (esente dalla self-serving rule per Google) sui 3 service: `/lezioni-di-gruppo/`, `/lezioni-individuali/`, `/yoga-gravidanza-genova/`. Le review devono essere visibili in pagina per matchare schema (filtro spammy). Possibili stelline per query servizio.
- **API da usare**: **Places API (New)** — la legacy nel 2026 non è più abilitabile su progetti nuovi. New API offre field masking (paghi solo `reviews,rating,userRatingCount,displayName`), endpoint Place Details (New) `https://places.googleapis.com/v1/places/{PLACE_ID}`, response JSON-style.
- **Setup richiesto a Giuseppe** (~30-40 min, non delegabile):
  1. Console Google Cloud → nuovo progetto "saramoreyoga-build"
  2. Abilita **Places API (New)** in API & Services → Library (NON la legacy)
  3. Crea API key, restringi a Places API (New) + IP Netlify builder (lista Netlify pubblica)
  4. Aggiungi metodo di pagamento (carta) — necessario per free tier ma costo reale ~$0.15-0.30/mese con field masking, ben dentro free credit $200/mese
  5. Trova Place ID di SaraMore Yoga via [Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder)
  6. Manda API key + Place ID a Claude
- **Setup tecnico (Claude, ~1-1.5h)**:
  1. `build-reviews.js`: parser response API, normalizzazione date, escape HTML
  2. CSS pattern `.google-reviews-block` + `.review-card` + branding ufficiale (logo G colorato, stelle Google-style)
  3. Marker `<!-- BUILD:REVIEWS:START/END -->` su home + chi-sono per idempotenza
  4. JSON-LD `Service.aggregateRating` + `review[]` su 3 pagine servizio (visibile + schema match)
  5. Update `netlify.toml`: `npm install && node build-schema.js && node build-blog.js && node build-reviews.js`
  6. Env var `GOOGLE_PLACES_API_KEY` + `PLACE_ID` su Netlify (Site Settings → Environment variables)
  7. Cron settimanale via Netlify Build Hooks per refresh automatico (anche senza push)
- **Cost**: ~$0.51/mese (30 build/mese × $0.017/call), $200/mese free credit copre largamente
- **Numeri attuali (2026-05-04 sera)**: 23 review (era 20, ha mandato il link nel gruppo WhatsApp ex-allieve ieri). Trend atteso: ~50 review in pochi giorni (gruppo 120 ex-allieve).
- **Impatto atteso**:
  - Local Pack ranking (per "yoga Genova", "yoga Carignano"): boost reale, 2-4 settimane post-publish (review velocity factor)
  - Trust on-site: blocco "Recensioni Google · 5,0 ⭐ · 50+ recensioni" → conversion uplift
  - Stelline SERP per query servizio: possibile, dipende da quanto Google riconosce match Service schema
- **Effort totale**: 30-40 min Giuseppe + 1-1.5h Claude = ~2h. Una sessione dedicata.
- **Pre-requisito ideale**: aspettare che le review salgano sopra 40-50 (in 2-4 giorni) prima di lanciare lo script — più alto è il count visibile, maggiore il trust signal al primo deploy.

### CARD-025 · Video presentation `/chi-sono/` (E-E-A-T + conversion)
- **Cosa**: video 60-90s di Sara che si presenta (chi/cosa/dove/perché), volto + voce + B-roll dello studio Equilibra
- **Perché**: pagina chi-sono è la tappa pre-conversione tipica. Video accorcia la distanza emotiva → +conversioni WhatsApp. Massimo segnale E-E-A-T (Google premia volti+voci reali su pagine "About"). Query brand "Sara Maggiori yoga" → ranking knowledge panel.
- **Formato diverso da articoli blog**:
  - Durata 60-90 sec (non 5-15 min come tutorial)
  - Presentation, brand-oriented (non how-to)
  - B-roll: studio Equilibra, mani che insegnano, dettagli ambiente
  - Tono personale e caldo (non didattico)
- **Schema impl**: aggiungere `VideoObject` collegato al `Person` schema di Sara (`#sara`) via property `video` o `subjectOf`. Effetto: knowledge graph signal diretto sull'entità persona.
- **Suggerimento operativo**: girare insieme ai video tutorial articoli (stesso giorno setup luci/audio = -50% costo+tempo). Script si scrive in 30 minuti, evitare fronte-camera improvvisato.
- **Effort**: 2-3h riprese (insieme ad altri) + 30 min editing + 10 min code (embed + JSON-LD)

### CARD-010 · Foto cover professionali
- **Stato attuale**: 4 articoli usano cover provvisorie. Cover attuali: `/img/1-1080.webp` (yoga-pilates-genova-differenze), `/img/2-1024.webp` (yoga-somatico), `/img/3-1080.webp` (posizione-del-piccione-yoga + come-scegliere-corso-yoga-gravidanza), `/img/sara-maggiori-evento-yoga-sala-storica-1440.webp` (come-iniziare-a-meditare, sostituita 2026-05-05 — era 4-1440 palinsesto, esteticamente sbagliato per articolo meditazione)
- **Quando arrivano scatti professionali**:
  1. Comprimere in webp (cwebp -q 75 -m 6, vedi CLAUDE.md sezione "Compressione immagini")
  2. Aggiungere a `/img/`
  3. Editare frontmatter `cover:` di ogni .md
  4. Aggiornare `COVER_DIMS` in `build-blog.js` con dimensioni nuove
  5. Rebuild
- **Bonus**: aggiornare anche le foto principali del sito (hero home, chi-sono, ecc.)

### CARD-011 · Roadmap editoriale futura
- **Stato**: 4/5 pillar fatti. Decidere cadenza articoli successivi (1/mese? 2/mese?)
- **Categorie sotto-rappresentate**: gravidanza (0), salute (1)
- **Idee articoli** (brainstorm, non commitment):
  - gravidanza: "Posizioni yoga sicure nel terzo trimestre", "Diastasi e yoga post-parto"
  - anukalana: "Anukalana vs Hatha vs Vinyasa", "Come l'Anukalana adatta la pratica al ciclo mestruale"
  - pratica: "10 asana per chi sta seduto 8 ore al giorno", "Apertura delle anche: progressione"
  - genova: "Yoga vs Pilates vs Crossfit a Genova", "Mappa degli studi yoga a Genova"
  - salute: "Yoga e ansia: cosa dice la ricerca", "Respirazione yogica per insonnia"

### CARD-024 · Layout articoli blog: rompere i muri di testo su mobile
- **Problema**: gli articoli pubblicati sono 2.200-4.100 parole di prosa fitta. Da mobile risultano "muri di testo" — bounce rate alto, scroll depth basso, dwell time mediocre.
- **Pattern proposti** (validati su demo `/blog/anukalana/yoga-somatico-demo/index.html`, da eliminare):
  1. **Pull quote tra H2** — frase-chiave del paragrafo precedente in `<p class="pullquote">`, sage italic 1.45rem, bordo sinistro sage, "respiro" visivo ogni ~500 parole.
  2. **Box "in breve"** dopo H2 lunghi — `<aside class="key-points">` con 3-6 bullet sintetici, sfondo `var(--bg-warm)`, scannable mobile in 5 secondi.
  3. **`<details>` per approfondimenti** — sezioni storico/tecniche/scientifiche collassate di default. Google le indicizza comunque (no hidden text penalty).
  4. **Larghezza riga 65ch** (`max-width: 65ch` su `.post-body`) invece di ~85ch — leggibilità mobile +30% (studi tipografia).
- **CSS**: tutti i pattern sono nel `<style>` inline del demo, da estrarre e portare in `assets/css/main.css` come pattern stabili.
- **Regole editoriali (rigide)**:
  - **Pull quote = verbatim**, mai paraphrase. Estrarre 1 frase esatta dal paragrafo precedente, niente compressioni.
  - **Box "in breve" = scritti/approvati da Sara**, non auto-generati. È contenuto editoriale, non automazione.
- **Strategia di rollout consigliata** (opzione A — più sicura):
  1. Aggiungere CSS pattern a `main.css` (5 minuti, no impact)
  2. Modificare **un solo articolo** (il meno trafficato dei 4, scegliere da GSC dopo 4-6 settimane di dati live)
  3. Monitorare GSC + PSI per 2 settimane: ranking, impressioni, dwell time
  4. Se metriche stabili o positive → applicare agli altri 3, uno a settimana
  5. Per articoli futuri: pattern integrato in workflow editoriale (Sara scrive pull quote + key points come parte del processo articolo)
- **Strategie alternative scartate**:
  - **B. Frontmatter-driven**: aggiungere `pullquotes:` e `key_points:` al frontmatter md + estendere `build-blog.js`. ~2h dev. Pro: Sara può editare via Decap. Con: Sara comunque deve scrivere il contenuto.
  - **C. Auto-extract**: build-blog.js estrae automaticamente `<strong>` da primo paragrafo dopo H2 e li promuove a pull quote. Pro: zero lavoro editoriale. Con: rischia frasi sbagliate, voce robotica, no controllo umano. **Sconsigliata.**
- **SEO/performance impact**: ZERO o leggermente positivo. PSI score 100 SEO non si tocca (non misura il contenuto, misura meta + structured data + mobile-friendly). Performance: HTML+CSS puro, no JS, no img → no LCP/CLS impact. Anzi, `<details>` collassato riduce il DOM iniziale del 5%.
- **Rischio**: volatilità ranking 1-3 settimane durante recrawl Google. Si mitiga col rollout incrementale (1 articolo alla volta).
- **Effort**: 5 min CSS + 30 min editoriale per articolo. 4 articoli = ~2h totali, distribuite su 4 settimane di rollout.
- **Demo eliminata** 2026-05-04 sera (prima del push commit `3134418`).

---

## 🛠️ Performance + cleanup tecnico

### CARD-012 · `.DS_Store` cleanup
- **Stato**: file tracked nel repo, modified spesso (rumore git)
- **Azione**:
  1. `git rm --cached .DS_Store` (e ogni `.DS_Store` annidato)
  2. Aggiungere `.DS_Store` a `.gitignore`
- **Effort**: 2 minuti

### CARD-013 · Hash anchor legacy redirect
- **Cosa**: `/#orari`, `/#chisono` ricevuti via Instagram/WhatsApp non funzionano (gli hash non arrivano al server)
- **Fix**: IIFE all'inizio di `assets/js/main.js` con mappa hash → URL reali, redirect via `location.replace()`
- **Mappa minima**: `#orari` → `/lezioni-di-gruppo/`, `#chisono` → `/chi-sono/`, `#contatti` → `/contatti/`, `#gravidanza` → `/yoga-gravidanza-genova/`
- **Effort**: 15 minuti

### CARD-014 · FontAwesome → SVG inline
- **Stato**: usiamo ~30 icone su 7000 disponibili. FontAwesome carica ~80KB.
- **Azione**: estrarre solo le icone usate, embedarle come `<svg>` inline o sprite
- **Saving atteso**: ~80KB
- **Effort**: 1-2 ore (mappare le ~30 icone, sostituire `<i class="fas fa-...">` con SVG)

### CARD-015 · `fade-in` review su sub-pages
- **Cosa**: il pattern `.fade-in { opacity: 0; transition: 0.8s; }` su elementi above-the-fold ha killato l'LCP della home (commit `5a22319`). Verificare se altre pagine hanno lo stesso problema.
- **Pagine da controllare**: `/chi-sono/.profile-img`, `/lezioni-individuali/.hero-img`, `/yoga-gravidanza-genova/.hero-img`, `/yoga-in-gravidanza/.hero-img`, `/anukalana-yoga/.hero-img`
- **Fix**: rimuovere `.fade-in` da elementi LCP candidate
- **Effort**: 30 minuti (PSI prima/dopo per misurare)

### CARD-016 · Forced reflow ~70ms diagnose
- **Cosa**: Lighthouse segnala forced reflow ~70ms su tutte le pagine
- **Probabile causa**: IntersectionObserver per fade-in che rilegge layout sync
- **Azione**: profilare con DevTools → Performance, identificare la chiamata che forza il reflow
- **Effort**: 1 ora

### CARD-017 · `detail-img` modal eventi (cosmetico)
- **Cosa**: l'`<img id="detail-img" src="" alt="">` placeholder modal manca width/height
- **Impact**: nullo (modal in display:none al page load), warning Lighthouse cosmetico
- **Fix**: aggiungere `width="1080" height="600"` (default ratio cover eventi)
- **Effort**: 1 minuto

### CARD-018 · Web Vitals monitoring (RUM)
- **Cosa**: monitoring real user metrics (non solo lab tests PSI)
- **Opzioni**: Vercel Analytics, Cloudflare Web Analytics, custom con `web-vitals` lib + Netlify Functions endpoint
- **Decisione**: low priority finché PSI mobile resta sopra 85. Riconsiderare se traffico cresce sopra 1k/mese.

---

## 📝 Contenuti pagine

### CARD-019 · `/chi-sono/` ampliamento sezione Anukalana
- **Stato**: rimandato esplicitamente a "fine sito" (decisione 4 maggio 2026)
- **Cosa**: ampliare la sezione Anukalana con storia personale di Sara con la pratica, link forte a `/anukalana-yoga/` (pillar)
- **Quando**: post tutto il resto, in fase di review complessiva del sito

### CARD-020 · Eventi reali Yoga + Meditazione con Francesca
- **Cosa**: l'articolo `/blog/salute/come-iniziare-a-meditare/` cita un appuntamento mensile con Francesca su `/eventi/`. Verificare che `events.json` rifletta gli appuntamenti reali quando ce ne sono.
- **Workflow**: Sara aggiorna via Decap → `events.json` → `build-schema.js` genera Event JSON-LD
- **Verifica**: dopo prossima pubblicazione evento, controllare che JSON-LD Event sia presente

### CARD-021 · Schema.org `Review`
- **Trigger**: quando Sara raccoglierà testimonianze pubbliche (es. da clienti che acconsentono pubblicazione nome+testo)
- **Effetto**: rich snippet stelline su SERP
- **Effort**: 30 minuti per pagina (definire schema + integrare 3-5 review)

### CARD-022 · IndexNow re-evaluation
- **Stato**: scartato 2026-05 (Google non partecipa, Bing IT ~3%)
- **Trigger ri-valutazione**: se GSC mostra >100 click/mese da Bing → setup IndexNow
- **Effort**: 30 min per integrazione + key file

### CARD-023 · Sitemap automatica
- **Stato**: oggi `sitemap.xml` è statica + marker auto per articoli blog
- **Possibile evoluzione**: enumerazione automatica delle directory in build-step (più scalabile)
- **Quando**: solo se il sito cresce sopra ~30 URL e diventa difficile da mantenere a mano

### CARD-028 · Image SEO — alt text + filename refresh
- **Trigger**: GSC 8 mag 2026 — 71 impressioni image search / 1 click in 90gg (CTR 1.4% vs web 9.7%)
- **Cosa**: rivedere alt text generici sulle ~18 foto principali. Esempio: "Sara Maggiori durante una pratica" → "Sara Maggiori in saluto al sole, classe yoga di gruppo Genova Carignano"
- **Effort**: 30 min (sweep degli `<img alt="...">` nelle 14 pagine HTML)
- **Impatto stimato**: +1-3 click/mese da Google Image Search (canale gratis sotto-sfruttato)
- **Priorità**: media — ROI incerto ma effort basso

### CARD-029 · `build-llms.js` automation
- **Stato**: 8 mag 2026 creato `llms-full.txt` via script Python one-shot. Va rigenerato manualmente quando si modificano pagine
- **Cosa**: convertire script Python in Node.js `build-llms.js` integrato nella build chain Netlify (`npm install && node build-schema.js && node build-blog.js && node build-reviews.js && node build-llms.js`)
- **Effort**: 30 min (porting Python → Node, no deps esterni: usa `fs` + `path` + `child_process` per `git log`)
- **Quando**: prossimo touch su llms-full.txt, oppure se si aggiungono pagine nuove
- **Note**: stesso pattern di `build-blog.js` con marker idempotenti

### CARD-030 · GitHub Actions cron weekly GSC report
- **Cosa**: cron lunedì 8:00 UTC → `tools/gsc.js query 7` + diff vs settimana precedente → email a Giuseppe via Resend
- **Effort**: 3h (workflow YAML + diff logic + Resend integration + GitHub Secrets per refresh_token)
- **Trigger**: solo se traffico cresce e diventa scomodo controllare GSC manualmente
- **Note**: refresh_token oggi è in `~/.config/saramoreyoga/gsc-oauth.json` chmod 600. Per cron in cloud serve metterlo in GitHub Secrets (encrypted at rest)
- **Priorità**: bassa — traffico attuale (~50 click/mese) non giustifica overhead

### CARD-031 · GSC monitoring CTR fix follow-up
- **Trigger**: 2 settimane dopo commit `47fbea0` (8 mag 2026) — verifica effetto title/desc rewrite
- **Cosa**: rieseguire `node tools/gsc.js query 28` e confrontare CTR per:
  - `/chi-sono/` (era 2.6% pos 2.8 — atteso 8-12%)
  - `/lezioni-di-gruppo/` (era 1.5% pos 3.0 — atteso 8-12%)
  - `/lezioni-individuali/` (era 2.0% pos 2.5 — atteso 10-13%)
- **Effort**: 5 min (1 comando, lettura output)
- **Data follow-up**: ~22 maggio 2026
- **Note**: CTR può richiedere fino a 3-4 settimane per stabilizzarsi (Google ricalcola CTR storico). Se a 4 settimane è ancora <5% → titolo non funziona, iterare

---

## 🗒️ Note operative

### `SARAMOREYOGA-DOC-TECNICA.docx`
- File 14KB nella root, non tracked, non committato. Decidere se:
  - tracciarlo (è doc tecnica del progetto)
  - aggiungerlo a `.gitignore` (è un file locale di Giuseppe)
  - cancellarlo

### CLAUDE.md aggiornamento commit hash — ✅ FATTO 2026-05-04 sera
- Tutte le righe `[Sprint X — pending push]` ora puntano a `96d530e`. Aggiunte righe `3134418` (a11y) e `d4d108e` (BACKLOG).

### Procedure ricorrenti consolidate (riferimento per next sessions)
- **Pubblicare un articolo**: scheletro `published: false` → contenuto → `published: true` → `node build-blog.js` → sitemap auto + marker pillar auto
- **Encoding fix mojibake**: pipeline Python con sentinel + latin-1 round-trip + post-fix targeted (vedi `tmp/yoga-somatico-fix.py`, `/tmp/meditare-fix.py`)
- **Compressione immagini**: `cwebp -q 75 -m 6 input.jpg -resize 1080 0 -o output-1080.webp` (q=60 per ritratti grandi, q=90 per logo)
- **Verifica post-deploy**: script bash con `curl -o /dev/null -w '%{http_code}'` su tutti gli URL chiave (vedi CLAUDE.md sezione "Verifiche post-deploy")
- **Push policy**: Giuseppe autorizza esplicitamente ogni push con "vai"/"push"/"pusha"/"commit". Mai pushare proattivamente.

---

**Ultima iterazione**: 8 maggio 2026, sessione SEO data-driven completata con commit `47fbea0` (push live, CTR fix 3 pagine + internal linking yoga-somatico + brand alternateName + llms-full.txt). 31 carte totali, **4 chiuse** (CARD-003 GSC, CARD-004 Bing, CARD-026 Reviews, "CLAUDE.md hash update"), 27 aperte. **Prossimo focus**: articolo blog gravidanza CARD-008 (settimana prossima 4-6h) + monitoraggio CARD-031 (~22 maggio). 4 nuove carte aggiunte oggi (CARD-028 image SEO, CARD-029 build-llms automation, CARD-030 GHA cron GSC, CARD-031 CTR follow-up).
