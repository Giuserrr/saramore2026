# Prompt per Claude Code — saramoreyoga.com
## Refactor alberatura + sistema blog + supporto video YouTube

> **Da incollare a Claude Code aprendo il repo `saramoreyoga.com`.**
> Decisioni strategiche prese a monte (4 maggio 2026). Non rinegoziarle.

---

## Contesto

Il sito è già documentato in `CLAUDE.md`. **Leggilo PRIMA di scrivere qualsiasi codice.** Lì ci sono i vincoli rigidi: stack HTML statico, niente framework, performance già ottimizzata, file e directory intoccabili, palette CSS, font self-hostati.

Il proprietario del business è **Sara Maggiori** (insegnante yoga Genova). Il referente tecnico è **Giuseppe** (ex-PO digital). Giuseppe autorizza ogni push.

---

## Cosa stiamo facendo

L'alberatura attuale (8 pagine indicizzabili + blog placeholder) è insufficiente per:
1. Ranking nazionale su query info ad alto volume (es. "yoga in gravidanza" 2900 vol)
2. Posizionamento su Anukalana (asse strategico, 720 vol KD 40, oceano blu)
3. Cluster locali (yoga genova centro 90 vol, corsi yoga genova 140 vol, ecc.)
4. Sistema blog con 33 articoli previsti (5 categorie tematiche)

**Strategia**: il local porta i soldi (lead WhatsApp → lezioni reali Genova). Il nazionale porta authority che alimenta il local. Le pillar nazionali catturano traffico generalista, lo incanalano verso le landing locali via internal linking.

---

## OBIETTIVO 1 — Nuove pagine commerciali e pillar

### 1.1 Sdoppia pillar gravidanza

**Stato attuale**: `/yoga-gravidanza-genova/` è ricca (~2000 parole) ma con title geo-localizzato → soffitto sul ranking nazionale.

**Azione**:
- **Crea** nuova pillar nazionale `/yoga-in-gravidanza/` (target KW: "yoga in gravidanza" 2900, "gravidanza e yoga" 2900, "yoga per la gravidanza" 2900)
- **Alleggerisci** `/yoga-gravidanza-genova/` mantenendo SOLO contenuti local-specific (orari classe Giovedì 14:30, sedi Genova, prenotazione, FAQ pratiche locali)
- **Migra** contenuto info (trimestre per trimestre, controindicazioni, perché lo yoga in gravidanza, formazione Sara) alla pillar nazionale, AGGIUNGENDO ~1500 parole nuove di approfondimento generalista

