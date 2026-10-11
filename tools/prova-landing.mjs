// Collaudo della pagina di arrivo per gli annunci, /prova-gratuita/ (11/10/2026). Chrome senza finestra via DevTools Protocol, nessuna dipendenza.
// Uso:  1) nella cartella del sito: python -m http.server 8765      2) node tools/prova-landing.mjs [http://localhost:8765]
// Va bene anche su un'anteprima o sul sito vero: non manda niente a Google (le sue chiamate sono intercettate) e non apre davvero WhatsApp.
// Controlla: apertura visibile sopra la barra dei cookie su vari schermi, testo ingrandito, orario preso da /classes.json e suo ripiego,
// nessuna richiesta fuori dal sito prima del consenso (qualunque dominio, non solo Google), misura dopo il si', noindex e isolamento.
// NON prova che il messaggio arrivi a Sara: quella e' una prova a mano, da un telefono vero.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = (process.argv[2] || 'http://localhost:8765').replace(/\/$/, '');
const PAGINA = '/prova-gratuita/';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FOTO = process.env.FOTO || join(tmpdir(), 'prova-landing');
const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(FOTO, { recursive: true });
const PORTA = 9400 + Math.floor(Math.random() * 500);   // porta casuale: mai riusare un Chrome rimasto acceso
const NUMERO = '393737735552';
const esiti = [];
const verifica = (nome, ok, dettaglio = '') => { esiti.push(!!ok); console.log((ok ? '  ok   ' : '  FALLITA ') + nome + (dettaglio ? '  -> ' + String(dettaglio).slice(0, 400) : '')); };
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORTA, '--user-data-dir=' + mkdtempSync(join(tmpdir(), 'cr-')), '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });
let ws, seq = 0;
const attese = new Map(), ascolti = [];
async function collega() {
  for (let i = 0; i < 40; i++) {
    try {
      const lista = await (await fetch(`http://127.0.0.1:${PORTA}/json`)).json();
      ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
      await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
      ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && attese.has(d.id)) { attese.get(d.id)(d); attese.delete(d.id); } else if (d.method) ascolti.forEach((f) => f(d)); };
      return;
    } catch { await pausa(250); }
  }
  throw new Error('Chrome non risponde');
}
const cdp = (method, params = {}) => new Promise((ok, no) => { const id = ++seq; attese.set(id, (d) => d.error ? no(new Error(method + ': ' + d.error.message)) : ok(d.result)); ws.send(JSON.stringify({ id, method, params })); });
const js = async (espr) => { const r = await cdp('Runtime.evaluate', { expression: espr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };

// Rete: si annota ogni richiesta; quelle a Google (dopo il si') e a WhatsApp non partono davvero; /classes.json si puo' truccare.
let richieste = [], errori = [], classi = 'vero';   // 'vero' | 'rotto' | stringa JSON finta
const GOOGLE = /googletagmanager\.com|google-analytics\.com|doubleclick\.net|googleadservices\.com|google\.com\/(pagead|ccm)|googlesyndication\.com|analytics\.google\.com/;
ascolti.push((d) => {
  if (d.method === 'Network.requestWillBeSent') richieste.push(d.params.request.url);
  if (d.method === 'Runtime.exceptionThrown') errori.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  if (d.method !== 'Fetch.requestPaused') return;
  const u = d.params.request.url, id = d.params.requestId;
  if (/\/classes\.json(\?|$)/.test(u)) {
    if (classi === 'vero') cdp('Fetch.continueRequest', { requestId: id });
    else if (classi === 'rotto') cdp('Fetch.failRequest', { requestId: id, errorReason: 'Failed' });
    else cdp('Fetch.fulfillRequest', { requestId: id, responseCode: 200, responseHeaders: [{ name: 'content-type', value: 'application/json' }], body: Buffer.from(classi).toString('base64') });
  } else if (/gtag\/js/.test(u)) cdp('Fetch.fulfillRequest', { requestId: id, responseCode: 200, responseHeaders: [{ name: 'content-type', value: 'application/javascript' }], body: Buffer.from('/* finto */').toString('base64') });
  else cdp('Fetch.fulfillRequest', { requestId: id, responseCode: 204 });
});
const host = new URL(BASE).host;
const esterne = () => richieste.filter((u) => /^https?:/.test(u) && new URL(u).host !== host);
async function vai(percorso = PAGINA, attesa = 1800) { richieste = []; await cdp('Page.navigate', { url: BASE + percorso }); await pausa(attesa); }
let LARGO = 390;   // larghezza dello schermo impostata: i confronti si fanno con questa, non con innerWidth
const schermo = (w, h, mobile = true) => { LARGO = w; return cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile }); };
const foto = async (nome) => { const r = await cdp('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(FOTO, nome + '.png'), Buffer.from(r.data, 'base64')); };
const pulisci = async () => { await cdp('Network.clearBrowserCookies'); await js('try{localStorage.clear();sessionStorage.clear()}catch(e){}'); };
const aspetta = async (cond, ms = 9000) => { for (let i = 0; i < ms / 250; i++) { if (await cond()) return true; await pausa(250); } return false; };
const barra = () => js('(function(){var b=document.getElementById("smy-consenso"); if(!b) return null; var r=b.getBoundingClientRect(); return r.height>0 ? {alto:r.top, altezza:r.height} : null;})()');
const scatola = (sel) => js(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; var r=e.getBoundingClientRect(); return {alto:r.top, basso:r.bottom, sx:r.left, dx:r.right};})()`);
// vero se, al centro e a meta' dei quattro lati (rientrati: i pulsanti hanno gli angoli tondi), l'elemento in cima e' proprio lui: niente lo copre
const scoperto = (sel) => js(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); if(!e) return false; var r=e.getBoundingClientRect();
  var mx=r.left+r.width/2, my=r.top+r.height/2; var punti=[[mx,my],[r.left+16,my],[r.right-16,my],[mx,r.top+5],[mx,r.bottom-5]];
  return punti.every(function(p){var c=document.elementFromPoint(p[0],p[1]); return c && (c===e || e.contains(c));});})()`);
