/* ============================================
   SaraMore Yoga — consenso ai cookie e misura (v1, 05/10/2026)
   ============================================
   Che cosa fa:
   - mostra la barra dei cookie a chi non ha ancora scelto;
   - SOLO dopo un si' carica il tag Google (consent mode v2, modalita' base: prima della scelta non parte nulla);
   - misura(evento) manda i clic di contatto a Google Analytics e/o a Google Ads, secondo la scelta.
   File servito con cache di un anno (netlify.toml): NON modificarlo dopo la pubblicazione.
   Per cambiarlo: copiare la cartella in /assets/misura/v2/ e aggiornare il percorso in fondo a main.js.
   Spegnere la misura: nuova versione con GA4 e ADS vuoti (non mostra la barra e cancella i cookie di Google gia' scritti).
   Contratto degli eventi, prove e rollback: CLAUDE.md del sito e Sara/piano-misurazione-e-campagne-2026-10.md nella Conoscenza. */
(function () {
    'use strict';

    var VERSIONE = 1;              // versione dell'informativa: se cambia, la scelta viene richiesta di nuovo
    var GA4 = 'G-35EEBYC4Q3';      // ID misurazione di Google Analytics 4 (proprieta' saramoreyoga.com); vuoto = Analytics spento
    var ADS = 'AW-18495474352';    // tag dell'account Google Ads 117-110-5786; vuoto = Ads spento
    var CONV = {                   // evento nostro -> azione di conversione di Google Ads
        clic_whatsapp: 'AW-18495474352/xzAiCOGA7ZEdELCVqvNE',
        prenotazione_registrata: 'AW-18495474352/MyO6COSA7ZEdELCVqvNE',
        clic_pagamento_evento: 'AW-18495474352/5kTqCOeA7ZEdELCVqvNE'
    };
    var COOKIE = 'smy_consenso';
    var DURATA = 365 * 24 * 3600;  // la scelta vale 12 mesi
    var DI_STATISTICA = /^(_ga|_gid|_gat)/, DI_PUBBLICITA = /^(_gcl_|_gac_)/;

    window.misura = function () {};

    /* Toglie i cookie di Google scritti sul nostro dominio, per categoria. Quelli dei domini di Google non sono raggiungibili da qui. */
    function pulisci(statistica, pubblicita) {
        if (!statistica && !pubblicita) return;
        var host = location.hostname.replace(/^www\./, '');
        document.cookie.split('; ').forEach(function (c) {
            var nome = c.split('=')[0];
            if (!((statistica && DI_STATISTICA.test(nome)) || (pubblicita && DI_PUBBLICITA.test(nome)))) return;
            ['', '; Domain=' + host, '; Domain=.' + host].forEach(function (d) {
                document.cookie = nome + '=; Max-Age=0; Path=/' + d;
            });
        });
    }

    /* Traffico interno (Sara, Giuse): /?interno=1 spegne barra e misura su quel dispositivo, /?interno=0 li riaccende.
       Sulla pagina aperta con ?interno=1 vale subito, anche se il browser non permette di ricordarlo. */
    var interno = false, q = null;
    try { q = new URLSearchParams(location.search).get('interno'); } catch (e) {}
    if (q === '1') interno = true;
    try {
        if (q === '1') localStorage.setItem('smy_interno', '1');
        if (q === '0') localStorage.removeItem('smy_interno');
        if (q !== '0' && localStorage.getItem('smy_interno') === '1') interno = true;
    } catch (e) {}
    if (interno) return;

    /* Versione di spegnimento (entrambi gli ID vuoti): niente barra, niente tag, via i cookie di Google gia' scritti.
       Il link "Preferenze cookie" porta alla pagina della cookie policy. */
    if (!GA4 && !ADS) { pulisci(true, true); return; }

    var scelta = null;                       // { s: statistiche, p: pubblicita' } oppure null se non c'e' una scelta valida
    var avviato = false;                     // il tag Google e' stato caricato in questa pagina
    var caricato = { s: false, p: false };   // per che cosa e' stato configurato il tag in questa pagina
    var origine = null;                      // da dove e' stata aperta la barra, per restituire il fuoco alla chiusura
    var canale = null;                       // avvisa le altre schede quando la scelta cambia

    /* La scelta e' valida solo se il cookie ha la forma esatta, la versione attuale e una data plausibile non piu' vecchia di 12 mesi. */
    function leggi() {
        var m = document.cookie.match(/(?:^|; )smy_consenso=([^;]*)/);
        if (!m) return null;
        var p = /^(\d{1,4})\.([01])\.([01])\.(\d{9,11})$/.exec(m[1]);   // versione.statistiche.pubblicita.quando
        if (!p || Number(p[1]) !== VERSIONE) return null;
        var eta = Date.now() / 1000 - Number(p[4]);
        if (eta < -86400 || eta > DURATA) return null;
        return { s: p[2] === '1', p: p[3] === '1' };
    }
    function scrivi(s, p) {
        document.cookie = COOKIE + '=' + [VERSIONE, s ? 1 : 0, p ? 1 : 0, Math.floor(Date.now() / 1000)].join('.') +
            '; Max-Age=' + DURATA + '; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    }
    function uguali(a, b) { return (!a && !b) || (!!a && !!b && a.s === b.s && a.p === b.p); }
    function segnali(sc) {
        var ga = !!(sc && sc.s && GA4), ads = !!(sc && sc.p && ADS);
        return { analytics_storage: ga ? 'granted' : 'denied', ad_storage: ads ? 'granted' : 'denied',
                 ad_user_data: ads ? 'granted' : 'denied', ad_personalization: 'denied' };   // la personalizzazione degli annunci resta sempre negata
    }

    function gtag() { window.dataLayer.push(arguments); }

    /* Carica il tag Google solo per cio' che e' stato accettato. */
    function avvia() {
        if (avviato || !scelta) return;
        var ga = scelta.s && GA4, ads = scelta.p && ADS;
        if (!ga && !ads) return;
        avviato = true;
        caricato = { s: !!ga, p: !!ads };
        window.dataLayer = window.dataLayer || [];
        window.gtag = gtag;
        gtag('consent', 'default', segnali(null));
        gtag('consent', 'update', segnali(scelta));
        gtag('js', new Date());
        if (ga) gtag('config', GA4, { cookie_expires: DURATA, cookie_update: false, allow_google_signals: false, allow_ad_personalization_signals: false });
        if (ads) gtag('config', ADS, { allow_enhanced_conversions: false });
        var el = document.createElement('script');
        el.async = true;
        el.src = 'https://www.googletagmanager.com/gtag/js?id=' + (ga || ads);
        document.head.appendChild(el);
    }

    /* Riallinea la pagina alla scelta scritta nel cookie: puo' essere cambiata in un'altra scheda, oppure la pagina puo' essere
       tornata dalla cache del browser con lo stato di prima. Se il tag e' gia' in pagina gli si toglie subito l'autorizzazione,
       e con ricarica = true si riparte da una pagina pulita. */
    function riallinea(ricarica) {
        var ora = leggi();
        if (uguali(ora, scelta)) return;
        scelta = ora;
        pulisci(!(ora && ora.s), !(ora && ora.p));
        if (avviato) {
            gtag('consent', 'update', segnali(ora));
            if (ricarica) location.reload();
            return;
        }
        if (ora) { chiudi(); avvia(); }
    }

    /* Unico punto da cui partono gli eventi. Senza consenso non fa nulla (e non accoda nulla per dopo).
       Ogni evento parte solo verso cio' che e' stato caricato in questa pagina E risulta ancora accettato nel cookie. */
    window.misura = function (evento, parametri) {
        riallinea(false);
        if (!avviato || !scelta) return;
        if (caricato.s && scelta.s) {
            var dati = {};
            if (parametri && typeof parametri.posizione === 'string') dati.posizione = parametri.posizione;   // unico parametro previsto dal contratto
            dati.send_to = GA4;
            gtag('event', evento, dati);
        }
        if (caricato.p && scelta.p && CONV[evento]) gtag('event', 'conversion', { send_to: CONV[evento] });
    };

    /* --- Clic di contatto: sono indizi di interesse, non messaggi ricevuti. Non si manda ne' l'indirizzo ne' il testo del link.
       Si contano il clic normale e quello con il tasto centrale (nuova scheda); l'apertura dal menu del tasto destro non si vede. --- */
    function sulClic(e) {
        if (e.type === 'auxclick' && e.button !== 1) return;
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;
        if (a.hasAttribute('data-preferenze-cookie')) {
            if (e.type === 'click') { e.preventDefault(); origine = a; barra(true); }
            return;
        }
        var h = a.getAttribute('href') || '';
        var dove = a.closest('.whatsapp-container') ? 'flottante' : a.closest('footer') ? 'piede' : a.closest('#event-detail') ? 'evento' : 'corpo';
        if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(h)) window.misura('clic_whatsapp', { posizione: dove });
        else if (/^mailto:/.test(h)) window.misura('clic_email', { posizione: dove });
        else if (/^tel:/.test(h)) window.misura('clic_telefono', { posizione: dove });
        else if (/^https:\/\/[a-z]+\.stripe\.com\//.test(h)) window.misura('clic_pagamento_evento', { posizione: dove });
    }
    document.addEventListener('click', sulClic, true);
    document.addEventListener('auxclick', sulClic, true);

    /* --- Conferma di prenotazione mostrata dal modulo: si osserva il messaggio verde, senza toccare submitBooking() in main.js.
       Non e' "una prenotazione certa": e' la conferma a schermo, al massimo una ogni 5 secondi. --- */
    var esito = document.getElementById('booking-message');
    if (esito && window.MutationObserver) {
        var ultima = 0;
        new MutationObserver(function () {
            if (/\bsuccess\b/.test(esito.className) && Date.now() - ultima > 5000) { ultima = Date.now(); window.misura('prenotazione_registrata'); }
        }).observe(esito, { attributes: true, attributeFilter: ['class'] });
    }

    /* --- Barra dei cookie --- */
    var CSS = '' +
        '#smy-consenso{position:fixed;left:12px;bottom:12px;z-index:1500;box-sizing:border-box;width:calc(100% - 24px);max-width:500px;max-height:calc(100vh - 24px);overflow:auto;padding:12px 14px;' +
        'background:#FAF7F2;color:#2A2A28;border:1px solid #D9D2C5;border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,.14);font:400 13px/1.45 Inter,system-ui,sans-serif}' +
        '#smy-consenso p{margin:0 0 10px;padding-right:24px}#smy-consenso a{color:#5E6B53;text-decoration:underline}' +
        '#smy-consenso .smy-scelte{margin:0 0 10px}#smy-consenso label{display:block;margin:4px 0;cursor:pointer}#smy-consenso input{margin-right:8px;accent-color:#5E6B53}' +
        '#smy-consenso .smy-bottoni{display:flex;flex-wrap:wrap;gap:8px}' +
        '#smy-consenso button{font:500 13px/1 Inter,system-ui,sans-serif;min-height:38px;padding:0 12px;border-radius:50px;cursor:pointer}' +
        '#smy-consenso .smy-si,#smy-consenso .smy-no{flex:1 1 84px;background:#2A2A28;color:#fff;border:1px solid #2A2A28}' +
        '#smy-consenso .smy-altro{flex:0 0 auto;background:transparent;color:#2A2A28;border:1px solid transparent;text-decoration:underline;padding:0 6px}' +
        '#smy-consenso .smy-x{position:absolute;top:4px;right:4px;min-height:32px;width:32px;padding:0;background:transparent;border:0;color:#2A2A28;font-size:20px;line-height:1}' +
        '#smy-consenso button:focus-visible,#smy-consenso input:focus-visible{outline:2px solid #5E6B53;outline-offset:2px}' +
        '@media (max-width:700px){html.smy-barra .whatsapp-container{transform:translateY(calc(-1 * var(--smy-h,0px)));transition:transform .2s}}';

    function altezza() {
        var b = document.getElementById('smy-consenso');
        if (b) document.documentElement.style.setProperty('--smy-h', (b.offsetHeight + 12) + 'px');
    }
    window.addEventListener('resize', altezza);

    function chiudi() {
        var b = document.getElementById('smy-consenso');
        if (!b) return;
        var dentro = b.contains(document.activeElement);
        b.parentNode.removeChild(b);
        document.documentElement.classList.remove('smy-barra');
        if (dentro && origine && document.contains(origine)) origine.focus();
        origine = null;
    }

    function decidi(s, p) {
        var prima = scelta, nuova = { s: s, p: p };
        scrivi(s, p);
        scelta = nuova;
        chiudi();
        try { if (canale) canale.postMessage(1); } catch (e) {}
        if (avviato) {
            // Il tag e' gia' in pagina: prima gli si aggiorna l'autorizzazione (una revoca vale subito), poi si riparte da una pagina pulita.
            if (!uguali(prima, nuova)) { gtag('consent', 'update', segnali(nuova)); pulisci(!s, !p); location.reload(); }
            return;
        }
        pulisci(!s, !p);
        avvia();
    }

    /* dettagli = true: aperta dal link "Preferenze cookie", mostra subito le due caselle con la scelta attuale. */
    function barra(dettagli) {
        var tieni = origine;
        chiudi();
        origine = tieni;
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
            '<button type="button" class="smy-x" aria-label="' + (scelta ? 'Chiudi senza cambiare la scelta' : 'Chiudi e rifiuta i cookie facoltativi') + '">&times;</button>' +
            '<p>Questo sito usa cookie tecnici e, solo se accetti, cookie di <strong>statistica</strong> e di <strong>pubblicit&agrave;</strong> di Google ' +
            'per misurare visite e annunci.' + (scelta ? '' : ' Chiudendo con la X li rifiuti.') + ' <a href="/cookie-policy/">Cookie Policy</a></p>' +
            '<div class="smy-scelte"' + (dettagli ? '' : ' hidden') + '>' +
            '<label><input type="checkbox" id="smy-s"' + (scelta && scelta.s ? ' checked' : '') + '>Statistiche (Google Analytics)</label>' +
            '<label><input type="checkbox" id="smy-p"' + (scelta && scelta.p ? ' checked' : '') + '>Pubblicit&agrave; (misura degli annunci Google)</label>' +
            '</div>' +
            '<div class="smy-bottoni">' +
            '<button type="button" class="smy-no">Rifiuta tutti</button>' +
            '<button type="button" class="smy-si">Accetta tutti</button>' +
            '<button type="button" class="smy-altro">' + (dettagli ? 'Salva la scelta' : 'Personalizza') + '</button>' +
            '</div>';
        // La X vale rifiuto solo per chi non ha ancora scelto; se la barra e' stata riaperta dalle preferenze, chiude senza cambiare nulla.
        b.querySelector('.smy-x').onclick = function () { if (scelta) chiudi(); else decidi(false, false); };
        b.querySelector('.smy-no').onclick = function () { decidi(false, false); };
        b.querySelector('.smy-si').onclick = function () { decidi(true, true); };
        b.querySelector('.smy-altro').onclick = function () {
            var box = b.querySelector('.smy-scelte');
            if (box.hidden) { box.hidden = false; this.textContent = 'Salva la scelta'; altezza(); b.querySelector('#smy-s').focus(); return; }
            decidi(b.querySelector('#smy-s').checked, b.querySelector('#smy-p').checked);
        };
        document.body.appendChild(b);
        document.documentElement.classList.add('smy-barra');
        altezza();
        if (dettagli) b.querySelector('#smy-s').focus();   // aperta dall'utente: il fuoco va sulle caselle. Alla prima visita non si ruba il fuoco.
    }

    /* Una scelta fatta in un'altra scheda arriva qui: subito l'autorizzazione, la ricarica quando la scheda torna visibile. */
    try { canale = new BroadcastChannel('smy_consenso'); canale.onmessage = function () { riallinea(document.visibilityState === 'visible'); }; } catch (e) {}
    function ritorno() { riallinea(true); if (!scelta && !document.getElementById('smy-consenso')) barra(false); }
    window.addEventListener('pageshow', function (e) { if (e.persisted) ritorno(); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && !document.prerendering) ritorno(); });

    function parti() {
        scelta = leggi();
        pulisci(!(scelta && scelta.s), !(scelta && scelta.p));   // via i cookie di Google di cio' che non e' (piu') accettato: scelta scaduta, versione cambiata, cookie tolto
        if (scelta) avvia();
        else setTimeout(function () { riallinea(false); if (!scelta) barra(false); }, 700);   // dopo il primo disegno della pagina
    }
    // Una pagina preparata in anticipo dal browser (prerender della home) non e' una pagina vista: si aspetta che venga aperta.
    if (document.prerendering) document.addEventListener('prerenderingchange', parti, { once: true });
    else parti();
})();