**Pillar nazionale `/yoga-in-gravidanza/` deve contenere**:
- Hero: "Yoga in gravidanza: la guida completa" + intro 2 paragrafi
- Sezione "Cosa cambia nel corpo nei 9 mesi" (NUOVO)
- Sezione "I 3 piani della pratica: fisico/emotivo/respiratorio" (migrato)
- Sezione "Trimestre per trimestre" (migrato + ampliato con asana specifici)
- Sezione "Benefici scientificamente documentati" (NUOVO, citare Cochrane Review yoga in gravidanza, evidenze su durata travaglio)
- Sezione "Controindicazioni e precauzioni" (migrato)
- Sezione "Quando iniziare e con quale frequenza" (NUOVO)
- Sezione "Approccio Anukalana applicato alla gravidanza" (NUOVO, link a `/anukalana-yoga/`)
- Sezione "FAQ approfondite" (10 Q+A migrate, ampliate)
- Sezione "Approfondimenti" — grid che linka articoli `/blog/gravidanza/...` (vuota all'inizio, da popolare)
- **CTA finale local**: "Sei a Genova? Pratico yoga in gravidanza in studio e a domicilio →" link a `/yoga-gravidanza-genova/`

**Landing local `/yoga-gravidanza-genova/` alleggerita deve contenere**:
- Hero ridotto: "Yoga in gravidanza a Genova"
- "Le mie lezioni di gruppo" (orari, sede, max 5 posti, prenotazione)
- "Le lezioni individuali in gravidanza" (zone domiciliari)
- "Cosa portare alla prima lezione"
- "La mia formazione" (sezione esistente)
- FAQ locali pratiche (max 5 Q+A: come prenotare, costi, sede, prima volta)
- **Link in alto a `/yoga-in-gravidanza/`**: "Vuoi capire prima cos'è lo yoga in gravidanza, come funziona trimestre per trimestre, le controindicazioni? → Guida completa"

**Schema.org**:
- Pillar nazionale: `Article` (NON `Service`) + `FAQPage` + `BreadcrumbList`
- Landing local: `Service` (esistente) + `FAQPage` (esistente, ridotta) + `BreadcrumbList` (nuovo)

### 1.2 Crea pillar Anukalana

`/anukalana-yoga/` — NUOVA. Target KW "anukalana yoga" (720 vol KD 40), cluster 790.

**Contenuto** (~1800 parole):
- Hero: "Anukalana yoga: cos'è e come funziona"
- Sezione "Cosa significa Anukalana" (etimologia sanscrito, "integrazione")
- Sezione "L'origine: Jacopo Ceccarelli e la scuola Samadhi"
- Sezione "Come funziona la pratica: i 5 principi"
- Sezione "Cosa la rende diversa da hatha/vinyasa/iyengar"
- Sezione "Per chi è adatta: principianti, gravidanza, dolori cronici, sportivi"
- Sezione "Anukalana in gravidanza" (link a `/yoga-in-gravidanza/`)
- Sezione "Dove praticare Anukalana in Italia" (Samadhi Firenze, scuole affiliate, **Sara Maggiori a Genova come riferimento ligure**)
- FAQ (5 Q+A: differenza con altri stili, formazione necessaria, è religioso?, posso iniziare senza esperienza, ecc.)
- CTA local: "Pratico Anukalana yoga a Genova →" link a `/lezioni-di-gruppo/`

**Schema.org**: `Article` + `FAQPage` + `BreadcrumbList`. NON `Service` (è una pagina di approfondimento, non un servizio commerciale).

### 1.3 Crea 3 landing locali nuove

Tutte e 3 sono pagine commerciali, schema `Service`, intent transazionale.

**`/yoga-genova-prezzi/`** — target KW "yoga genova prezzi" (50 vol KD 22, intent Transactional)
- Hero: "Quanto costa una lezione di yoga a Genova: i miei prezzi 2026"
- Sezione "Le mie tariffe" — IMPORTANTE: Sara non vuole prezzi pubblici fissi. La pagina parla di **fasce di mercato** ("nelle altre scuole genovesi i prezzi vanno da 12€ a 25€ a lezione di gruppo"), poi spiega cosa influenza il prezzo (gruppo vs individuale, frequenza, domicilio), poi CTA "Scrivimi per il preventivo personalizzato"
- Sezione "Pacchetti vs lezione singola" (concettuale, no numeri)
- Sezione "Yoga gravidanza: cosa cambia"
- Sezione "Lezioni a domicilio: il sovrapprezzo per zona"
- FAQ (5 Q+A: prima lezione gratuita?, posso pagare a lezione?, accettati pacchetti regalo?, posso disdire?, sconti famiglia?)
- CTA WhatsApp con messaggio precompilato

**`/yoga-genova-carignano/`** — target cluster Carignano + centro (~260 vol totale)
- Hero: "Yoga a Genova Carignano — Studio Equilibra"
- Sezione "Lo Studio Equilibra: cosa lo rende speciale"
- Sezione "Come arrivare" (Brignole 8 min a piedi, parcheggio Galata, bus 35/42)
- Sezione "Il quartiere: yoga a un passo dal centro"
- Sezione "Le mie classi a Carignano" (palinsesto specifico delle lezioni in questa sede)
- Sezione "Perché scegliere uno studio piccolo"
- FAQ locali (3-5 Q+A)
- Mappa OSM embed (riusa pattern di `/contatti/`)

**`/yoga-genova-centro-storico/`** — target cluster Centro Storico + Via Fieschi (~50 vol)
- Hero: "Yoga nel centro storico di Genova — Dojo Jakukai"
- Sezione "Il Dojo Jakukai in Via Fieschi" (descrizione spazio, atmosfera)
- Sezione "Yoga nel cuore di Genova" (dettagli quartiere, vicinanza Sarzano/Castelletto)
- Sezione "Le mie classi al Dojo" (palinsesto Via Fieschi)
- Sezione "Perché un dojo per lo yoga: la connessione tra arti del corpo"
- FAQ
- Mappa OSM (Via Fieschi 20)

**Tutte e 3 le landing local**: schema `Service` + `BreadcrumbList`. NIENTE `priceRange` numerico (Sara non vuole prezzi pubblici, anche su /prezzi/).

---

## OBIETTIVO 2 — Sistema blog con categorie

### 2.1 Struttura URL

Nuovo schema URL blog:
```
/blog/                              ← hub principale (esistente, da rifare)
/blog/gravidanza/                   ← pagina categoria
/blog/gravidanza/<slug>/            ← articolo
/blog/anukalana/
/blog/anukalana/<slug>/
/blog/pratica/
/blog/pratica/<slug>/
/blog/genova/
/blog/genova/<slug>/
/blog/salute/
/blog/salute/<slug>/
```

### 2.2 Decap CMS — modifiche a `admin/config.yml`

Aggiungi al `fields` della collection blog:

```yaml
- {label: "Categoria", name: "category", widget: "select", options: ["gravidanza", "anukalana", "pratica", "genova", "salute"], required: true}
- {label: "URL video YouTube (opzionale)", name: "youtube_url", widget: "string", required: false, hint: "Incolla l'URL completo del video YouTube quando disponibile, es. https://www.youtube.com/watch?v=ABC123. Lascia vuoto se non c'è video."}
- {label: "ID video YouTube (auto)", name: "youtube_id", widget: "string", required: false, hint: "Lascia vuoto, viene compilato automaticamente dallo script di build se hai inserito l'URL sopra."}
```

Aggiorna lo `slug` template per includere la categoria:
```yaml
slug: "{{year}}-{{month}}-{{day}}-{{category}}-{{slug}}"
```

NO: cambia logica — Decap salva tutto in `blog/posts/`, è lo script di build che smista per categoria. Lo slug del file resta `<YYYY-MM-DD>-<slug>.md`, la categoria è nel frontmatter, lo script genera il path corretto.

Quindi `slug` template:
```yaml
slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
```

### 2.3 Nuovo script `build-blog.js`

Crea `build-blog.js` (analogo a `build-schema.js`). Esegue al deploy Netlify.

**Logica**:

1. Legge tutti i `.md` in `blog/posts/`
2. Filtra `published: true`
3. Per ogni articolo:
   - Estrae frontmatter (title, date, summary, category, cover, tags, youtube_url, body)
   - Se `youtube_url` presente → estrae `youtube_id` con regex (`youtu.be/<id>` o `youtube.com/watch?v=<id>` o `youtube.com/embed/<id>`)
   - Genera `/blog/<category>/<slug>/index.html` (slug derivato dal nome file, senza data)
   - Inietta JSON-LD `BlogPosting` (con `BreadcrumbList` separato)
   - Se `youtube_id` presente → inietta JSON-LD `VideoObject` aggiuntivo + sezione `<iframe>` embed nell'HTML
4. Per ogni categoria:
   - Genera `/blog/<category>/index.html` (pagina categoria) con grid di card articoli pubblicati in quella categoria, ordinati per data decrescente
   - Inietta JSON-LD `CollectionPage` + `BreadcrumbList`
5. Aggiorna `/blog/index.html` (hub) con grid degli ultimi 6 articoli totali + 5 card categoria
6. Aggiorna `sitemap.xml` aggiungendo URL articoli + URL categorie + URL nuove pagine commerciali

**Naming convenzione articoli**:
- File markdown: `blog/posts/2026-05-15-yoga-prenatale.md`
- Frontmatter: `category: gravidanza`
- URL generato: `/blog/gravidanza/yoga-prenatale/`

**Template HTML articolo**:
- Stesso `<head>` boilerplate del sito (font preload, main.css, FontAwesome, Netlify Identity NO)
- Hero con titolo articolo + data + categoria badge
- Cover image se presente (`/uploads/...`)
- **Se `youtube_id` presente**: subito sotto cover image, sezione "🎥 Guarda il video" con `<iframe>` responsive 16:9 embed YouTube
- Body markdown convertito a HTML (usare libreria `marked` o simile via `npm install`)
- Box "Articolo correlato" alla fine: linka pillar di riferimento (gravidanza → `/yoga-in-gravidanza/`, anukalana → `/anukalana-yoga/`, pratica/salute → la più rilevante)
- CTA WhatsApp standard
- Breadcrumb visibile in cima: `Home > Blog > [Categoria] > [Articolo]`

**Template HTML pagina categoria**:
- Hero con descrizione categoria + link a pillar associata (se applicabile)
- Grid card articoli (riusa stile `.blog-card` da `main.css`)
- Breadcrumb: `Home > Blog > [Categoria]`

**Template HTML hub `/blog/`**:
- Hero
- 5 card categoria con icona e descrizione (sostituisce il placeholder attuale)
- "Ultimi articoli" — grid 6 articoli più recenti
- Se nessun articolo pubblicato: mantieni messaggio attuale "I primi articoli sono in scrittura"

### 2.4 JSON-LD per articoli con video YouTube

Quando `youtube_id` presente, l'articolo ha **2 blocchi JSON-LD**:

**Blocco 1: BlogPosting**
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "@id": "https://saramoreyoga.com/blog/<cat>/<slug>/#article",
  "headline": "...",
  "datePublished": "YYYY-MM-DD",
  "dateModified": "YYYY-MM-DD",
  "author": {"@id": "https://saramoreyoga.com/#sara"},
  "publisher": {"@id": "https://saramoreyoga.com/#business"},
  "image": "...",
  "video": {"@id": "https://saramoreyoga.com/blog/<cat>/<slug>/#video"},
  "articleSection": "<categoria capitalizzata>",
  "inLanguage": "it",
  "mainEntityOfPage": "https://saramoreyoga.com/blog/<cat>/<slug>/"
}
```

**Blocco 2: VideoObject** (solo se youtube_id presente)
```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "@id": "https://saramoreyoga.com/blog/<cat>/<slug>/#video",
  "name": "<title articolo>",
  "description": "<summary articolo>",
  "thumbnailUrl": "https://i.ytimg.com/vi/<youtube_id>/maxresdefault.jpg",
  "uploadDate": "<date articolo>",
  "embedUrl": "https://www.youtube.com/embed/<youtube_id>",
  "contentUrl": "https://www.youtube.com/watch?v=<youtube_id>",
  "publisher": {"@id": "https://saramoreyoga.com/#business"}
}
```

**Blocco 3: BreadcrumbList** (sempre)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://saramoreyoga.com/"},
    {"@type": "ListItem", "position": 2, "name": "Blog", "item": "https://saramoreyoga.com/blog/"},
    {"@type": "ListItem", "position": 3, "name": "<Categoria>", "item": "https://saramoreyoga.com/blog/<cat>/"},
    {"@type": "ListItem", "position": 4, "name": "<Titolo>", "item": "https://saramoreyoga.com/blog/<cat>/<slug>/"}
  ]
}
```

