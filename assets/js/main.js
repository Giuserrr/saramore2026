/* ============================================
   SaraMore Yoga — main.js
   ============================================ */

/* --- LOAD CLASSES (gira solo se #classes-container esiste) --- */
async function loadClasses() {
    if (!document.getElementById('classes-container')) return;
    try {
        const res = await fetch('/classes.json');
        if (!res.ok) throw new Error();
        const data = await res.json();
        renderClasses(data.classes.filter(c => c.active === true || c.active === "true"));
    } catch (e) {
        document.getElementById('classes-container').innerHTML = '<p style="color:var(--text-light);">Nessuna classe disponibile al momento.</p>';
    }
}

function renderClasses(classList) {
    const container = document.getElementById('classes-container');
    container.innerHTML = '';
    const grouped = {};
    classList.forEach(c => { if (!grouped[c.location]) grouped[c.location] = []; grouped[c.location].push(c); });
    const dayOrder = ['Lunedi','Martedi','Mercoledi','Giovedi','Venerdi','Sabato','Domenica'];

    Object.keys(grouped).forEach(location => {
        const classes = grouped[location].sort((a, b) => {
            const normalize = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
            return dayOrder.indexOf(normalize(a.day)) - dayOrder.indexOf(normalize(b.day));
        });
        const group = document.createElement('div');
        group.className = 'location-group';
        let html = '<h3 class="location-name"><i class="fas fa-map-pin"></i> ' + location + '</h3><div class="classes-grid">';
        classes.forEach(c => {
            const cid = (location.replace(/\s/g,'') + '_' + c.day + '_' + c.time).replace(/[^a-zA-Z0-9_]/g,'');
            html += '<div class="class-card">' +
                '<div class="class-day">' + c.day + '</div>' +
                '<div class="class-name">' + c.name + '</div>' +
                '<div class="class-time"><i class="far fa-clock"></i> ' + c.time + '</div>' +
                '<div class="class-meta"><i class="fas fa-users"></i> Max ' + c.maxSpots + ' posti</div>' +
                '<button class="btn-book" onclick=\'openBooking(' + JSON.stringify(c).replace(/'/g,"&#39;") + ', "' + cid + '")\'>Prenota</button>' +
                '</div>';
        });
        html += '</div>';
        group.innerHTML = html;
        container.appendChild(group);
    });
}

/* --- LOAD EVENTS (gira solo se #events-container esiste) --- */
async function loadEvents() {
    if (!document.getElementById('events-container')) return;
    try {
        const res = await fetch('/events.json');
        if (!res.ok) throw new Error();
        const data = await res.json();
        renderEvents(data.events);
    } catch (e) { renderEvents([{ active: false, title: "Coming Soon" }]); }
}

function renderEvents(list) {
    const grid = document.getElementById('events-container');
    grid.innerHTML = '';
    list.forEach(ev => {
        const card = document.createElement('article');
        if (ev.active === true || ev.active === "true") {
            card.className = 'card';
            card.onclick = function() { openDetail(ev); };
            card.innerHTML = '<img src="' + ev.image + '" alt="' + ev.title + '" onerror="this.src=\'https://via.placeholder.com/400x500/F0EBE3/8A8A85?text=Evento\'"><div class="card-info"><h3>' + ev.title + '</h3><p>' + ev.date + '</p></div>';
        } else {
            card.className = 'card coming-soon';
            card.innerHTML = '<i class="fas fa-om"></i><h3>COMING SOON</h3>';
        }
        grid.appendChild(card);
    });
}

/* --- NAVIGATION CON HISTORY (legacy SPA, mantenuta in step 2 per backward-compat) --- */
function toggleMenu() { document.getElementById('menu-overlay').classList.toggle('open'); }

function showHome(pushHistory) {
    hideAll();
    var home = document.getElementById('home-view');
    if (home) home.style.display = 'block';
    window.scrollTo(0,0);
    if (pushHistory !== false && document.getElementById('home-view')) history.pushState({ page: 'home' }, '', '/');
}

function showPage(id, pushHistory) {
    var view = document.getElementById(id + '-view');
    if (!view) return;
    hideAll();
    view.style.display = 'block';
    window.scrollTo(0,0);
    if (pushHistory !== false) history.pushState({ page: id }, '', '/#' + id);
}

function hideAll() {
    ['home','palinsesto','orari','chisono','eventi','contatti'].forEach(function(v) {
        var el = document.getElementById(v + '-view');
        if (el) el.style.display = 'none';
    });
    closeDetail();
}

window.addEventListener('popstate', function(e) {
    if (e.state && e.state.page && e.state.page !== 'home') {
        showPage(e.state.page, false);
    } else {
        showHome(false);
    }
});