const trabocca = () => js(`Math.max(document.documentElement.scrollWidth, window.innerWidth) > ${LARGO} + 1`);

// L'orario atteso, calcolato qui in modo indipendente dallo script della pagina (stesse regole scritte una seconda volta).
const GIORNI = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];
const NOMI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
function attese_da(dati) {
  const out = [];
  for (const c of dati.classes || []) {
    if (!(c.active === true || c.active === 'true')) continue;
    const nome = String(c.name || '').replace(/\s+/g, ' ').trim();
    if (!nome || /gravidanza|prenatal|post\s*-?\s*parto|pancion/i.test(nome + ' ' + (c.desc || ''))) continue;
    if (c.frequency === 'mensile' || /mensile/i.test(c.desc || '')) continue;
    const g = GIORNI.indexOf(norm(c.day));
    const m = String(c.time || '').replace(/\./g, ':').match(/\d{1,2}:\d{2}/g);
    if (g < 0 || !m) continue;
    const inizio = m[0].padStart(5, '0');
    out.push({ g, inizio, nome, min: +inizio.slice(0, 2) * 60 + +inizio.slice(3) });
  }
  out.sort((a, b) => a.g - b.g || a.min - b.min);
  return out.map((c) => ({ giorno: NOMI[c.g], ora: c.inizio, nome: c.nome, testo: `Ciao Sara! Vorrei fare una prima prova di ${c.nome}, ${NOMI[c.g].toLowerCase()} alle ${c.inizio}. Qual è la prossima data disponibile?` }));
}
const righe = () => js(`JSON.stringify(Array.from(document.querySelectorAll('#lp-orario a.lp-riga')).map(function(a){
  return {href:a.href, tag:a.tagName, giorno:a.closest('.lp-giornata').querySelector('.lp-giorno').textContent, ora:a.querySelector('.lp-riga-ora').textContent, nome:a.querySelector('.lp-riga-nome').textContent,
          figli:a.querySelectorAll('a,button').length, nomeLetto:a.textContent.replace(/\\s+/g,' ').trim()};}))`).then(JSON.parse);
const stato = () => js('document.getElementById("lp-orario").getAttribute("data-stato")');