### 2.5 sameAs YouTube canale

Quando Sara avrà un canale YouTube attivo, va aggiunto a TUTTI i `sameAs` array già esistenti (4 punti: home `#business`, home `#sara`, chi-sono `#sara`, contatti `#business`).

**Per ora**: nel codice, aggiungi un commento nei 4 punti:
```html
<!-- TODO: aggiungere YouTube channel URL al sameAs quando disponibile -->
```

E in `CLAUDE.md` aggiungi nota: "Quando Sara apre canale YouTube, aggiungere URL canale a 4 sameAs (vedi commento TODO nei file)".

---

## OBIETTIVO 3 — Internal linking

### 3.1 Pillar → articoli blog (popolato dinamicamente)

Sulla pillar `/yoga-in-gravidanza/`, sezione "Approfondimenti" deve essere generata dallo script `build-blog.js`: legge tutti gli articoli con `category: gravidanza` e `published: true`, e li inserisce come grid di card in un blocco delimitato da:
```html
<!-- BUILD:BLOG-GRAVIDANZA:START -->
<!-- BUILD:BLOG-GRAVIDANZA:END -->
```

Stesso pattern per `/anukalana-yoga/` con marker `<!-- BUILD:BLOG-ANUKALANA:START/END -->`.

### 3.2 Articoli → pillar