function loadFromHash() {
    var hash = window.location.hash.replace('#', '');
    if (hash && ['palinsesto','orari','eventi','contatti','chisono'].indexOf(hash) !== -1) {
        showPage(hash, false);
    }
}

/* --- EVENT DETAIL --- */
function openDetail(d) {
    document.getElementById('detail-title').innerText = d.title;
    document.getElementById('detail-date').innerHTML = '<i class="far fa-calendar"></i> ' + d.date;
    document.getElementById('detail-location').innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + d.location;
    document.getElementById('detail-price').innerText = d.price ? '€ ' + d.price : 'Gratuito';
    document.getElementById('detail-desc').innerText = d.desc;
    document.getElementById('detail-img').src = d.image;
    var link = document.getElementById('detail-link');
    link.href = d.stripeLink || '#';
    link.style.display = d.stripeLink ? 'inline-block' : 'none';
    document.getElementById('event-detail').style.display = 'block';
}
function closeDetail() {
    var detail = document.getElementById('event-detail');
    if (detail) detail.style.display = 'none';
}

/* --- BOOKING --- */
var currentBooking = null;
function openBooking(cls, cid) {
    currentBooking = Object.assign({}, cls, { classId: cid });
    document.getElementById('booking-title').innerText = cls.name;
    document.getElementById('booking-info').innerText = cls.day + ' ' + cls.time + ' — ' + cls.location;
    document.getElementById('booking-message').innerText = '';
    document.getElementById('booking-form').style.display = 'block';
    document.getElementById('booking-name').value = '';
    document.getElementById('booking-email').value = '';
    document.getElementById('booking-phone').value = '';
    document.getElementById('booking-modal').classList.add('open');
}
function closeBooking() { document.getElementById('booking-modal').classList.remove('open'); currentBooking = null; }

async function submitBooking(e) {
    e.preventDefault();
    var msg = document.getElementById('booking-message');
    var form = document.getElementById('booking-form');
    var payload = {
        classId: currentBooking.classId, className: currentBooking.name,
        day: currentBooking.day, time: currentBooking.time,
        location: currentBooking.location, maxSpots: currentBooking.maxSpots,
        name: document.getElementById('booking-name').value,
        email: document.getElementById('booking-email').value,
        phone: document.getElementById('booking-phone').value
    };
    try {
        var res = await fetch('/.netlify/functions/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        var result = await res.json();
        if (res.ok) { msg.className = 'booking-msg success'; msg.innerText = result.message || 'Prenotazione confermata!'; form.style.display = 'none'; }
        else { msg.className = 'booking-msg error'; msg.innerText = result.message || 'Errore.'; }
    } catch (err) { msg.className = 'booking-msg error'; msg.innerText = 'Prenotazioni non disponibili. Contattaci via WhatsApp.'; }
}

/* --- PWA BANNER --- */
function showBanner() {
    var banner = document.getElementById('install-banner');
    if (!banner) return;
    var text = document.getElementById('install-instructions');
    var ua = navigator.userAgent || '';
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) return;
    if (localStorage.getItem('smyBannerClosed') === '1') return;
    if (/iPad|iPhone|iPod/.test(ua)) { text.innerHTML = 'Tocca Condividi e poi <b>"Aggiungi a Home"</b>'; banner.style.display = 'flex'; }
    else if (/android/i.test(ua)) { text.innerHTML = 'Installa <b>Sara More Yoga</b>'; banner.style.display = 'flex'; }
}
function closeBanner() { document.getElementById('install-banner').style.display = 'none'; localStorage.setItem('smyBannerClosed', '1'); }

/* --- TAB TITLE --- */
var _t = document.title;
window.addEventListener('blur', function() { document.title = 'Namaste... torna sul tappetino!'; });
window.addEventListener('focus', function() { document.title = _t; });

/* --- FADE IN OBSERVER --- */
var fadeObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

/* --- FAQ ACCORDION (per pagine nuove con FAQ) --- */
function initFaq() {
    document.querySelectorAll('.faq-item .faq-question').forEach(function(q) {
        q.addEventListener('click', function() {
            q.parentElement.classList.toggle('open');
        });
    });
}

/* --- INIT --- */
window.addEventListener('load', function() {
    loadClasses(); loadEvents(); showBanner(); initFaq();
    if (document.getElementById('home-view')) {
        history.replaceState({ page: 'home' }, '', window.location.pathname + window.location.hash);
        loadFromHash();
    }
    document.querySelectorAll('.fade-in').forEach(function(el) { fadeObserver.observe(el); });
});

/* --- NETLIFY IDENTITY REDIRECT (per CMS admin) --- */
if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", function(user) {
        if (!user) {
            window.netlifyIdentity.on("login", function() {
                document.location.href = "/admin/";
            });
        }
    });
}