// contrasto WCAG tra il colore del testo e lo sfondo effettivo (risalendo gli antenati fino a uno sfondo pieno)
const CONTRASTO = `(function(sel){
  function rgb(s){var m=s.match(/[\\d.]+/g).map(Number); return {r:m[0],g:m[1],b:m[2],a:m.length>3?m[3]:1};}
  function lum(c){var v=[c.r,c.g,c.b].map(function(x){x/=255; return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4);}); return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2];}
  function sopra(a,b){return {r:a.r*a.a+b.r*(1-a.a), g:a.g*a.a+b.g*(1-a.a), b:a.b*a.a+b.b*(1-a.a), a:1};}
  var out=[]; document.querySelectorAll(sel).forEach(function(e){
    if(!e.offsetParent && getComputedStyle(e).position!=='fixed') return;
    if(e.closest('[aria-hidden="true"]')) return;   /* decorazioni: stelle, puntini separatori */
    var testo=Array.from(e.childNodes).some(function(n){return n.nodeType===3 && n.textContent.trim();}); if(!testo) return;
    var cs=getComputedStyle(e), col=rgb(cs.color), sf={r:250,g:247,b:242,a:1}, pila=[], x=e;
    while(x && x.nodeType===1){var b=rgb(getComputedStyle(x).backgroundColor); if(b.a>0) pila.push(b); if(b.a>=1) break; x=x.parentElement;}
    for(var i=pila.length-1;i>=0;i--) sf=sopra(pila[i],sf);
    var c=sopra(col,sf), L1=lum(c), L2=lum(sf), k=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    var px=parseFloat(cs.fontSize), grosso=px>=24 || (px>=18.66 && parseInt(cs.fontWeight,10)>=700);
    out.push({k:Math.round(k*100)/100, ok:k>=(grosso?3:4.5), chi:(e.className||e.tagName).toString().slice(0,30), t:e.textContent.trim().slice(0,28)});
  }); return JSON.stringify(out);})`;