Ogni template articolo blog ha sezione fissa "Articolo correlato" alla fine, che linka:
- Articoli `gravidanza` → `/yoga-in-gravidanza/`
- Articoli `anukalana` → `/anukalana-yoga/`
- Articoli `pratica` → la pillar più rilevante (default: `/anukalana-yoga/`)
- Articoli `genova` → `/lezioni-di-gruppo/` o `/yoga-genova-prezzi/` a seconda del topic
- Articoli `salute` → `/lezioni-individuali/`

### 3.3 Pillar nazionale → landing locale

Pillar `/yoga-in-gravidanza/`: CTA finale grossa che linka a `/yoga-gravidanza-genova/` per chi è a Genova.

Pillar `/anukalana-yoga/`: CTA grossa che linka a `/lezioni-di-gruppo/` come "dove praticare con me".

### 3.4 Footer aggiornato

Aggiungi al footer di TUTTE le pagine una nuova sezione "Approfondimenti":
```
Approfondimenti: Yoga in gravidanza · Anukalana yoga · Prezzi yoga Genova · Yoga Carignano · Yoga centro storico
```

Mantieni separata dalla riga link esistente (lezioni/individuali/gravidanza/chi-sono/eventi/blog/contatti) per non sovraccaricare.

---

## OBIETTIVO 4 — Aggiornamenti tecnici trasversali

