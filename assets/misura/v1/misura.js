/* ============================================
   SaraMore Yoga — consenso ai cookie e misura (v1, 05/10/2026)
   ============================================
   Che cosa fa:
   - mostra la barra dei cookie a chi non ha ancora scelto;
   - SOLO dopo un si' carica il tag Google (consent mode v2, modalita' base: prima della scelta non parte nulla);
   - misura(evento) manda i clic di contatto a Google Analytics e/o a Google Ads, secondo la scelta.
   File servito con cache di un anno (netlify.toml): NON modificarlo dopo la pubblicazione.
   Per cambiarlo: copiare la cartella in /assets/misura/v2/ e aggiornare il percorso in fondo a main.js.
   Spegnere tutto: togliere il caricamento in fondo a main.js (oppure svuotare GA4 e ADS qui sotto, in una nuova versione).
   Contratto degli eventi, prove e rollback: BACKLOG.md del sito e Sara/piano-misurazione-e-campagne-2026-10.md nella Conoscenza. */
(function () {
    'use strict';

    var VERSIONE = 1;              // versione dell'informativa: se cambia, la scelta viene richiesta di nuovo
    var GA4 = '';                  // ID misurazione di Google Analytics 4 (G-XXXXXXXXXX); vuoto = Analytics spento
    var ADS = 'AW-18495474352';    // tag dell'account Google Ads 117-110-5786; vuoto = Ads spento
    var CONV = {                   // evento nostro -> azione di conversione di Google Ads
        clic_whatsapp: 'AW-18495474352/xzAiCOGA7ZEdELCVqvNE',
        prenotazione_registrata: 'AW-18495474352/MyO6COSA7ZEdELCVqvNE',
        clic_pagamento_evento: 'AW-18495474352/5kTqCOeA7ZEdELCVqvNE'
    };
    var COOKIE = 'smy_consenso';
    var DURATA = 365 * 24 * 3600;  // la scelta vale 12 mesi

    window.misura = function () {};
    if (!GA4 && !ADS) return;

    /* Traffico interno (Sara, Giuse): /?interno=1 su ogni dispositivo usato per le prove spegne banner e misura; /?interno=0 li riaccende. */
    try {
        var q = new URLSearchParams(location.search).get('interno');
        if (q === '1') localStorage.setItem('smy_interno', '1');
        if (q === '0') localStorage.removeItem('smy_interno');
        if (localStorage.getItem('smy_interno') === '1') return;
    } catch (e) {}

    var scelta = null;     // { s: statistiche, p: pubblicita' } oppure null se non ha ancora scelto
    var avviato = false;   // il tag Google e' stato caricato in questa pagina

    function leggi() {
        var m = document.cookie.match(/(?:^|; )smy_consenso=([^;]*)/);
        if (!m) return null;
        var p = m[1].split('.');   // versione.statistiche.pubblicita.quando
        if (p.length !== 4 || Number(p[0]) !== VERSIONE) return null;
        return { s: p[1] === '1', p: p[2] === '1' };
    }
    function scrivi(s, p) {
        document.cookie = COOKIE + '=' + [VERSIONE, s ? 1 : 0, p ? 1 : 0, Math.floor(Date.now() / 1000)].join('.') +
            '; Max-Age=' + DURATA + '; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    }
    /* Alla revoca si tolgono i cookie di Google gia' scritti. */
    function pulisci() {
        document.cookie.split('; ').forEach(function (c) {
            var nome = c.split('=')[0];
            if (!/^(_ga|_gid|_gat|_gcl_|_gac_)/.test(nome)) return;
            var host = location.hostname.replace(/^www\./, '');
            ['', '; Domain=' + host, '; Domain=.' + host].forEach(function (d) {
                document.cookie = nome + '=; Max-Age=0; Path=/' + d;
            });
        });
    }

    function gtag() { window.dataLayer.push(arguments); }

    /* Carica il tag Google solo per cio' che e' stato accettato. La personalizzazione degli annunci resta sempre negata. */
    function avvia() {
        if (avviato || !scelta) return;
        var ga = scelta.s && GA4, ads = scelta.p && ADS;
        if (!ga && !ads) return;
        avviato = true;
        window.dataLayer = window.dataLayer || [];
        window.gtag = gtag;
        gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
        gtag('consent', 'update', {
            analytics_storage: ga ? 'granted' : 'denied',
            ad_storage: ads ? 'granted' : 'denied',
            ad_user_data: ads ? 'granted' : 'denied',
            ad_personalization: 'denied'
        });
        gtag('js', new Date());
        if (ga) gtag('config', GA4, { cookie_expires: DURATA, allow_google_signals: false, allow_ad_personalization_signals: false });
        if (ads) gtag('config', ADS, { allow_enhanced_conversions: false });
        var el = document.createElement('script');
        el.async = true;
        el.src = 'https://www.googletagmanager.com/gtag/js?id=' + (ga || ads);
        document.head.appendChild(el);
    }

    /* Unico punto da cui partono gli eventi. Senza consenso non fa nulla (e non accoda nulla per dopo). */
    window.misura = function (evento, parametri) {
        if (!avviato) return;
        var dati = { send_to: GA4 };
        for (var k in (parametri || {})) dati[k] = parametri[k];
        if (scelta.s && GA4) gtag('event', evento, dati);
        if (scelta.p && ADS && CONV[evento]) gtag('event', 'conversion', { send_to: CONV[evento] });
    };

    /* --- Clic di contatto: sono indizi di interesse, non messaggi ricevuti. Non si manda il testo del link. --- */
    document.addEventListener('click', function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;
        if (a.hasAttribute('data-preferenze-cookie')) { e.preventDefault(); barra(true); return; }
        var h = a.getAttribute('href') || '';
        var dove = a.closest('.whatsapp-container') ? 'flottante' : a.closest('footer') ? 'piede' : a.closest('#event-detail') ? 'evento' : 'corpo';
        if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(h)) window.misura('clic_whatsapp', { posizione: dove });
        else if (/^mailto:/.test(h)) window.misura('clic_email', { posizione: dove });
        else if (/^tel:/.test(h)) window.misura('clic_telefono', { posizione: dove });
        else if (/^https:\/\/[a-z]+\.stripe\.com\//.test(h)) window.misura('clic_pagamento_evento', { posizione: dove });
    }, true);

    /* --- Prenotazione riuscita: si osserva il messaggio di conferma, senza toccare submitBooking() in main.js. --- */
    var esito = document.getElementById('booking-message');
    if (esito && window.MutationObserver) {
        var ultima = 0;
        new MutationObserver(function () {
            if (/\bsuccess\b/.test(esito.className) && Date.now() - ultima > 5000) { ultima = Date.now(); window.misura('prenotazione_registrata'); }
        }).observe(esito, { attributes: true, attributeFilter: ['class'] });
    }

    /* --- Barra dei cookie --- */
    var CSS = '' +
        '#smy-consenso{position:fixed;left:12px;bottom:12px;z-index:1500;box-sizing:border-box;width:calc(100% - 24px);max-width:500px;padding:12px 14px;' +
        'background:#FAF7F2;color:#2A2A28;border:1px solid #D9D2C5;border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,.14);font:400 13px/1.45 Inter,system-ui,sans-serif}' +
        '#smy-consenso p{margin:0 0 10px;padding-right:24px}#smy-consenso a{color:#5E6B53;text-decoration:underline}' +
        '#smy-consenso .smy-scelte{margin:0 0 10px}#smy-consenso label{display:block;margin:4px 0;cursor:pointer}#smy-consenso input{margin-right:8px;accent-color:#5E6B53}' +
        '#smy-consenso .smy-bottoni{display:flex;flex-wrap:wrap;gap:8px}' +
        '#smy-consenso button{font:500 13px/1 Inter,system-ui,sans-serif;min-height:38px;padding:0 14px;border-radius:50px;cursor:pointer}' +
        '#smy-consenso .smy-si,#smy-consenso .smy-no{flex:1 1 84px;background:#2A2A28;color:#fff;border:1px solid #2A2A28}' +
        '#smy-consenso .smy-altro{flex:0 0 auto;background:transparent;color:#2A2A28;border:1px solid transparent;text-decoration:underline;padding:0 6px}' +
        '#smy-consenso .smy-x{position:absolute;top:4px;right:4px;min-height:32px;width:32px;padding:0;background:transparent;border:0;color:#2A2A28;font-size:20px;line-height:1}' +
        '#smy-consenso button:focus-visible{outline:2px solid #5E6B53;outline-offset:2px}' +
        '@media (max-width:700px){html.smy-barra .whatsapp-container{transform:translateY(calc(-1 * var(--smy-h,0px)));transition:transform .2s}}';

    function chiudi() {
        var b = document.getElementById('smy-consenso');
        if (b) b.parentNode.removeChild(b);
        document.documentElement.classList.remove('smy-barra');
    }

    function decidi(s, p) {
        var prima = scelta;
        scrivi(s, p);
        scelta = { s: s, p: p };
        chiudi();
        if (avviato) {
            // Il tag e' gia' in pagina: per applicare una scelta diversa (anche una revoca) si riparte da una pagina pulita.
            if (prima && (prima.s !== s || prima.p !== p)) { if ((prima.s && !s) || (prima.p && !p)) pulisci(); location.reload(); }
            return;
        }
        if (prima && ((prima.s && !s) || (prima.p && !p))) pulisci();
        avvia();
    }

    /* dettagli = true: aperta dal link "Preferenze cookie", mostra subito le due caselle con la scelta attuale. */
    function barra(dettagli) {
        chiudi();
        if (!document.getElementById('smy-consenso-css')) {
            var st = document.createElement('style');
            st.id = 'smy-consenso-css';
            st.textContent = CSS;
            document.head.appendChild(st);
        }
        var b = document.createElement('div');
        b.id = 'smy-consenso';
        b.setAttribute('role', 'region');
        b.setAttribute('aria-label', 'Scelta dei cookie');
        b.innerHTML =
            '<button type="button" class="smy-x" aria-label="Chiudi e rifiuta i cookie facoltativi">&times;</button>' +
            '<p>Questo sito usa cookie tecnici e, solo se accetti, cookie di <strong>statistica</strong> e di <strong>pubblicit&agrave;</strong> di Google ' +
            'per misurare visite e annunci. <a href="/cookie-policy/">Cookie Policy</a></p>' +
            '<div class="smy-scelte"' + (dettagli ? '' : ' hidden') + '>' +
            '<label><input type="checkbox" id="smy-s"' + (scelta && scelta.s ? ' checked' : '') + '>Statistiche (Google Analytics)</label>' +
            '<label><input type="checkbox" id="smy-p"' + (scelta && scelta.p ? ' checked' : '') + '>Pubblicit&agrave; (misura degli annunci Google)</label>' +
            '</div>' +
            '<div class="smy-bottoni">' +
            '<button type="button" class="smy-no">Rifiuta</button>' +
            '<button type="button" class="smy-si">Accetta</button>' +
            '<button type="button" class="smy-altro">' + (dettagli ? 'Salva la scelta' : 'Personalizza') + '</button>' +
            '</div>';
        // La X vale rifiuto solo per chi non ha ancora scelto; se la barra e' stata riaperta dalle preferenze, chiude senza cambiare nulla.
        b.querySelector('.smy-x').onclick = function () { if (scelta) chiudi(); else decidi(false, false); };
        if (scelta) b.querySelector('.smy-x').setAttribute('aria-label', 'Chiudi senza cambiare la scelta');
        b.querySelector('.smy-no').onclick = function () { decidi(false, false); };
        b.querySelector('.smy-si').onclick = function () { decidi(true, true); };
        b.querySelector('.smy-altro').onclick = function () {
            var box = b.querySelector('.smy-scelte');
            if (box.hidden) { box.hidden = false; this.textContent = 'Salva la scelta'; misuraAltezza(); return; }
            decidi(b.querySelector('#smy-s').checked, b.querySelector('#smy-p').checked);
        };
        document.body.appendChild(b);
        document.documentElement.classList.add('smy-barra');
        function misuraAltezza() { document.documentElement.style.setProperty('--smy-h', (b.offsetHeight + 12) + 'px'); }
        misuraAltezza();
    }

    function parti() {
        scelta = leggi();
        if (scelta) avvia();
        else setTimeout(function () { if (!leggi()) barra(false); }, 700);   // dopo il primo disegno della pagina
    }
    // Una pagina preparata in anticipo dal browser (prerender della home) non e' una pagina vista: si aspetta che venga aperta.
    if (document.prerendering) document.addEventListener('prerenderingchange', parti, { once: true });
    else parti();
})();
