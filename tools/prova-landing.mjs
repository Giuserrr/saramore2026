// Collaudo della pagina di arrivo per gli annunci, /prova-gratuita/ (11/10/2026). Chrome senza finestra via DevTools Protocol, nessuna dipendenza.
// Uso:  1) nella cartella del sito: python -m http.server 8765      2) node tools/prova-landing.mjs [http://localhost:8765]
// Va bene anche su un'anteprima o sul sito vero: le chiamate a Google sono intercettate (non partono) e WhatsApp non si apre davvero.
//
// Che cosa prova: apertura sopra la barra dei cookie su piu' schermi; testo ingrandito; orario letto da /classes.json, con i casi
// storti (orari impossibili, altra sede, file rotto, risposta lenta, ritorno sulla pagina, JavaScript spento); nessuna richiesta
// fuori dal sito prima del consenso; che cosa la pagina passa alla misura dopo il si'; tastiera e contrasti; indicizzazione e link dal sito.
//
// Che cosa NON prova (va fatto a mano, da telefoni veri): Safari di iPhone e i browser diversi da Chrome; l'ingrandimento vero del
// browser (qui si raddoppia il carattere di base, e la barra dei cookie resta com'e'); l'apertura reale di WhatsApp e l'arrivo del
// messaggio a Sara; un lettore di schermo; che cosa il tag vero di Google spedisce (qui gtag.js e' sostituito da un file vuoto:
// si vede solo che cosa la pagina gli consegna).
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = (process.argv[2] || 'http://localhost:8765').replace(/\/$/, '');
const PAGINA = '/prova-gratuita/';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FOTO = process.env.FOTO || join(tmpdir(), 'prova-landing');
const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(FOTO, { recursive: true });
const PORTA = 9400 + Math.floor(Math.random() * 500);   // porta casuale: mai riusare un Chrome rimasto acceso
const NUMERO = '393737735552';
const SEDE = 'Piazza Alessi 2/3 — Studio Equilibra';
const esiti = [];
const verifica = (nome, ok, dettaglio = '') => { esiti.push(!!ok); console.log((ok ? '  ok   ' : '  FALLITA ') + nome + (dettaglio ? '  -> ' + String(dettaglio).slice(0, 420) : '')); };
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