### 4.1 sitemap.xml

Da 10 URL diventa ~15+ (poi cresce con articoli):
```xml
<url><loc>.../</loc>...</url>
<url><loc>.../lezioni-di-gruppo/</loc>...</url>
<url><loc>.../lezioni-individuali/</loc>...</url>
<url><loc>.../yoga-gravidanza-genova/</loc>...</url>
<url><loc>.../yoga-in-gravidanza/</loc>...</url>           <!-- NUOVO -->
<url><loc>.../anukalana-yoga/</loc>...</url>               <!-- NUOVO -->
<url><loc>.../yoga-genova-prezzi/</loc>...</url>           <!-- NUOVO -->
<url><loc>.../yoga-genova-carignano/</loc>...</url>        <!-- NUOVO -->
<url><loc>.../yoga-genova-centro-storico/</loc>...</url>   <!-- NUOVO -->
<url><loc>.../chi-sono/</loc>...</url>
<url><loc>.../eventi/</loc>...</url>
<url><loc>.../blog/</loc>...</url>
<url><loc>.../blog/gravidanza/</loc>...</url>              <!-- NUOVO -->
<url><loc>.../blog/anukalana/</loc>...</url>               <!-- NUOVO -->
<url><loc>.../blog/pratica/</loc>...</url>                 <!-- NUOVO -->
<url><loc>.../blog/genova/</loc>...</url>                  <!-- NUOVO -->
<url><loc>.../blog/salute/</loc>...</url>                  <!-- NUOVO -->
<url><loc>.../contatti/</loc>...</url>
<url><loc>.../privacy-policy/</loc>...</url>
<url><loc>.../termini/</loc>...</url>
```

`build-blog.js` deve **aggiornare automaticamente** sitemap.xml ad ogni deploy aggiungendo URL articoli pubblicati.

### 4.2 robots.txt

Invariato — già allow esplicito ai bot AI. Verifica che `Disallow:` non blocchi le nuove URL.

### 4.3 _redirects

Verifica che nessuno dei nuovi path collida con redirect Shopify legacy. In particolare:
- `/yoga-genova-prezzi/` — nessun conflitto, OK
- `/yoga-genova-carignano/` — nessun conflitto, OK
- `/yoga-genova-centro-storico/` — nessun conflitto, OK
- `/yoga-in-gravidanza/` — nessun conflitto, OK
- `/anukalana-yoga/` — nessun conflitto, OK
- `/blog/<categoria>/` — verifica che `/blog/*` non sia ridotto da redirect (NON dovrebbe esserlo)