try {
  await collega();
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
  await cdp('Fetch.enable', { patterns: [{ urlPattern: '*googletagmanager.com*' }, { urlPattern: '*google-analytics.com*' }, { urlPattern: '*analytics.google.com*' }, { urlPattern: '*doubleclick.net*' }, { urlPattern: '*googleadservices.com*' }, { urlPattern: '*google.com/pagead*' }, { urlPattern: '*google.com/ccm*' }, { urlPattern: '*googlesyndication.com*' }, { urlPattern: '*wa.me/*' }, { urlPattern: '*api.whatsapp.com/*' }, { urlPattern: '*/classes.json*' }] });
  await schermo(390, 844);
  await vai(); await pulisci();

  console.log('1. Apertura sopra la barra dei cookie, su piu\' schermi');
  for (const [w, h, mobile] of [[360, 640, true], [390, 844, true], [412, 915, true], [768, 1024, true], [1280, 800, false]]) {
    await schermo(w, h, mobile); await vai(); await aspetta(async () => !!(await barra()), 6000); await pausa(300);
    const b = await barra(), t = await scatola('.lp-hero h1'), c = await scatola('.lp-hero .lp-btn-wa');
    const limite = b ? b.alto : h;
    verifica(`${w}x${h}: barra dei cookie aperta`, !!b);
    verifica(`${w}x${h}: titolo e pulsante WhatsApp interi sopra la barra`, t && c && t.alto >= 0 && c.basso <= limite, `pulsante fino a ${c && Math.round(c.basso)}, barra da ${Math.round(limite)}`);
    verifica(`${w}x${h}: niente copre il pulsante principale ne' quello in alto`, (await scoperto('.lp-hero .lp-btn-wa')) && (await scoperto('.lp-bar .lp-btn')));
    verifica(`${w}x${h}: nessuno scorrimento orizzontale`, !(await trabocca()));
    await foto(`apertura-${w}x${h}`);
  }

  console.log('2. Testo ingrandito al 200 %');
  await schermo(360, 640); await vai();
  await js('document.documentElement.style.fontSize="200%"'); await pausa(500);
  verifica('200 %: nessuno scorrimento orizzontale', !(await trabocca()), await js('document.documentElement.scrollWidth + " / finestra " + innerWidth'));
  verifica('200 %: la barra in alto sta nello schermo', await js(`document.querySelector('.lp-bar .lp-btn').getBoundingClientRect().right <= ${LARGO} + 1 && document.querySelector('.lp-bar').scrollWidth <= ${LARGO} + 1`));
  const tagli = JSON.parse(await js(`JSON.stringify(Array.from(document.querySelectorAll('.lp-bar a, main a, main h1, main h2, main h3, main p, main li, main summary, main cite, main address')).filter(function(e){
    if(!e.offsetParent) return false; var r=e.getBoundingClientRect(); return r.left < -1 || r.right > ${LARGO} + 1 || e.scrollWidth > e.clientWidth + 2;}).map(function(e){return (e.className||e.tagName)+': '+e.textContent.trim().slice(0,30)+' ['+Math.round(e.getBoundingClientRect().right)+']';}))`));
  verifica('200 %: nessun testo tagliato o fuori dallo schermo', tagli.length === 0, tagli.join(' | '));
  const sovr = JSON.parse(await js(`(function(){var r=Array.from(document.querySelectorAll('#lp-orario a.lp-riga')).map(function(a){return a.getBoundingClientRect();}), k=0;
    for(var i=1;i<r.length;i++) if(r[i].top < r[i-1].bottom - 1) k++; return JSON.stringify({righe:r.length, sovrapposte:k});})()`));
  verifica('200 %: le righe dell\'orario non si sovrappongono', sovr.righe > 0 && sovr.sovrapposte === 0, JSON.stringify(sovr));
  await js('document.querySelector(".lp-hero .lp-btn-wa").scrollIntoView({block:"center"})'); await pausa(300);
  verifica('200 %: il pulsante principale si raggiunge scorrendo e resta intero', await js(`(function(){var r=document.querySelector(".lp-hero .lp-btn-wa").getBoundingClientRect(); return r.left>=0 && r.right<=${LARGO}+1 && r.height>0;})()`));
  await foto('testo-200');

  console.log('3. Orario preso da /classes.json');
  await schermo(390, 844); await vai(); await aspetta(async () => (await stato()) === 'ok');
  const vere = attese_da(await (await fetch(BASE + '/classes.json')).json());
  let r = await righe();
  verifica('orario caricato', (await stato()) === 'ok' && r.length > 0, 'righe: ' + r.length);
  verifica('stesse lezioni, stesso ordine di classes.json filtrato', JSON.stringify(r.map((x) => [x.giorno, x.ora, x.nome])) === JSON.stringify(vere.map((x) => [x.giorno, x.ora, x.nome])), JSON.stringify(r.map((x) => [x.giorno, x.ora, x.nome])) + ' / attese ' + vere.length);
  verifica('nessuna riga di gravidanza o mensile', !r.some((x) => /gravidanza|meditazione/i.test(x.nome)));
  verifica('ogni riga e\' un solo link vero a WhatsApp, senza pulsanti dentro', r.every((x) => x.tag === 'A' && x.href.startsWith(`https://wa.me/${NUMERO}?text=`) && x.figli === 0));
  verifica('il testo di ogni riga e\' quello previsto', r.every((x, i) => decodeURIComponent(x.href.split('text=')[1]) === vere[i].testo), r[0] && decodeURIComponent(r[0].href.split('text=')[1]));
  verifica('il nome letto di ogni riga dice giorno, ora e lezione', r.every((x) => x.nomeLetto.includes(x.giorno) && x.nomeLetto.includes(x.ora) && x.nomeLetto.includes(x.nome) && /fino alle/.test(x.nomeLetto)), r[0] && r[0].nomeLetto);
  const generici = JSON.parse(await js(`JSON.stringify(Array.from(document.querySelectorAll('a[href^="https://wa.me/"]')).filter(function(a){return !a.classList.contains('lp-riga');}).map(function(a){return decodeURIComponent(a.href.split('text=')[1]||'');}))`));
  verifica('i pulsanti generici portano il testo riconoscibile della pagina', generici.length >= 4 && generici.every((x) => x.startsWith('Ciao Sara! Vorrei fare una prima prova gratuita allo Studio Equilibra.')), generici.length + ' pulsanti');
  await js('document.getElementById("orario").scrollIntoView()'); await pausa(400);
  verifica('l\'ancora "Vedi gli orari" non finisce sotto la barra in alto', await js('document.getElementById("lp-orario-titolo").getBoundingClientRect().top >= document.querySelector(".lp-bar").getBoundingClientRect().bottom'));
  await foto('orario');

  console.log('4. Orario: ripiego onesto');
  classi = 'rotto'; await vai(); await aspetta(async () => (await stato()) === 'errore');
  verifica('classes.json irraggiungibile: nessuna riga, riquadro di ripiego visibile', (await stato()) === 'errore' && (await righe()).length === 0 && await js('getComputedStyle(document.querySelector(".lp-ripiego")).display !== "none"'));
  verifica('il ripiego offre WhatsApp e l\'orario del sito', await js('!!document.querySelector(".lp-ripiego a[href^=\\"https://wa.me/\\"]") && !!document.querySelector(".lp-ripiego a[href=\\"/lezioni-di-gruppo/\\"]")'));
  await foto('orario-ripiego');
  classi = JSON.stringify({ classes: [
    { active: true, name: 'Yoga <b>Prova</b>', day: 'Sabato', time: '10.00 - 11.00', location: 'x', maxSpots: 9, desc: '' },
    { active: true, name: 'Yoga in gravidanza', day: 'Lunedì', time: '10:00 - 11:00', maxSpots: 5, desc: '' },
    { active: false, name: 'Spenta', day: 'Lunedì', time: '09:00 - 10:00', maxSpots: 5, desc: '' },
    { active: true, name: 'Serale', day: 'Venerdì', time: '18:15 - 19:30', maxSpots: 5, frequency: 'mensile', desc: '' },
    { active: true, name: 'Senza giorno', day: 'Boh', time: '18:15', maxSpots: 5, desc: '' }] });
  await vai(); await aspetta(async () => (await stato()) === 'ok');
  r = await righe();
  verifica('classes.json cambiato: la pagina mostra solo la lezione nuova valida', r.length === 1 && r[0].giorno === 'Sabato' && r[0].ora === '10:00', JSON.stringify(r.map((x) => [x.giorno, x.ora, x.nome])));
  verifica('i testi del file entrano come testo, mai come HTML', r.length === 1 && r[0].nome === 'Yoga <b>Prova</b>' && await js('document.querySelectorAll("#lp-orario b").length === 0'));
  classi = JSON.stringify({ classes: [] });
  await vai(); await aspetta(async () => (await stato()) === 'errore');
  verifica('nessuna lezione valida: ripiego, non un orario vuoto', (await stato()) === 'errore' && (await righe()).length === 0);
  classi = 'vero';

  console.log('5. Riservatezza: niente esce dal sito prima del consenso');
  await pulisci(); await vai(PAGINA, 2500);
  await js('window.scrollTo(0, document.documentElement.scrollHeight)'); await pausa(1500);
  await js('window.scrollTo(0, document.documentElement.scrollHeight / 2)'); await pausa(800);
  await js('document.querySelectorAll("details").forEach(function(d){d.open=true;})'); await pausa(500);
  verifica('prima della scelta, scorrendo fino in fondo: nessuna richiesta fuori dal sito', esterne().length === 0, [...new Set(esterne().map((u) => new URL(u).host))].join(', '));
  verifica('nessun cookie scritto', (await js('document.cookie')) === '', await js('document.cookie'));
  verifica('nessun file caricato da altri domini nel codice della pagina', await js(`Array.from(document.querySelectorAll('img[src], script[src], link[rel="stylesheet"], link[rel="preload"], iframe, video, audio, source')).every(function(e){var u=e.src||e.href||''; return !u || new URL(u, location.href).host===location.host;})`));

  console.log('6. Misura dopo il si\' (chiamate a Google intercettate, WhatsApp non si apre davvero)');
  await js('document.querySelector("#smy-consenso .smy-si").click()');
  await aspetta(async () => richieste.some((u) => /gtag\/js/.test(u)));
  verifica('dopo "Accetta tutti" parte il tag di Google', richieste.some((u) => /gtag\/js/.test(u)));
  await aspetta(async () => (await stato()) === 'ok');
  await js('window.__clic = []; var __p = window.misura; window.misura = function(e, p){ window.__clic.push([e, JSON.stringify(p||{})]); return __p.apply(this, arguments); };');
  await js('(function(){var a=document.querySelector("#lp-orario a.lp-riga"); a.addEventListener("click", function(e){e.preventDefault();}); a.click();})()'); await pausa(600);
  let c = JSON.parse(await js('JSON.stringify(window.__clic)'));
  verifica('clic su una riga dell\'orario: clic_whatsapp con la sola posizione', c.length === 1 && c[0][0] === 'clic_whatsapp' && c[0][1] === '{"posizione":"corpo"}', JSON.stringify(c));
  await js('window.__clic = []; (function(){var a=document.querySelector(".lp-bar a"); a.addEventListener("click", function(e){e.preventDefault();}); a.click();})()'); await pausa(400);
  await js('(function(){var a=document.querySelector("main a[href^=\\"tel:\\"]"); a.addEventListener("click", function(e){e.preventDefault();}); a.click();})()'); await pausa(400);
  await js('(function(){var a=document.querySelector("main a[href^=\\"mailto:\\"]"); a.addEventListener("click", function(e){e.preventDefault();}); a.click();})()'); await pausa(400);
  c = JSON.parse(await js('JSON.stringify(window.__clic)'));
  verifica('pulsante in alto, telefono ed email contati, sempre con la sola posizione', JSON.stringify(c) === JSON.stringify([['clic_whatsapp', '{"posizione":"corpo"}'], ['clic_telefono', '{"posizione":"corpo"}'], ['clic_email', '{"posizione":"corpo"}']]), JSON.stringify(c));
  const strato = await js('JSON.stringify(Array.from(window.dataLayer||[]).map(function(a){return Array.from(a);}))');
  verifica('a Google non va ne\' il nome della lezione ne\' il testo del messaggio', !/Yoga Dolce|Hatha|Vinyasa|Ciao Sara|wa\.me/i.test(strato) && !richieste.some((u) => GOOGLE.test(u) && /Yoga%20Dolce|Hatha|Vinyasa|Ciao%20Sara/i.test(u)));
  verifica('"Preferenze cookie" nel pie\' di pagina riapre la barra', await js('(function(){document.querySelector("footer a[data-preferenze-cookie]").click(); return !!document.getElementById("smy-consenso");})()'));

  console.log('7. Indicizzazione e isolamento');
  await pulisci(); await vai();
  verifica('noindex presente, nessun canonical, nessun dato strutturato', await js('(document.querySelector("meta[name=robots]")||{}).content === "noindex, follow" && !document.querySelector("link[rel=canonical]") && !document.querySelector("script[type=\\"application/ld+json\\"]")'));
  const mappa = await (await fetch(BASE + '/sitemap.xml')).text();
  verifica('la pagina non e\' nella sitemap', !/prova-gratuita/.test(mappa));
  const robots = await (await fetch(BASE + '/robots.txt')).text();
  verifica('robots.txt non la blocca (il lettore di Google Ads deve poterla aprire)', !/Disallow:\s*\/prova-gratuita/i.test(robots));
  verifica('non usa header diretto, identificativi di prenotazione o eventi, ne\' .fade-in', await js('!document.querySelector("body > header") && !document.getElementById("classes-container") && !document.getElementById("events-container") && !document.getElementById("booking-modal") && !document.querySelector(".fade-in") && !document.querySelector(".whatsapp-container")'));
  verifica('un solo h1 e titoli in ordine', await js('document.querySelectorAll("h1").length === 1 && Array.from(document.querySelectorAll("main h1, main h2, main h3")).every(function(h,i,a){return i===0 || +h.tagName[1] - +a[i-1].tagName[1] <= 1;})'));
  verifica('ogni immagine ha testo alternativo, larghezza e altezza', await js('Array.from(document.querySelectorAll("img")).every(function(i){return i.hasAttribute("alt") && i.getAttribute("width") && i.getAttribute("height");})'));
  await aspetta(async () => (await stato()) === 'ok');
  const k = JSON.parse(await js(CONTRASTO + '(".lp-bar a, main *, footer *")'));
  const scarsi = k.filter((x) => !x.ok);
  verifica(`contrasto del testo sufficiente (AA) su ${k.length} elementi`, k.length > 40 && scarsi.length === 0, scarsi.map((x) => `${x.k} ${x.chi} "${x.t}"`).join(' | '));
  // nel codice del sito nessuna pagina deve collegarla (si controlla solo se si lavora dalla cartella del sito)
  if (existsSync(join(RADICE, 'index.html'))) {
    const trovati = [];
    const gira = (d) => { for (const n of readdirSync(d)) { if (n === 'node_modules' || n === '.git' || n === 'tools' || n === 'prova-gratuita') continue; const p = join(d, n); const s = statSync(p); if (s.isDirectory()) gira(p); else if (/\.(html|js|xml|txt|json|toml)$/.test(n) && n !== 'CLAUDE.md' && /prova-gratuita/.test(readFileSync(p, 'utf8'))) trovati.push(p.slice(RADICE.length + 1)); } };
    gira(RADICE);
    verifica('nessun file del sito collega o nomina la pagina', trovati.length === 0, trovati.join(', '));
  }
  verifica('nessun errore JavaScript in tutta la prova', errori.length === 0, errori.slice(0, 3).join(' | '));
} catch (e) {
  verifica('la prova e\' arrivata in fondo', false, e.message);
} finally {
  try { ws?.close(); } catch {}
  spawnSync('taskkill', ['/pid', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
  try { chrome.kill(); } catch {}
}
const ok = esiti.filter(Boolean).length;
console.log(`\n${ok} verifiche su ${esiti.length}` + (ok === esiti.length ? ' — tutto a posto' : ' — CI SONO FALLIMENTI') + `   (schermate in ${FOTO})`);
process.exit(ok === esiti.length ? 0 : 1);