// Rete: si annota ogni richiesta; quelle a Google e a WhatsApp non partono davvero; /classes.json si puo' truccare.
// classi = 'vero' | 'rotto' | { corpo: '...', ritardo: ms }
let richieste = [], errori = [], classi = 'vero';
const GOOGLE = /googletagmanager\.com|google-analytics\.com|doubleclick\.net|googleadservices\.com|google\.com\/(pagead|ccm)|googlesyndication\.com|analytics\.google\.com/;
ascolti.push((d) => {
  if (d.method === 'Network.requestWillBeSent') richieste.push(d.params.request.url);
  if (d.method === 'Runtime.exceptionThrown') errori.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  if (d.method !== 'Fetch.requestPaused') return;
  const u = d.params.request.url, id = d.params.requestId;
  const tace = (p) => p.catch(() => {});   // una richiesta annullata dalla pagina (tempo scaduto) non e' un errore della prova
  if (/\/classes\.json(\?|$)/.test(u)) {
    if (classi === 'vero') tace(cdp('Fetch.continueRequest', { requestId: id }));
    else if (classi === 'rotto') tace(cdp('Fetch.failRequest', { requestId: id, errorReason: 'Failed' }));
    else { const scelta = classi; setTimeout(() => tace(cdp('Fetch.fulfillRequest', { requestId: id, responseCode: 200, responseHeaders: [{ name: 'content-type', value: 'application/json' }], body: Buffer.from(scelta.corpo).toString('base64') })), scelta.ritardo || 0); }
  } else if (/gtag\/js/.test(u)) tace(cdp('Fetch.fulfillRequest', { requestId: id, responseCode: 200, responseHeaders: [{ name: 'content-type', value: 'application/javascript' }], body: Buffer.from('/* finto */').toString('base64') }));
  else tace(cdp('Fetch.fulfillRequest', { requestId: id, responseCode: 204 }));
});
const finto = (lista, ritardo = 0) => ({ corpo: typeof lista === 'string' ? lista : JSON.stringify({ classes: lista }), ritardo });
const host = new URL(BASE).host;
// Sulle anteprime Netlify (deploy-preview-N--sito.netlify.app) Netlify aggiunge da solo la sua barra degli strumenti, caricata da
// app.netlify.com: in produzione non c'e'. La si ignora solo li', e lo si dice.
const ANTEPRIMA = /--[a-z0-9-]+\.netlify\.app$/.test(host);
const diNetlify = (u) => ANTEPRIMA && new URL(u, BASE).host === 'app.netlify.com';
const esterne = () => richieste.filter((u) => /^https?:/.test(u) && new URL(u).host !== host && !diNetlify(u));
async function vai(percorso = PAGINA, attesa = 1800) { richieste = []; await cdp('Page.navigate', { url: BASE + percorso }); await pausa(attesa); }
let LARGO = 390;   // larghezza dello schermo impostata: i confronti si fanno con questa, non con innerWidth (che su telefono simulato cresce se qualcosa sborda)
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
const tab = async () => { for (const type of ['keyDown', 'keyUp']) await cdp('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 }); await pausa(120); };
// nome accessibile calcolato dal browser (non il semplice testo)
async function nomeAccessibile(sel) {
  const r = await cdp('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(sel)})` });
  if (!r.result.objectId) return '';
  const a = await cdp('Accessibility.getPartialAXTree', { objectId: r.result.objectId, fetchRelatives: false });
  return (a.nodes[0]?.name?.value || '').replace(/\s+/g, ' ').trim();
}

// L'orario atteso, calcolato qui con regole scritte una seconda volta e in altro modo (non copiate dalla pagina).
const GIORNI = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];
const NOMI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
function attese_da(dati) {
  const out = [];
  for (const c of dati.classes || []) {
    if (!(c.active === true || c.active === 'true')) continue;
    const nome = String(c.name || '').replace(/\s+/g, ' ').trim();
    if (!nome || /gravidanza|prenatal|parto|pancion|mamm/i.test(nome)) continue;
    if (norm(c.frequency) === 'mensile' || /mensile/i.test(c.desc || '')) continue;
    const pezzi = String(c.time || '').replace(/\./g, ':').split(/\s*[-–—]\s*/);
    const ora = (x) => { const m = /^(\d{1,2}):(\d{2})$/.exec((x || '').trim()); return m && +m[1] < 24 && +m[2] < 60 ? { t: m[1].padStart(2, '0') + ':' + m[2], min: +m[1] * 60 + +m[2] } : null; };
    const a = ora(pezzi[0]), b = pezzi.length > 1 ? ora(pezzi[1]) : null;
    const g = GIORNI.indexOf(norm(c.day));
    if (g < 0 || !a || pezzi.length > 2 || (pezzi.length === 2 && (!b || b.min <= a.min)) || !/equilibra|alessi/.test(norm(c.location)) || (norm(c.frequency) && norm(c.frequency) !== 'settimanale')) continue;
    out.push({ g, inizio: a.t, fine: b ? b.t : '', nome, min: a.min });
  }
  out.sort((x, y) => x.g - y.g || x.min - y.min);
  return out.map((c) => ({ giorno: NOMI[c.g], ora: c.inizio, fine: c.fine, nome: c.nome, testo: `Ciao Sara! Vorrei fare una prima prova di ${c.nome}, ${NOMI[c.g].toLowerCase()} alle ${c.inizio}. Qual è la prossima data disponibile?` }));
}
const righe = () => js(`JSON.stringify(Array.from(document.querySelectorAll('#lp-orario a.lp-riga')).map(function(a){
  var f=a.querySelector('.lp-riga-fine'); f = f ? f.lastChild.textContent : '';
  return {href:a.href, tag:a.tagName, giorno:a.closest('.lp-giornata').querySelector('.lp-giorno').textContent, ora:a.querySelector('.lp-riga-ora').textContent, fine:f, nome:a.querySelector('.lp-riga-nome').textContent, figli:a.querySelectorAll('a,button').length};}))`).then(JSON.parse);
const stato = () => js('document.getElementById("lp-orario").getAttribute("data-stato")');
const tre = (r) => JSON.stringify(r.map((x) => [x.giorno, x.ora, x.fine, x.nome]));

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
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable'); await cdp('Accessibility.enable');
  await cdp('Fetch.enable', { patterns: [{ urlPattern: '*googletagmanager.com*' }, { urlPattern: '*google-analytics.com*' }, { urlPattern: '*analytics.google.com*' }, { urlPattern: '*doubleclick.net*' }, { urlPattern: '*googleadservices.com*' }, { urlPattern: '*google.com/pagead*' }, { urlPattern: '*google.com/ccm*' }, { urlPattern: '*googlesyndication.com*' }, { urlPattern: '*wa.me/*' }, { urlPattern: '*api.whatsapp.com/*' }, { urlPattern: '*/classes.json*' }] });
  await schermo(390, 844);
  await vai(); await pulisci();
  if (ANTEPRIMA) console.log('  (anteprima Netlify: la barra degli strumenti che Netlify aggiunge alle anteprime non viene contata; in produzione non esiste)');
  const risposta = await fetch(BASE + PAGINA);
  await risposta.arrayBuffer();   // il corpo va letto fino in fondo: lasciato a meta', con un server che chiude la connessione, manda in errore il fetch di Node
  verifica('la pagina risponde 200 in HTML e il server non la esclude con un header', risposta.status === 200 && /text\/html/.test(risposta.headers.get('content-type') || '') && !/none|noarchive/i.test(risposta.headers.get('x-robots-tag') || ''), risposta.status + ' ' + (risposta.headers.get('x-robots-tag') || 'nessun x-robots-tag'));

  console.log('1. Apertura sopra la barra dei cookie, su piu\' schermi');
  for (const [w, h, mobile] of [[320, 568, true], [360, 640, true], [390, 844, true], [412, 915, true], [768, 1024, true], [1280, 800, false]]) {
    await schermo(w, h, mobile); await vai(); await aspetta(async () => !!(await barra()), 6000); await pausa(300);
    const b = await barra(), t = await scatola('.lp-hero h1'), c = await scatola('.lp-hero .lp-btn-wa');
    const limite = b ? b.alto : h;
    verifica(`${w}x${h}: barra dei cookie aperta`, !!b);
    verifica(`${w}x${h}: titolo e pulsante WhatsApp interi sopra la barra`, t && c && t.alto >= 0 && c.basso <= limite, `pulsante fino a ${c && Math.round(c.basso)}, barra da ${Math.round(limite)}`);
    verifica(`${w}x${h}: niente copre il pulsante principale ne' quello in alto`, (await scoperto('.lp-hero .lp-btn-wa')) && (await scoperto('.lp-bar .lp-btn')));
    verifica(`${w}x${h}: nessuno scorrimento orizzontale`, !(await trabocca()));
    await foto(`apertura-${w}x${h}`);
  }

  console.log('2. Carattere di base raddoppiato (approssima il testo al 200 %; l\'ingrandimento vero va provato a mano)');
  await schermo(360, 640); await vai(); await aspetta(async () => (await stato()) === 'ok');
  await js('document.documentElement.style.fontSize="200%"'); await pausa(500);
  verifica('200 %: nessuno scorrimento orizzontale', !(await trabocca()), await js('document.documentElement.scrollWidth + " / finestra " + innerWidth'));
  verifica('200 %: la barra in alto sta nello schermo', await js(`document.querySelector('.lp-bar .lp-btn').getBoundingClientRect().right <= ${LARGO} + 1 && document.querySelector('.lp-bar').scrollWidth <= ${LARGO} + 1`));
  const tagli = JSON.parse(await js(`JSON.stringify(Array.from(document.querySelectorAll('.lp-bar a, main a, main h1, main h2, main h3, main p, main li, main summary, main cite, main address')).filter(function(e){
    if(!e.offsetParent || e.classList.contains('lp-vh')) return false; var r=e.getBoundingClientRect(); return r.left < -1 || r.right > ${LARGO} + 1 || e.scrollWidth > e.clientWidth + 2;}).map(function(e){return (e.className||e.tagName)+': '+e.textContent.trim().slice(0,30)+' ['+Math.round(e.getBoundingClientRect().right)+']';}))`));
  verifica('200 %: nessun testo tagliato o fuori dallo schermo', tagli.length === 0, tagli.join(' | '));
  const sovr = JSON.parse(await js(`(function(){var r=Array.from(document.querySelectorAll('#lp-orario a.lp-riga')).map(function(a){return a.getBoundingClientRect();}), k=0;
    for(var i=1;i<r.length;i++) if(r[i].top < r[i-1].bottom - 1) k++; return JSON.stringify({righe:r.length, sovrapposte:k});})()`));
  verifica('200 %: le righe dell\'orario non si sovrappongono', sovr.righe > 0 && sovr.sovrapposte === 0, JSON.stringify(sovr));
  await js('(function(){var b=document.getElementById("smy-consenso"); if(b) b.style.display="none";})()');   // la barra dei cookie non si ingrandisce col carattere: qui si guarda solo la pagina
  await js('document.querySelector(".lp-hero .lp-btn-wa").scrollIntoView({block:"center"})'); await pausa(300);
  verifica('200 %: il pulsante principale si raggiunge scorrendo, resta intero e niente lo copre', (await js(`(function(){var r=document.querySelector(".lp-hero .lp-btn-wa").getBoundingClientRect(); return r.left>=0 && r.right<=${LARGO}+1 && r.top>=document.querySelector(".lp-bar").getBoundingClientRect().bottom && r.bottom<=innerHeight;})()`)) && (await scoperto('.lp-hero .lp-btn-wa')));
  await foto('testo-200');

  console.log('3. Orario letto da /classes.json');
  await schermo(390, 844); await vai(); await aspetta(async () => (await stato()) === 'ok');
  const vere = attese_da(await (await fetch(BASE + '/classes.json')).json());
  let r = await righe();
  verifica('orario caricato', (await stato()) === 'ok' && r.length > 0, 'righe: ' + r.length);
  verifica('stesse lezioni, stesso ordine, stesse ore di inizio e di fine di classes.json filtrato', tre(r) === tre(vere), tre(r) + ' / attese ' + vere.length);
  verifica('nessuna riga di gravidanza o mensile', !r.some((x) => /gravidanza|meditazione/i.test(x.nome)));
  verifica('ogni riga e\' un solo link vero a WhatsApp, senza pulsanti dentro', r.every((x) => x.tag === 'A' && x.href.startsWith(`https://wa.me/${NUMERO}?text=`) && x.figli === 0));
  verifica('il testo di ogni riga e\' quello previsto', r.every((x, i) => decodeURIComponent(x.href.split('text=')[1]) === vere[i].testo), r[0] && decodeURIComponent(r[0].href.split('text=')[1]));
  const nome1 = await nomeAccessibile('#lp-orario a.lp-riga');
  verifica('il nome accessibile della prima riga dice giorno, ore, lezione e WhatsApp', r.length > 0 && [r[0].giorno, r[0].ora, 'fino alle ' + r[0].fine, r[0].nome, 'WhatsApp'].every((x) => nome1.includes(x)), nome1);
  verifica('nessuna nota "altre lezioni" quando niente e\' stato scartato', await js('!document.querySelector("#lp-orario .lp-altre")'));
  verifica('lo stato dell\'orario e\' detto ai lettori di schermo e l\'attesa e\' finita', await js('/Orari caricati: \\d+ lezioni/.test(document.getElementById("lp-orario-stato").textContent) && !document.getElementById("lp-orario").hasAttribute("aria-busy")'));
  const generici = JSON.parse(await js(`JSON.stringify(Array.from(document.querySelectorAll('a[href^="https://wa.me/"]')).filter(function(a){return !a.classList.contains('lp-riga');}).map(function(a){return decodeURIComponent(a.href.split('text=')[1]||'');}))`));
  verifica('i pulsanti generici portano il testo riconoscibile della pagina', generici.length >= 4 && generici.every((x) => x.startsWith('Ciao Sara! Vorrei fare una prima prova gratuita allo Studio Equilibra.')), generici.length + ' pulsanti');
  await js('document.getElementById("orario").scrollIntoView()'); await pausa(400);
  verifica('l\'ancora "Vedi gli orari" non finisce sotto la barra in alto', await js('document.getElementById("lp-orario-titolo").getBoundingClientRect().top >= document.querySelector(".lp-bar").getBoundingClientRect().bottom'));
  await foto('orario');

  console.log('4. Orario: dati storti, file rotto, risposta lenta, ritorno sulla pagina, JavaScript spento');
  const ripiegoVisibile = () => js('getComputedStyle(document.querySelector(".lp-ripiego")).display !== "none"');
  classi = 'rotto'; await vai(); await aspetta(async () => (await stato()) === 'errore');
  verifica('classes.json irraggiungibile: nessuna riga, riquadro di ripiego visibile', (await stato()) === 'errore' && (await righe()).length === 0 && await ripiegoVisibile());
  verifica('il ripiego offre WhatsApp e l\'orario del sito', await js('!!document.querySelector(".lp-ripiego a[href^=\\"https://wa.me/\\"]") && !!document.querySelector(".lp-ripiego a[href=\\"/lezioni-di-gruppo/\\"]")'));
  await foto('orario-ripiego');
  classi = finto('{ questo non e\' json'); await vai(); await aspetta(async () => (await stato()) === 'errore');
  verifica('classes.json illeggibile: ripiego', (await stato()) === 'errore' && (await righe()).length === 0);
  classi = finto([]); await vai(); await aspetta(async () => (await stato()) === 'errore');
  verifica('nessuna lezione valida: ripiego, non un orario vuoto', (await stato()) === 'errore' && (await righe()).length === 0);
  const buona = { active: true, name: 'Yoga <b>Prova</b>', day: 'Sabato', time: '10.00 - 11.00', location: SEDE, maxSpots: 9, desc: '' };
  const storte = [
    { active: true, name: 'Yoga in gravidanza', day: 'Lunedì', time: '10:00 - 11:00', location: SEDE, desc: '' },
    { active: false, name: 'Spenta', day: 'Lunedì', time: '09:00 - 10:00', location: SEDE, desc: '' },
    { active: true, name: 'Serale', day: 'Venerdì', time: '18:15 - 19:30', location: SEDE, frequency: 'mensile', desc: '' },
    { active: true, name: 'Giorno sbagliato', day: 'Boh', time: '18:15 - 19:15', location: SEDE, desc: '' },
    { active: true, name: 'Fine impossibile', day: 'Lunedì', time: '10:00 - 99:99', location: SEDE, desc: '' },
    { active: true, name: 'Ora impossibile', day: 'Lunedì', time: '110:00', location: SEDE, desc: '' },
    { active: true, name: 'Due orari', day: 'Lunedì', time: '10:00 oppure 18:00', location: SEDE, desc: '' },
    { active: true, name: 'Fine prima dell\'inizio', day: 'Lunedì', time: '19:00 - 18:00', location: SEDE, desc: '' },
    { active: true, name: 'Altra sede', day: 'Lunedì', time: '10:00 - 11:00', location: 'Palestra Altrove', desc: '' },
    { active: true, name: 'Ogni due settimane', day: 'Lunedì', time: '10:00 - 11:00', location: SEDE, frequency: 'quindicinale', desc: '' }];
  classi = finto([buona, ...storte]); await vai(); await aspetta(async () => (await stato()) === 'ok');
  r = await righe();
  verifica('dati storti: resta solo la lezione valida (via orari impossibili o doppi, fine prima dell\'inizio, altra sede, frequenza sconosciuta, gravidanza, mensile, spenta)', r.length === 1 && r[0].giorno === 'Sabato' && r[0].ora === '10:00' && r[0].fine === '11:00', tre(r));
  verifica('i testi del file entrano come testo, mai come HTML', r.length === 1 && r[0].nome === 'Yoga <b>Prova</b>' && await js('document.querySelectorAll("#lp-orario b").length === 0'));
  verifica('quando qualcosa e\' stato scartato la pagina lo dice e offre di chiedere', await js('(function(){var p=document.querySelector("#lp-orario .lp-altre"); return !!p && !!p.querySelector("a[href^=\\"https://wa.me/\\"]");})()'));
  // ritorno sulla pagina: stesso orario = niente ridisegnato; orario cambiato = righe nuove; rilettura fallita = resta quello che c'era
  await js('document.querySelector("#lp-orario a.lp-riga").__segno = 1; window.dispatchEvent(new PageTransitionEvent("pageshow", {persisted:true}));'); await pausa(900);
  verifica('ritorno sulla pagina con lo stesso orario: la riga non viene ridisegnata (il fuoco non si perde)', await js('document.querySelector("#lp-orario a.lp-riga").__segno === 1'));
  classi = finto([{ ...buona, name: 'Yoga Nuova', day: 'Domenica' }]);
  await js('window.dispatchEvent(new PageTransitionEvent("pageshow", {persisted:true}));'); await aspetta(async () => (await righe())[0]?.nome === 'Yoga Nuova', 5000);
  r = await righe();
  verifica('ritorno sulla pagina dopo un cambio di orario: compaiono le righe nuove', r.length === 1 && r[0].nome === 'Yoga Nuova' && r[0].giorno === 'Domenica', tre(r));
  classi = 'rotto';
  await js('window.dispatchEvent(new PageTransitionEvent("pageshow", {persisted:true}));'); await pausa(1200);
  verifica('rilettura fallita: resta l\'orario gia\' mostrato, non sparisce', (await stato()) === 'ok' && (await righe()).length === 1);
  // stesse lezioni, ma le righe scartate passano da una a due: non si ridisegna niente
  classi = finto([{ ...buona, name: 'Yoga Nuova', day: 'Domenica' }, storte[4]]);
  await js('window.dispatchEvent(new PageTransitionEvent("pageshow", {persisted:true}));'); await aspetta(async () => await js('!!document.querySelector("#lp-orario .lp-altre")'), 5000);
  await js('document.querySelector("#lp-orario a.lp-riga").__segno = 2;');
  classi = finto([{ ...buona, name: 'Yoga Nuova', day: 'Domenica' }, storte[4], storte[5]]);
  await js('window.dispatchEvent(new PageTransitionEvent("pageshow", {persisted:true}));'); await pausa(1200);
  verifica('cambia solo il numero delle righe scartate: le lezioni non vengono ridisegnate', await js('document.querySelector("#lp-orario a.lp-riga").__segno === 2') && (await righe()).length === 1);
  // orario cambiato mentre il fuoco e' su una riga: le righe nuove arrivano e il fuoco resta nell'orario
  await js('document.querySelector("#lp-orario a.lp-riga").focus()');
  classi = finto([{ ...buona, name: 'Yoga Altra', day: 'Sabato' }]);
  await js('window.dispatchEvent(new PageTransitionEvent("pageshow", {persisted:true}));'); await aspetta(async () => (await righe())[0]?.nome === 'Yoga Altra', 5000);
  verifica('orario cambiato con il fuoco su una riga: il fuoco passa alla prima riga nuova, non si perde', (await righe())[0]?.nome === 'Yoga Altra' && await js('document.activeElement === document.querySelector("#lp-orario a.lp-riga")'));
  await js('document.activeElement.blur()');
  // il file torna valido ma senza lezioni da mostrare: le righe vecchie devono sparire
  classi = finto([storte[0], storte[1]]);
  await js('window.dispatchEvent(new PageTransitionEvent("pageshow", {persisted:true}));'); await aspetta(async () => (await stato()) === 'errore', 5000);
  verifica('orario svuotato dopo un primo caricamento riuscito: via le righe vecchie, torna il riquadro di ripiego', (await stato()) === 'errore' && (await righe()).length === 0 && await ripiegoVisibile());
  // prima lettura fallita, poi la rete torna: la pagina si riprende da sola
  classi = 'rotto'; await vai(); await aspetta(async () => (await stato()) === 'errore');
  classi = finto([buona]);
  await js('window.dispatchEvent(new Event("online"))'); await aspetta(async () => (await stato()) === 'ok', 5000);
  verifica('prima lettura fallita, poi torna la rete: l\'orario compare da solo', (await stato()) === 'ok' && (await righe()).length === 1);
  classi = 'rotto'; await vai(); await aspetta(async () => (await stato()) === 'errore');
  classi = finto([buona]);
  await js('document.dispatchEvent(new Event("visibilitychange"))'); await pausa(900);
  const subito = await stato();
  await js('(function(){var v=Date.now; Date.now=function(){return v()+31000;}; document.dispatchEvent(new Event("visibilitychange"));})()'); await aspetta(async () => (await stato()) === 'ok', 5000);
  verifica('prima lettura fallita: tornando sulla scheda dopo mezzo minuto si riprova (non a raffica)', subito === 'errore' && (await stato()) === 'ok', 'subito: ' + subito + ', dopo: ' + (await stato()));
  // risposta lenta: dopo 6 secondi il ripiego, e la risposta che arriva tardi non lo sostituisce
  classi = finto([buona], 8500); await vai(PAGINA, 800);
  verifica('durante l\'attesa lo spazio e\' riservato e l\'orario e\' segnato come in caricamento', (await stato()) === 'attesa' && await js('document.getElementById("lp-orario").getAttribute("aria-busy") === "true" && document.getElementById("lp-orario").getBoundingClientRect().height > 300'));
  await aspetta(async () => (await stato()) === 'errore', 8000);
  verifica('dopo 6 secondi senza risposta: ripiego', (await stato()) === 'errore' && await ripiegoVisibile());
  await pausa(4000);
  verifica('la risposta arrivata tardi non sostituisce il ripiego', (await stato()) === 'errore' && (await righe()).length === 0 && await ripiegoVisibile());
  const senza = await cdp('Page.addScriptToEvaluateOnNewDocument', { source: 'window.AbortController = undefined;' });
  classi = finto([buona], 8500); await vai(PAGINA, 800);
  await aspetta(async () => (await stato()) === 'errore', 8000); await pausa(4500);
  verifica('lo stesso su un browser che non sa annullare la richiesta: la risposta tardiva arriva e viene ignorata', (await js('typeof window.AbortController')) === 'undefined' && (await stato()) === 'errore' && (await righe()).length === 0 && await ripiegoVisibile());
  await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: senza.identifier });
  classi = 'vero';
  await cdp('Emulation.setScriptExecutionDisabled', { value: true }); await vai();
  verifica('JavaScript spento: ripiego visibile, nessun orario, pulsante principale funzionante', (await ripiegoVisibile()) && (await righe()).length === 0 && await js(`document.querySelector(".lp-hero .lp-btn-wa").href.indexOf("https://wa.me/${NUMERO}?text=") === 0`));
  await cdp('Emulation.setScriptExecutionDisabled', { value: false });
  // salti di pagina quando l'orario arriva (misurati restando in cima)
  const cls0 = await cdp('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__cls=0; try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){if(!e.hadRecentInput) window.__cls+=e.value;});}).observe({type:"layout-shift",buffered:true});}catch(e){}' });
  classi = finto(JSON.stringify(await (await fetch(BASE + '/classes.json')).json()), 2500); await vai(PAGINA, 5000);
  const cls = await js('Math.round(window.__cls*1000)/1000');
  verifica('l\'orario che arriva in ritardo non fa saltare la pagina (CLS sotto 0,05)', (await stato()) === 'ok' && cls < 0.05, 'CLS ' + cls);
  await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: cls0.identifier });
  classi = 'vero';

  console.log('5. Riservatezza: niente esce dal sito prima del consenso');
  await pulisci(); await vai(PAGINA, 2500);
  await js('window.scrollTo(0, document.documentElement.scrollHeight)'); await pausa(1500);
  await js('window.scrollTo(0, document.documentElement.scrollHeight / 2)'); await pausa(800);
  await js('document.querySelectorAll("details").forEach(function(d){d.open=true;})'); await pausa(500);
  verifica('prima della scelta, scorrendo fino in fondo: nessuna richiesta fuori dal sito', esterne().length === 0, [...new Set(esterne().map((u) => new URL(u).host))].join(', '));
  verifica('nessun cookie scritto', (await js('document.cookie')) === '', await js('document.cookie'));
  verifica('nessun file caricato da altri domini nel codice della pagina', await js(`Array.from(document.querySelectorAll('img[src], script[src], link[rel="stylesheet"], link[rel="preload"], iframe, video, audio, source')).every(function(e){var u=e.src||e.href||''; return !u || new URL(u, location.href).host===location.host || (${ANTEPRIMA} && new URL(u, location.href).host==='app.netlify.com');})`));
  await js('document.querySelector("#smy-consenso .smy-no").click()'); await pausa(1200);
  await vai(PAGINA, 2200);
  verifica('dopo "Rifiuta tutti": la barra non torna e niente esce dal sito', !(await barra()) && esterne().length === 0, esterne().slice(0, 2).join(' '));

  console.log('6. Misura dopo il si\' (gtag.js sostituito da un file vuoto: si vede che cosa la pagina consegna, non che cosa Google riceve)');
  await pulisci(); await vai(PAGINA, 2200);
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
  verifica('la pagina non consegna al tag ne\' il nome della lezione ne\' il testo del messaggio', !/Yoga Dolce|Hatha|Vinyasa|Ciao Sara|wa\.me/i.test(strato) && !richieste.some((u) => GOOGLE.test(u) && /Yoga%20Dolce|Hatha|Vinyasa|Ciao%20Sara/i.test(u)));
  verifica('"Preferenze cookie" nel pie\' di pagina riapre la barra', await js('(function(){document.querySelector("footer a[data-preferenze-cookie]").click(); return !!document.getElementById("smy-consenso");})()'));

  console.log('7. Tastiera, lettura e contrasti');
  await pulisci(); await schermo(1280, 800, false); await vai(); await aspetta(async () => (await stato()) === 'ok');
  await js('(function(){var b=document.getElementById("smy-consenso"); if(b) b.remove();})()');   // qui si guarda l'ordine nella pagina; la barra dei cookie ha il suo collaudo
  const dove = () => js('(function(){var a=document.activeElement; return a ? (a.className || a.tagName).toString().split(" ")[0] + "|" + (a.textContent||"").replace(/\\s+/g," ").trim().slice(0,28) : "";})()');
  await tab(); const f1 = await dove();
  const salto = JSON.parse(await js(CONTRASTO + '(".skip-link")'));
  verifica('primo Tab: "Salta al contenuto", visibile e leggibile', /^skip-link\|Salta al contenuto/.test(f1) && await js('document.querySelector(".skip-link").getBoundingClientRect().left >= 0') && salto.length === 1 && salto[0].ok, f1 + ' contrasto ' + (salto[0] && salto[0].k));
  await tab(); const f2 = await dove(); await tab(); const f3 = await dove(); await tab(); const f4 = await dove();
  verifica('poi, nell\'ordine: pulsante in alto, pulsante principale, "Vedi gli orari"', /Scrivimi su WhatsApp/.test(f2) && /Chiedi la prova su WhatsApp/.test(f3) && /Vedi gli orari/.test(f4), [f2, f3, f4].join(' > '));
  verifica('il fuoco si vede (contorno)', await js('(function(){var s=getComputedStyle(document.activeElement); return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2;})()'));
  verifica('le domande si aprono e si chiudono', await js('(function(){var d=document.querySelector(".lp-faq details"), s=d.querySelector("summary"); s.click(); var a=d.open; s.click(); return a && !d.open;})()'));
  verifica('un solo h1 e titoli in ordine', await js('document.querySelectorAll("h1").length === 1 && Array.from(document.querySelectorAll("main h1, main h2, main h3")).every(function(h,i,a){return i===0 || +h.tagName[1] - +a[i-1].tagName[1] <= 1;})'));
  verifica('ogni immagine ha testo alternativo, larghezza e altezza', await js('Array.from(document.querySelectorAll("img")).every(function(i){return i.hasAttribute("alt") && i.getAttribute("width") && i.getAttribute("height");})'));
  await js('document.querySelectorAll("details").forEach(function(d){d.open=true;})'); await pausa(300);
  for (const [w, h, mobile] of [[390, 844, true], [1280, 800, false]]) {
    await schermo(w, h, mobile); await pausa(400);
    const k = JSON.parse(await js(CONTRASTO + '(".lp-bar a, main *, footer *")'));
    const scarsi = k.filter((x) => !x.ok);
    verifica(`${w} punti: contrasto AA del testo della pagina, risposte aperte comprese (${k.length} elementi; barra dei cookie e stati al passaggio esclusi)`, k.length > 40 && scarsi.length === 0, scarsi.map((x) => `${x.k} ${x.chi} "${x.t}"`).join(' | '));
  }
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  verifica('con "riduci movimento" lo scorrimento verso l\'orario non e\' animato', await js('getComputedStyle(document.documentElement).scrollBehavior === "auto"'));
  await cdp('Emulation.setEmulatedMedia', { features: [] });

  console.log('8. Indicizzazione e collegamenti (dal 29/10/2026 la pagina si indicizza ed e\' collegata dal sito)');
  const rispostaPagina = await fetch(BASE + PAGINA); await rispostaPagina.text(); const intestazioni = rispostaPagina.headers;
  verifica('niente noindex: ne\' meta robots ne\' intestazione X-Robots-Tag', await js('!/noindex/i.test((document.querySelector("meta[name=robots]")||{}).content||"")') && !/noindex/i.test(intestazioni.get('x-robots-tag') || ''), intestazioni.get('x-robots-tag') || '');
  verifica('una sola canonica, esatta', await js('(function(){var c=document.querySelectorAll("link[rel=canonical]"); return c.length===1 && c[0].getAttribute("href")==="https://saramoreyoga.com/prova-gratuita/";})()'));
  verifica('nessun dato strutturato', await js('!document.querySelector("script[type=\\"application/ld+json\\"]")'));
  verifica('testata nuova: title e og:title "Prima lezione gratuita di yoga a Genova"', await js('document.title === "Prima lezione gratuita di yoga a Genova" && (document.querySelector("meta[property=\\"og:title\\"]")||{}).content === document.title'));
  verifica('H1 invariato', await js('(document.querySelector("h1")||{}).textContent === "Yoga a Genova, prima prova gratuita"'), await js('(document.querySelector("h1")||{}).textContent'));
  const mappa = await (await fetch(BASE + '/sitemap.xml')).text();
  verifica('la pagina e\' nella sitemap, una volta sola', (mappa.match(/<loc>https:\/\/saramoreyoga\.com\/prova-gratuita\/<\/loc>/g) || []).length === 1);
  const robots = await (await fetch(BASE + '/robots.txt')).text();
  const bloccata = (testo, agente) => {   // regole del gruppo indicato che vietano /prova-gratuita/ ("*" vale qualunque cosa, "$" fine indirizzo)
    let dentro = false, appena = false; const vietano = [];
    for (const grezza of testo.split(/\r?\n/)) {
      const riga = grezza.replace(/#.*/, '').trim(); const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(riga); if (!m) continue;
      const chiave = m[1].toLowerCase(), valore = m[2].trim();
      if (chiave === 'user-agent') { if (!appena) dentro = false; if (valore.toLowerCase() === agente) dentro = true; appena = true; continue; }
      appena = false;
      if (dentro && chiave === 'disallow' && valore) { const re = new RegExp('^' + valore.replace(/[.+?^{}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\?\$$/, '$')); if (re.test(PAGINA)) vietano.push(valore); }
    }
    return vietano;
  };
  const prova = 'User-agent: *\nDisallow: /*\n\nUser-agent: AdsBot-Google\nDisallow: /prova$\nDisallow: /admin/\n';
  verifica('il lettore di robots.txt del collaudo riconosce "Disallow: /*" e non si confonde con regole che non c\'entrano', bloccata(prova, '*').length === 1 && bloccata(prova, 'adsbot-google').length === 0);
  const vietata = [...bloccata(robots, '*'), ...bloccata(robots, 'adsbot-google'), ...bloccata(robots, 'googlebot')];
  verifica('robots.txt non blocca la pagina: ne\' per tutti, ne\' per Googlebot, ne\' per il lettore di Google Ads', vietata.length === 0, vietata.join(', '));
  // per ogni pagina: una voce nel menu e, nel testo, esattamente i link previsti (ancora per ancora)
  const TESTO = {
    '/': ['Vai alla prova gratuita'],
    '/lezioni-di-gruppo/': ['La prima prova è sempre gratuita', 'La prima lezione è gratuita', 'La prova è sempre gratuita', 'la prima prova è sempre gratuita'],
    '/yoga-genova-prezzi/': ['prima lezione di gruppo sempre gratuita', 'Lezione di prova', 'per il gruppo la prima è già gratuita', 'gruppo standard'],
    '/yoga-genova-carignano/': ['Prima lezione sempre gratuita'],
    '/chi-sono/': ['La prima lezione di gruppo è sempre gratuita'],
    '/blog/pratica/posizione-del-piccione-yoga/': ['lezione di prova'],
  };
  const SOLO_MENU = ['/lezioni-individuali/', '/yoga-gravidanza-genova/', '/yoga-in-gravidanza/', '/anukalana-yoga/', '/eventi/', '/contatti/', '/privacy-policy/', '/termini/', '/cookie-policy/',
    '/blog/', '/blog/anukalana/', '/blog/anukalana/yoga-somatico/', '/blog/genova/', '/blog/genova/yoga-pilates-genova-differenze/', '/blog/pratica/', '/blog/salute/', '/blog/salute/come-iniziare-a-meditare/'];
  for (const p of [...Object.keys(TESTO), ...SOLO_MENU]) {
    const html = await (await fetch(BASE + p)).text();
    const r = await js(`(function(){var d=new DOMParser().parseFromString(${JSON.stringify(html)},'text/html');
      var m=d.querySelectorAll('#menu-overlay a[href="/prova-gratuita/"]'), dopo=m.length===1 && m[0].previousElementSibling && m[0].previousElementSibling.getAttribute('href')==='/lezioni-di-gruppo/';
      var t=Array.from(d.querySelectorAll('a[href="/prova-gratuita/"]')).filter(function(a){return !a.closest('#menu-overlay');}).map(function(a){return a.textContent.trim();});
      var annidati=Array.from(d.querySelectorAll('a .service-card, .service-card a')).length;
      return JSON.stringify({menu:m.length, etichetta:m.length?m[0].textContent.trim():'', dopo:dopo, testo:t});})()`);
    const o = JSON.parse(r), atteso = TESTO[p] || [];
    verifica(`${p}: voce "Prova gratuita" nel menu dopo "Corsi di gruppo", e nel testo i link previsti (${atteso.length})`,
      o.menu === 1 && o.etichetta === 'Prova gratuita' && o.dopo && JSON.stringify(o.testo) === JSON.stringify(atteso), r);
  }
  const llms = await (await fetch(BASE + '/llms.txt')).text();
  verifica('llms.txt nomina la pagina', /saramoreyoga\.com\/prova-gratuita\/|\]\(\/prova-gratuita\/\)/.test(llms));
  verifica('non usa header diretto, identificativi di prenotazione o eventi, .fade-in, ne\' il pulsante flottante', await js('!document.querySelector("body > header") && !document.getElementById("classes-container") && !document.getElementById("events-container") && !document.getElementById("booking-modal") && !document.querySelector(".fade-in") && !document.querySelector(".whatsapp-container")'));
  // nel codice del sito la nominano solo i file previsti: le pagine con il menu, il modello del blog, sitemap e llms (si controlla solo dalla cartella del sito)
  if (existsSync(join(RADICE, 'index.html'))) {
    const trovati = [], conMenu = [];
    const gira = (d) => { for (const n of readdirSync(d)) { if (n === 'node_modules' || n === '.git' || n === 'tools' || n === 'prova-gratuita') continue; const p = join(d, n); const s = statSync(p); if (s.isDirectory()) gira(p); else if (/\.(html|js|xml|txt|json|toml)$/.test(n)) { const c = readFileSync(p, 'utf8'); const r = p.slice(RADICE.length + 1).split(sep).join('/'); if (/prova-gratuita/.test(c)) trovati.push(r); if (/id="menu-overlay"/.test(c)) conMenu.push(r); } } };
    gira(RADICE);
    const attesi = [...new Set([...conMenu, 'build-blog.js', 'sitemap.xml', 'llms.txt', 'llms-full.txt'])].sort();
    verifica('la nominano solo i file previsti (pagine con il menu, modello del blog, sitemap, llms)', JSON.stringify(trovati.sort()) === JSON.stringify(attesi), trovati.filter((x) => !attesi.includes(x)).concat(attesi.filter((x) => !trovati.includes(x)).map((x) => 'manca ' + x)).join(', '));
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