### 4.4 Menu navigazione

**NON aggiungere voci al menu**. 8 voci sono già il limite UX. Le nuove pagine si raggiungono via:
- Footer (sezione "Approfondimenti")
- Internal linking nelle pagine pillar/landing
- Direct search organico

### 4.5 llms.txt

Aggiorna `llms.txt` aggiungendo le nuove pagine pillar e landing locali nella sezione "Pagine principali", e aggiungi una nuova sezione "Cluster tematici":

```
## Cluster tematici principali

- **Gravidanza**: pillar nazionale /yoga-in-gravidanza/ + landing locale /yoga-gravidanza-genova/ + blog /blog/gravidanza/
- **Anukalana**: pillar /anukalana-yoga/ + blog /blog/anukalana/
- **Pratica generale**: blog /blog/pratica/
- **Local Genova**: landing /yoga-genova-prezzi/, /yoga-genova-carignano/, /yoga-genova-centro-storico/ + blog /blog/genova/
- **Salute e dolori**: blog /blog/salute/
```

### 4.6 netlify.toml

Aggiorna build command:
```toml
command = "npm install && node build-schema.js && node build-blog.js"
```

### 4.7 package.json

Aggiungi dipendenze per markdown parsing:
```json
"marked": "^14.0.0",
"gray-matter": "^4.0.3"
```

(O alternative leggere se preferisci. Non aggiungere bundler/framework.)

---

## OBIETTIVO 5 — Migrazione contenuti

### 5.1 Migrazione `/yoga-gravidanza-genova/` → `/yoga-in-gravidanza/`

**Sezioni da spostare** (copia testuale, poi amplia):
- "Perché lo yoga in gravidanza" (3 piani fisico/emotivo/respiratorio) → pillar
- "Trimestre per trimestre" → pillar (amplia con asana specifici per trimestre)
- "Controindicazioni e precauzioni" → pillar
- "La mia formazione specialistica" → pillar (versione ampliata) E resta versione corta su landing local
- 8 delle 10 FAQ → pillar (versione info generale). 2 FAQ pratiche locali (orari, prima volta) restano su landing local + 3 nuove FAQ locali (come arrivare, parcheggio, pagamento).

**Sezioni che restano sulla landing locale `/yoga-gravidanza-genova/`**:
- Hero con focus Genova
- Lezioni di gruppo (orari giovedì 14:30, sede Equilibra)
- Lezioni individuali in gravidanza (zone domiciliari)
- Cosa portare alla prima lezione
- Mini-versione formazione (3 frasi + link a pillar)
- 5 FAQ locali pratiche
- Doppio CTA finale (gruppo / WhatsApp individuale)

### 5.2 Migrazione `/chi-sono/` → `/anukalana-yoga/`

La sezione "Anukalana Yoga" attualmente in `/chi-sono/` (con i 3 benefici autoguarigione/organi/energia) → migra il contenuto su `/anukalana-yoga/` ampliato. Su `/chi-sono/` lascia 2-3 frasi su Anukalana + link "Approfondisci →" alla nuova pillar.

### 5.3 Aggiornamento home

Sulla home, sezione "Stili che pratico" (Yoga Dolce/Vinyasa/Hatha Flow) → aggiungi una 4a card o una riga sotto: "Tutte le mie lezioni seguono l'approccio **Anukalana** [link a `/anukalana-yoga/`]".

Sezione "Yoga in gravidanza: una specializzazione formale" → aggiungi link "Guida completa allo yoga in gravidanza →" verso pillar `/yoga-in-gravidanza/`.

---

## VINCOLI — Da rispettare assolutamente

Tutti i vincoli di `CLAUDE.md` valgono. In particolare:

