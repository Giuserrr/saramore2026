// Collaudo della barra dei cookie e della misura (05/10/2026). Pilota Chrome senza finestra via DevTools Protocol, senza dipendenze.
// Uso:  1) nella cartella del sito: python -m http.server 8765      2) node tools/prova-consenso.mjs [http://localhost:8765]
// Controlla, per ogni scenario, i cookie scritti e le richieste di rete verso Google. Le richieste a Google vengono
// intercettate e non partono davvero (risposta finta), quindi la prova non sporca i dati veri.
// Con VERO=1 (da usare solo su un'anteprima pubblicata) Google non viene intercettato: una prova breve controlla che il tag
// vero scriva i suoi cookie dopo il si' e che la revoca li tolga. Manda a Google qualche visita di prova.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:8765';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FOTO = process.env.FOTO || join(tmpdir(), 'prova-consenso');
mkdirSync(FOTO, { recursive: true });
// Porta casuale: se un Chrome di una corsa precedente e' rimasto acceso non lo si riusa (terrebbe in cache per un anno il vecchio misura.js: capitato il 05/10/2026).
const PORTA = 9400 + Math.floor(Math.random() * 500);
const VERO = process.env.VERO === '1';
const adesso = () => Math.floor(Date.now() / 1000);
const esiti = [];
const verifica = (nome, ok, dettaglio = '') => { esiti.push(ok); console.log((ok ? '  ok   ' : '  FALLITA ') + nome + (dettaglio ? '  -> ' + dettaglio : '')); };
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORTA, '--user-data-dir=' + mkdtempSync(join(tmpdir(), 'cr-')), '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });
let ws, seq = 0;
const attese = new Map(), ascolti = [];
async function collega() {
  for (let i = 0; i < 40; i++) {
    try {
      const lista = await (await fetch(`http://127.0.0.1:${PORTA}/json`)).json();
      const pag = lista.find((t) => t.type === 'page');
      ws = new WebSocket(pag.webSocketDebuggerUrl);
      await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
      ws.onmessage = (m) => {
        const d = JSON.parse(m.data);
        if (d.id && attese.has(d.id)) { attese.get(d.id)(d); attese.delete(d.id); }
        else if (d.method) ascolti.forEach((f) => f(d));
      };
      return;
    } catch { await pausa(250); }
  }
  throw new Error('Chrome non risponde');
}
const cdp = (method, params = {}) => new Promise((ok, no) => { const id = ++seq; attese.set(id, (d) => d.error ? no(new Error(method + ': ' + d.error.message)) : ok(d.result)); ws.send(JSON.stringify({ id, method, params })); });
const js = async (espr) => { const r = await cdp('Runtime.evaluate', { expression: espr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };

let richieste = [], errori = [];
ascolti.push((d) => {
  if (d.method === 'Network.requestWillBeSent') richieste.push(d.params.request.url);
  if (d.method === 'Fetch.requestPaused') {
    const u = d.params.request.url;
    // Le chiamate a Google non partono: al posto di gtag.js si serve uno script vuoto, il resto risponde 204.
    if (/gtag\/js/.test(u)) cdp('Fetch.fulfillRequest', { requestId: d.params.requestId, responseCode: 200, responseHeaders: [{ name: 'content-type', value: 'application/javascript' }], body: Buffer.from('/* finto */').toString('base64') });
    else cdp('Fetch.fulfillRequest', { requestId: d.params.requestId, responseCode: 204 });
  }
  if (d.method === 'Runtime.exceptionThrown') errori.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
});
const google = () => richieste.filter((u) => /google|doubleclick|gstatic/.test(u) && !/maps|googleusercontent|fonts/.test(u));
async function vai(percorso, attesa = 1600) {
  richieste = [];
  await cdp('Page.navigate', { url: BASE + percorso });
  await pausa(attesa);
}
const cookie = async () => (await js('document.cookie')) || '';
const barra = () => js('!!document.getElementById("smy-consenso")');
// Aspetta che l'elemento ci sia (su un sito pubblicato la barra arriva dopo il file, che arriva dalla rete), poi clicca.
const clic = async (sel) => { for (let i = 0; i < 40 && !(await js(`!!document.querySelector(${JSON.stringify(sel)})`)); i++) await pausa(200); return js(`document.querySelector(${JSON.stringify(sel)}).click()`); };
const aspetta = async (cond, ms = 12000) => { for (let i = 0; i < ms / 300; i++) { if (await cond()) return true; await pausa(300); } return false; };
const foto = async (nome) => { const r = await cdp('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(FOTO, nome + '.png'), Buffer.from(r.data, 'base64')); };
const pulisci = async () => { await cdp('Network.clearBrowserCookies'); await js('try{localStorage.clear()}catch(e){}'); };
const strato = () => js('JSON.stringify(Array.from(window.dataLayer||[]).map(a=>Array.from(a)))');

try {
  await collega();
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
  if (!VERO) await cdp('Fetch.enable', { patterns: [{ urlPattern: '*googletagmanager.com*' }, { urlPattern: '*google-analytics.com*' }, { urlPattern: '*doubleclick.net*' }, { urlPattern: '*googleadservices.com*' }, { urlPattern: '*google.com/pagead*' }, { urlPattern: '*google.com/ccm*' }, { urlPattern: '*googlesyndication.com*' }] });
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });

  if (VERO) {
    console.log('Prova con il tag vero di Google (nessuna intercettazione)');
    await vai('/'); await pulisci(); await vai('/', 2500);
    verifica('prima della scelta: nessuna richiesta a Google e nessun cookie', google().length === 0 && (await cookie()) === '', google().join(' ') + ' | ' + (await cookie()));
    await clic('#smy-consenso .smy-si'); await aspetta(async () => /_ga=/.test(await cookie()) && /_gcl_au=/.test(await cookie())); await pausa(1500);
    let c = await cookie();
    verifica('dopo il si\': il tag vero scrive _ga e _gcl_au', /_ga=/.test(c) && /_gcl_au=/.test(c), c);
    verifica('partono le chiamate di misura ad Analytics e ad Ads', google().some((u) => /analytics\.google\.com\/g\/collect|google-analytics\.com\/g\/collect/.test(u)) && google().some((u) => /ccm\/collect/.test(u)), String(google().length));
    console.log('     richieste a Google:', [...new Set(google().map((u) => new URL(u).host + new URL(u).pathname))].join(', '));
    await clic('footer a[data-preferenze-cookie]'); await pausa(300);
    richieste = [];
    await clic('#smy-consenso .smy-no'); await pausa(4000);
    c = await cookie();
    verifica('dopo la revoca: cookie di Google tolti, scelta = rifiuto', !/_ga|_gcl/.test(c) && /smy_consenso=1\.0\.0\./.test(c), c);
    await vai('/chi-sono/', 3000);
    verifica('pagina successiva: nessuna richiesta a Google', google().length === 0, google().join(' '));
    console.log('Solo statistiche con il tag vero');
    await pulisci(); await vai('/chi-sono/', 2500);
    await clic('#smy-consenso .smy-altro'); await pausa(200);
    await js('document.getElementById("smy-s").checked=true'); await clic('#smy-consenso .smy-altro');
    await aspetta(async () => /_ga=/.test(await cookie())); await pausa(2500);
    c = await cookie();
    verifica('solo statistiche: _ga presente, nessun cookie pubblicitario', /_ga=/.test(c) && !/_gcl/.test(c), c);
    verifica('solo statistiche: nessuna chiamata a doubleclick o ad Ads', !google().some((u) => /doubleclick|ccm\/collect|AW-|pagead/.test(u)), google().filter((u) => /doubleclick|ccm|AW-|pagead/.test(u)).join(' ').slice(0, 300));
    verifica('la chiamata ad Analytics porta ad_storage negato (gcs=G101)', google().some((u) => /g\/collect.*gcs=G101/.test(u)));
    verifica('nessun errore JavaScript', errori.length === 0, errori.slice(0, 3).join(' | '));
    throw new Error('__fine__');
  }

  console.log('1. Prima visita, nessuna scelta');
  await vai('/'); await pulisci(); await vai('/');
  verifica('la barra compare', await barra());
  verifica('nessun cookie scritto', (await cookie()) === '', await cookie());
  verifica('nessuna richiesta a Google', google().length === 0, google().join(' '));
  verifica('nessun dataLayer', (await js('typeof window.dataLayer')) === 'undefined');
  await foto('1-barra-telefono');
  const wa = await js('getComputedStyle(document.querySelector(".whatsapp-container")).transform');
  verifica('il pulsante WhatsApp sale sopra la barra (telefono)', wa !== 'none', wa);
  await clic('a[href^="https://wa.me"]'); await pausa(300);
  verifica('clic WhatsApp senza consenso: nessuna richiesta a Google', google().length === 0);
  await vai('/lezioni-di-gruppo/');
  verifica('cambiando pagina la barra ricompare', await barra());

  console.log('2. Rifiuto');
  await clic('#smy-consenso .smy-no'); await pausa(300);
  verifica('la barra si chiude', !(await barra()));
  verifica('cookie della scelta = rifiuto', /smy_consenso=1\.0\.0\.\d+/.test(await cookie()), await cookie());
  verifica('nessuna richiesta a Google', google().length === 0);
  await vai('/');
  verifica('alla pagina dopo la barra non ricompare', !(await barra()));
  verifica('ancora nessuna richiesta a Google e nessun cookie di Google', google().length === 0 && !/_ga|_gcl/.test(await cookie()));
  verifica('WhatsApp torna al suo posto', (await js('getComputedStyle(document.querySelector(".whatsapp-container")).transform')) === 'none');

  console.log('3. La X vale rifiuto');
  await pulisci(); await vai('/');
  await clic('#smy-consenso .smy-x'); await pausa(300);
  verifica('cookie = rifiuto', /smy_consenso=1\.0\.0\./.test(await cookie()), await cookie());
  verifica('nessuna richiesta a Google', google().length === 0);

  console.log('4. Accetto tutto');
  await pulisci(); await vai('/');
  await clic('#smy-consenso .smy-si'); await pausa(800);
  verifica('cookie = statistiche e pubblicita', /smy_consenso=1\.1\.1\./.test(await cookie()), await cookie());
  let g = google();
  verifica('parte il tag Google (una richiesta a gtag/js)', g.filter((u) => /gtag\/js/.test(u)).length === 1, g.join(' '));
  let dl = JSON.parse(await strato());
  const primo = dl[0], secondo = dl[1];
  verifica('il primo comando e\' consent default tutto negato', primo[0] === 'consent' && primo[1] === 'default' && Object.values(primo[2]).every((v) => v === 'denied'), JSON.stringify(primo));
  verifica('poi consent update; personalizzazione sempre negata', secondo[1] === 'update' && secondo[2].ad_storage === 'granted' && secondo[2].ad_user_data === 'granted' && secondo[2].ad_personalization === 'denied', JSON.stringify(secondo));
  const conf = dl.filter((c) => c[0] === 'config').map((c) => c[1]);
  console.log('     destinazioni configurate:', conf.join(', '));
  verifica('configurato il tag Ads', conf.includes('AW-18495474352'));
  await clic('a[href^="https://wa.me"]'); await pausa(300);
  dl = JSON.parse(await strato());
  const ev = dl.filter((c) => c[0] === 'event');
  verifica('clic WhatsApp -> conversione Ads giusta', ev.some((c) => c[1] === 'conversion' && c[2].send_to === 'AW-18495474352/xzAiCOGA7ZEdELCVqvNE'), JSON.stringify(ev));
  verifica('nessun dato del link negli eventi', !JSON.stringify(ev).includes('wa.me'));
  await vai('/lezioni-di-gruppo/');
  verifica('pagina dopo: niente barra, tag caricato', !(await barra()) && google().some((u) => /gtag\/js/.test(u)));
  await js('var m=document.getElementById("booking-message"); m.className="booking-msg success"; m.className="booking-msg success";'); await pausa(300);
  dl = JSON.parse(await strato());
  const pren = dl.filter((c) => c[0] === 'event' && c[1] === 'conversion' && c[2].send_to === 'AW-18495474352/MyO6COSA7ZEdELCVqvNE');
  verifica('prenotazione riuscita -> una sola conversione', pren.length === 1, 'contate ' + pren.length);
  await js('document.getElementById("booking-message").className="booking-msg error"'); await pausa(200);
  dl = JSON.parse(await strato());
  verifica('prenotazione fallita -> nessuna conversione in piu\'', dl.filter((c) => c[0] === 'event' && c[1] === 'conversion').length === 1);

  console.log('5. Revoca dalle preferenze');
  await js('document.cookie="_ga=GA1.1.111.222; Path=/"; document.cookie="_gcl_au=1.1.333; Path=/"');
  await clic('footer a[data-preferenze-cookie]'); await pausa(300);
  verifica('il link Preferenze riapre la barra con le caselle', (await barra()) && !(await js('document.querySelector("#smy-consenso .smy-scelte").hidden')));
  verifica('le caselle mostrano la scelta attuale', await js('document.getElementById("smy-s").checked && document.getElementById("smy-p").checked'));
  await foto('5-preferenze-telefono');
  await clic('#smy-consenso .smy-x'); await pausa(200);
  verifica('la X sulle preferenze chiude senza cambiare', /smy_consenso=1\.1\.1\./.test(await cookie()));
  await clic('footer a[data-preferenze-cookie]'); await pausa(200);
  richieste = [];
  await clic('#smy-consenso .smy-no'); await pausa(1800);
  verifica('dopo la revoca: cookie = rifiuto e cookie di Google tolti', /smy_consenso=1\.0\.0\./.test(await cookie()) && !/_ga|_gcl/.test(await cookie()), await cookie());
  verifica('pagina ricaricata senza tag Google', google().length === 0 && (await js('typeof window.dataLayer')) === 'undefined', google().join(' '));

  console.log('6. Consenso parziale: solo statistiche');
  await pulisci(); await vai('/');
  await clic('#smy-consenso .smy-altro'); await pausa(150);
  verifica('Personalizza mostra due caselle non spuntate', await js('!document.querySelector("#smy-consenso .smy-scelte").hidden && !document.getElementById("smy-s").checked && !document.getElementById("smy-p").checked'));
  await js('document.getElementById("smy-s").checked=true');
  await clic('#smy-consenso .smy-altro'); await pausa(600);
  verifica('cookie = solo statistiche', /smy_consenso=1\.1\.0\./.test(await cookie()), await cookie());
  const haGa4 = await js('fetch("/assets/misura/v1/misura.js").then(r=>r.text()).then(t=>/var GA4 = \'G-/.test(t))');
  if (haGa4) {
    dl = JSON.parse(await strato());
    verifica('con Analytics configurato: parte solo GA4, Ads negato', dl[1][2].analytics_storage === 'granted' && dl[1][2].ad_storage === 'denied' && !dl.some((c) => c[0] === 'config' && /^AW-/.test(c[1])), JSON.stringify(dl.slice(0, 5)));
  } else {
    verifica('Analytics non ancora configurato: non parte nulla', google().length === 0 && (await js('typeof window.dataLayer')) === 'undefined', google().join(' '));
  }
  await clic('a[href^="https://wa.me"]'); await pausa(300);
  verifica('clic WhatsApp: nessuna conversione Ads', !JSON.parse((await strato()) || '[]').some((c) => c[1] === 'conversion'));

  console.log('7. Consenso parziale: solo pubblicita\'');
  await pulisci(); await vai('/');
  await clic('#smy-consenso .smy-altro'); await pausa(150);
  await js('document.getElementById("smy-p").checked=true');
  await clic('#smy-consenso .smy-altro'); await pausa(600);
  dl = JSON.parse(await strato());
  verifica('Ads concesso, statistiche negate, nessuna configurazione GA4', dl[1][2].ad_storage === 'granted' && dl[1][2].analytics_storage === 'denied' && !dl.some((c) => c[0] === 'config' && /^G-/.test(c[1])), JSON.stringify(dl.slice(0, 5)));

  console.log('8. Traffico interno');
  await pulisci(); await vai('/?interno=1');
  verifica('con ?interno=1 niente barra e niente Google', !(await barra()) && google().length === 0);
  await vai('/chi-sono/');
  verifica('resta spento sulle altre pagine', !(await barra()));
  await vai('/?interno=0');
  verifica('con ?interno=0 la barra torna', await barra());

  console.log('9. Pagine legali e schermo grande');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1366, height: 800, deviceScaleFactor: 1, mobile: false });
  await pulisci(); await vai('/');
  await foto('9-barra-computer');
  const r = JSON.parse(await js('JSON.stringify([document.getElementById("smy-consenso").getBoundingClientRect(), document.querySelector(".whatsapp-btn").getBoundingClientRect()])'));
  verifica('su schermo grande la barra non copre WhatsApp', r[0].right < r[1].left, `barra fino a ${Math.round(r[0].right)}, WhatsApp da ${Math.round(r[1].left)}`);
  verifica('pulsanti Accetta e Rifiuta di pari evidenza', await js('(function(){var a=getComputedStyle(document.querySelector(".smy-si")),b=getComputedStyle(document.querySelector(".smy-no"));return a.backgroundColor===b.backgroundColor&&a.color===b.color&&a.fontSize===b.fontSize&&document.querySelector(".smy-si").offsetWidth===document.querySelector(".smy-no").offsetWidth})()'));
  await clic('#smy-consenso .smy-no');
  await vai('/cookie-policy/'); await foto('9-cookie-policy');
  verifica('la cookie policy si apre e ha il titolo', (await js('document.querySelector("h1").textContent')) === 'Cookie Policy');
  await clic('main a[data-preferenze-cookie]'); await pausa(200);
  verifica('il link nella cookie policy apre le preferenze', await barra());
  await vai('/privacy-policy/'); await foto('9-privacy');
  verifica('la privacy cita Google, Stripe e il Garante', await js('/Google Ireland/.test(document.body.innerText)&&/Stripe/.test(document.body.innerText)&&/Garante/.test(document.body.innerText)'));
  for (const p of ['/', '/lezioni-di-gruppo/', '/contatti/', '/eventi/', '/blog/', '/yoga-gravidanza-genova/', '/termini/']) {
    await vai(p, 900);
    const n = await js('document.querySelectorAll("footer a[href=\\"/cookie-policy/\\"], footer a[data-preferenze-cookie]").length');
    verifica('pie\' di pagina con i due link in ' + p, n === 2, 'trovati ' + n);
  }

  console.log('10. Scelta non valida, scaduta o di una versione vecchia');
  const metti = (v) => js(`document.cookie=${JSON.stringify(v + '; Path=/')}`);
  for (const [nome, valore] of [['cookie manomesso', 'smy_consenso=1.1.1.spazzatura'], ['data impossibile', 'smy_consenso=1.1.1.0'],
                                ['scelta piu\' vecchia di 12 mesi', 'smy_consenso=1.1.1.' + (adesso() - 400 * 86400)], ['campi fuori schema', 'smy_consenso=1.2.1.' + adesso()]]) {
    await pulisci(); await vai('/', 300); await metti(valore); await vai('/');
    verifica(nome + ': vale come nessuna scelta', (await barra()) && google().length === 0, google().join(' '));
  }
  await pulisci(); await vai('/', 300);
  await metti('smy_consenso=0.1.1.' + adesso()); await metti('_gcl_aw=GCL.1.x'); await metti('_ga=GA1.1.1.2'); await vai('/');
  verifica('versione vecchia: la barra ricompare e i cookie di Google rimasti vengono tolti', (await barra()) && !/_ga|_gcl/.test(await cookie()) && google().length === 0, await cookie());

  console.log('11. Revoche parziali: si toglie solo la categoria revocata');
  await pulisci(); await vai('/'); await clic('#smy-consenso .smy-si'); await pausa(500);
  await metti('_ga=GA1.1.1.2'); await metti('_gcl_au=1.1.3');
  await clic('footer a[data-preferenze-cookie]'); await pausa(200);
  verifica('aprendo le preferenze il fuoco va sulla prima casella', (await js('document.activeElement && document.activeElement.id')) === 'smy-s');
  await js('document.getElementById("smy-s").checked=false'); await clic('#smy-consenso .smy-altro'); await pausa(1800);
  let ck = await cookie();
  verifica('da tutto a sola pubblicita\': via _ga, resta _gcl_au', /smy_consenso=1\.0\.1\./.test(ck) && !/_ga=/.test(ck) && /_gcl_au=/.test(ck), ck);
  await clic('footer a[data-preferenze-cookie]'); await pausa(200); await clic('#smy-consenso .smy-si'); await pausa(1800);
  await metti('_ga=GA1.1.1.2'); await metti('_gcl_au=1.1.3');
  await clic('footer a[data-preferenze-cookie]'); await pausa(200);
  await js('document.getElementById("smy-p").checked=false'); await clic('#smy-consenso .smy-altro'); await pausa(1800);
  ck = await cookie();
  verifica('da tutto a sole statistiche: via _gcl_au, resta _ga', /smy_consenso=1\.1\.0\./.test(ck) && /_ga=/.test(ck) && !/_gcl_au=/.test(ck), ck);
  await clic('footer a[data-preferenze-cookie]'); await pausa(200);
  await clic('#smy-consenso .smy-x'); await pausa(200);
  verifica('chiudendo le preferenze il fuoco torna al link', await js('document.activeElement && document.activeElement.hasAttribute("data-preferenze-cookie")'));

  console.log('12. Revoca fatta altrove (altra scheda, ritorno dalla cache del browser)');
  await pulisci(); await vai('/'); await clic('#smy-consenso .smy-si'); await pausa(500);
  await metti('smy_consenso=1.0.0.' + adesso());           // come se la revoca fosse arrivata da un'altra scheda
  await clic('a[href^="https://wa.me"]'); await pausa(300);
  dl = JSON.parse(await strato());
  const ultimoConsenso = dl.filter((c) => c[0] === 'consent').pop();
  verifica('clic dopo la revoca altrove: nessun evento, consenso aggiornato a negato', !dl.some((c) => c[0] === 'event') && ultimoConsenso[1] === 'update' && Object.values(ultimoConsenso[2]).every((v) => v === 'denied'), JSON.stringify(dl.slice(-2)));
  await pulisci(); await vai('/'); await clic('#smy-consenso .smy-si'); await pausa(500);
  await metti('smy_consenso=1.0.0.' + adesso());
  richieste = [];
  await js('window.dispatchEvent(new PageTransitionEvent("pageshow",{persisted:true}))'); await pausa(1800);
  verifica('ritorno dalla cache dopo una revoca: pagina ricaricata senza tag', (await js('typeof window.dataLayer')) === 'undefined' && google().length === 0, google().join(' '));
  await pulisci(); await vai('/'); await clic('#smy-consenso .smy-si'); await pausa(500);
  await js('document.cookie="smy_consenso=; Max-Age=0; Path=/"');
  await js('window.dispatchEvent(new PageTransitionEvent("pageshow",{persisted:true}))'); await pausa(1800);
  verifica('ritorno dalla cache con la scelta sparita: niente tag e la barra ricompare', (await js('typeof window.dataLayer')) === 'undefined' && (await barra()));

  console.log('13. Eventi: instradamento, tasto centrale, traffico interno senza memoria');
  await pulisci(); await vai('/'); await clic('#smy-consenso .smy-si'); await pausa(500);
  await js('misura("clic_whatsapp",{send_to:"ALTROVE",posizione:"corpo",altro:"x"})');
  dl = JSON.parse(await strato());
  const mio = dl.filter((c) => c[0] === 'event' && c[1] === 'clic_whatsapp').pop();
  verifica('send_to non si puo\' cambiare e passano solo i parametri previsti', mio && mio[2].send_to === 'G-35EEBYC4Q3' && mio[2].posizione === 'corpo' && !('altro' in mio[2]), JSON.stringify(mio));
  const primaConv = dl.filter((c) => c[1] === 'conversion').length;
  await js('document.querySelector(".whatsapp-btn").dispatchEvent(new MouseEvent("auxclick",{bubbles:true,button:1}))'); await pausa(200);
  await js('document.querySelector(".whatsapp-btn").dispatchEvent(new MouseEvent("auxclick",{bubbles:true,button:2}))'); await pausa(200);
  dl = JSON.parse(await strato());
  verifica('tasto centrale su WhatsApp contato una volta, tasto destro no', dl.filter((c) => c[1] === 'conversion').length === primaConv + 1);
  const erroriPrima = errori.length;   // con la memoria bloccata si lamentano anche script non nostri (widget di Netlify Identity): non contano
  const blocco = await cdp('Page.addScriptToEvaluateOnNewDocument', { source: 'Storage.prototype.setItem=function(){throw new Error("bloccato")};Storage.prototype.getItem=function(){throw new Error("bloccato")};' });
  await vai('/?interno=1');
  verifica('?interno=1 con la memoria del browser bloccata: niente Google su quella pagina', google().length === 0 && !(await barra()), google().join(' '));
  await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: blocco.identifier });
  verifica('con la memoria bloccata il nostro file non lancia errori', !errori.slice(erroriPrima).some((x) => /misura/.test(x)), errori.slice(erroriPrima).join(' | ').slice(0, 200));
  errori.length = erroriPrima;

  console.log('14. Barra: testi e ingombro sul telefono');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
  await pulisci(); await vai('/');
  const testo = await js('document.getElementById("smy-consenso").innerText');
  verifica('la barra dice "Accetta tutti", "Rifiuta tutti" e spiega la X', /Accetta tutti/.test(testo) && /Rifiuta tutti/.test(testo) && /Chiudendo con la X li rifiuti/.test(testo), testo.replace(/\n/g, ' / '));
  const rr = JSON.parse(await js('JSON.stringify([document.getElementById("smy-consenso").getBoundingClientRect(), document.querySelector(".whatsapp-btn").getBoundingClientRect(), innerHeight])'));
  verifica('sul telefono la barra non copre WhatsApp', rr[1].bottom <= rr[0].top, `WhatsApp finisce a ${Math.round(rr[1].bottom)}, barra da ${Math.round(rr[0].top)}`);
  verifica('la barra occupa meno di un quarto dello schermo', rr[0].height < rr[2] / 4, Math.round(rr[0].height) + ' px su ' + rr[2]);
  await foto('14-barra-telefono');
  await clic('#smy-consenso .smy-altro'); await pausa(200);
  verifica('Personalizza porta il fuoco sulla prima casella', (await js('document.activeElement && document.activeElement.id')) === 'smy-s');
  await foto('14-personalizza-telefono');

  verifica('nessun errore JavaScript durante tutte le prove', errori.length === 0, errori.slice(0, 3).join(' | '));
} catch (e) {
  if (e.message !== '__fine__') { console.log('ERRORE DEL COLLAUDO:', e.message); esiti.push(false); }
} finally {
  try { ws && ws.close(); } catch {}
  // Su Windows kill() chiude solo il primo processo: si chiude tutto l'albero.
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' }); else chrome.kill();
}
console.log(`\n${esiti.filter(Boolean).length} verifiche riuscite su ${esiti.length}. Schermate in ${FOTO}`);
process.exit(esiti.every(Boolean) ? 0 : 1);
