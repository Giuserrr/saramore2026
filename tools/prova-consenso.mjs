// Collaudo della barra dei cookie e della misura (05/10/2026). Pilota Chrome senza finestra via DevTools Protocol, senza dipendenze.
// Uso:  1) nella cartella del sito: python -m http.server 8765      2) node tools/prova-consenso.mjs [http://localhost:8765]
// Controlla, per ogni scenario, i cookie scritti e le richieste di rete verso Google. Le richieste a Google vengono
// intercettate e non partono davvero (risposta finta), quindi la prova non sporca i dati veri.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:8765';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FOTO = process.env.FOTO || join(tmpdir(), 'prova-consenso');
mkdirSync(FOTO, { recursive: true });
const PORTA = 9333;
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
  if (d.method === 'Fetch.requestPaused') {
    const u = d.params.request.url;
    richieste.push(u);
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
const clic = (sel) => js(`document.querySelector(${JSON.stringify(sel)}).click()`);
const foto = async (nome) => { const r = await cdp('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(FOTO, nome + '.png'), Buffer.from(r.data, 'base64')); };
const pulisci = async () => { await cdp('Network.clearBrowserCookies'); await js('try{localStorage.clear()}catch(e){}'); };
const strato = () => js('JSON.stringify(Array.from(window.dataLayer||[]).map(a=>Array.from(a)))');

try {
  await collega();
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
  await cdp('Fetch.enable', { patterns: [{ urlPattern: '*googletagmanager.com*' }, { urlPattern: '*google-analytics.com*' }, { urlPattern: '*doubleclick.net*' }, { urlPattern: '*googleadservices.com*' }, { urlPattern: '*google.com/pagead*' }, { urlPattern: '*google.com/ccm*' }, { urlPattern: '*googlesyndication.com*' }] });
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });

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
  verifica('nessun errore JavaScript durante tutte le prove', errori.length === 0, errori.slice(0, 3).join(' | '));
} catch (e) {
  console.log('ERRORE DEL COLLAUDO:', e.message); esiti.push(false);
} finally {
  try { ws && ws.close(); } catch {}
  chrome.kill();
}
console.log(`\n${esiti.filter(Boolean).length} verifiche riuscite su ${esiti.length}. Schermate in ${FOTO}`);
process.exit(esiti.every(Boolean) ? 0 : 1);