- **NON toccare**: `book.js`, `classes.json`, `events.json`, `admin/index.html`, `assets/fonts/`, palette CSS, font, immagini esistenti
- **NON aggiungere framework** (React/Vue/Astro/bundler vari). Resta HTML+CSS+JS vanilla.
- **Performance**: rispetta pattern preload font/image, `fetchpriority`, `defer` su JS, NO critical CSS inline (causava CLS)
- **Niente prezzi pubblici numerici** mai, anche su `/yoga-genova-prezzi/`. Solo fasce di mercato.
- **Niente embed reel/social**. Solo `<a>` testuali a Instagram/Facebook. **Eccezione**: l'`<iframe>` YouTube embed è ESPLICITAMENTE AUTORIZZATO solo dentro gli articoli blog quando `youtube_id` è presente.
- **Italiano fluido**, no anglicismi
- **Tono Sara**: gentile, presente, pratica, no spiritualismo vacuo
- **Push autorizzazione esplicita**: NON pushare senza che Giuseppe scriva esplicitamente "vai"/"push"/"pusha"

## Cose che il prompt NON include (verranno dopo)

- Scrittura dei 33 articoli — verranno fatti uno per volta, nessuna automazione editoriale
- Configurazione Wikidata — già fatta, non toccare i `sameAs` Wikidata esistenti
- Modifiche al sistema booking — invariato

---

## Ordine consigliato dell'esecuzione

1. **Leggi** `CLAUDE.md` integralmente
2. **Crea** le 5 nuove pagine pillar/landing (no contenuto blog ancora):
   - `/yoga-in-gravidanza/index.html`
   - `/anukalana-yoga/index.html`
   - `/yoga-genova-prezzi/index.html`
   - `/yoga-genova-carignano/index.html`
   - `/yoga-genova-centro-storico/index.html`
3. **Migra** contenuti da `/yoga-gravidanza-genova/` → `/yoga-in-gravidanza/`, alleggerisci la landing locale
4. **Migra** sezione Anukalana da `/chi-sono/` → `/anukalana-yoga/`, alleggerisci `/chi-sono/`
5. **Aggiorna** home (link a pillar nuove)
6. **Aggiorna** footer su tutte le pagine (sezione Approfondimenti)
7. **Crea** `build-blog.js` con tutta la logica descritta
8. **Aggiorna** `admin/config.yml` (campo categoria + youtube_url)
9. **Crea** template HTML articolo + template categoria + nuovo `/blog/index.html` hub
10. **Aggiorna** `sitemap.xml` (statico per ora, dinamico via script al deploy)
11. **Aggiorna** `netlify.toml`, `package.json`, `llms.txt`
12. **Verifica** in locale con `python3 -m http.server 8765` + valida JSON-LD su tutte le pagine
13. **Riporta a Giuseppe** il diff completo prima di pushare. Aspetta autorizzazione.

---

## Test di accettazione

Prima del push, verifica:
- [ ] Tutte le 5 nuove pagine ritornano 200 in locale
- [ ] JSON-LD valido su validator.schema.org per ogni nuova pagina
- [ ] BreadcrumbList presente su tutte le pagine non-home
- [ ] sitemap.xml contiene tutte le 15+ URL
- [ ] `/yoga-gravidanza-genova/` ancora funzionante e ridotta come da spec
- [ ] `/chi-sono/` ancora funzionante e con sezione Anukalana ridotta + link
- [ ] `build-blog.js` testato con almeno 1 articolo dummy in `blog/posts/` (con e senza `youtube_url`)
- [ ] PSI mobile non scende sotto 85 (era ~90 prima del refactor)
- [ ] Internal linking pillar↔landing↔blog funzionante in tutti i 4 sensi

---

## Domande aperte da risolvere PRIMA di scrivere

1. La libreria markdown da usare: `marked` o `markdown-it` o altro? Suggerisco `marked` per leggerezza.
2. Per il body markdown: vogliamo supportare GFM (tables, footnotes)? Probabilmente sì.
3. Per il TOC degli articoli: lo generiamo automaticamente dalle h2/h3 oppure no? Suggerisco SÌ ma solo se l'articolo ha 4+ heading.
4. Reading time stimato (es. "5 min di lettura"): lo calcoliamo? Suggerisco SÌ, basato su ~200 parole/min in italiano.

Risolvi queste con i tuoi default ragionevoli se Giuseppe non risponde, e segna le scelte in commento nel codice.

---

**FINE PROMPT.** Esegui in ordine, riporta diff a Giuseppe per autorizzazione push.
