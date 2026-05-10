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
    var hash = (window.location.hash || '').replace('#', '');
    if (hash) {
        var match = list.find(function(ev) { return (ev.active === true || ev.active === "true") && slugifyEvent(ev.title) === hash; });
        if (match) openDetail(match);
    }
}

/* --- MENU --- */
function toggleMenu() {
    var overlay = document.getElementById('menu-overlay');
    var toggle = document.querySelector('.nav-toggle');
    if (!overlay) return;
    var isOpen = overlay.classList.toggle('open');
    if (toggle) toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (isOpen) {
        var firstLink = overlay.querySelector('.menu-link');
        if (firstLink) firstLink.focus();
        document.addEventListener('keydown', menuKeyHandler);
    } else {
        document.removeEventListener('keydown', menuKeyHandler);
        if (toggle) toggle.focus();
    }
}
function menuKeyHandler(e) {
    var overlay = document.getElementById('menu-overlay');
    if (!overlay || !overlay.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); toggleMenu(); return; }
    if (e.key === 'Tab') {
        var focusables = overlay.querySelectorAll('a, button');
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
}

/* --- EVENT DETAIL --- */
var detailLastFocus = null;
function slugifyEvent(text) {
    return (text || '').toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function detailKeyHandler(e) {
    var modal = document.getElementById('event-detail');
    if (!modal || modal.getAttribute('aria-hidden') === 'true') return;
    if (e.key === 'Escape') { e.preventDefault(); closeDetail(); return; }
    if (e.key === 'Tab') {
        var nodes = modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
        var focusables = Array.prototype.filter.call(nodes, function(el) {
            return el.offsetParent !== null && el.style.display !== 'none';
        });
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
}
function openDetail(d) {
    document.getElementById('detail-title').innerText = d.title;
    document.getElementById('detail-date').innerHTML = '<i class="far fa-calendar"></i> ' + d.date;
    document.getElementById('detail-location').innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + d.location;
    document.getElementById('detail-price').innerText = d.price ? '€ ' + d.price : 'Gratuito';
    document.getElementById('detail-desc').innerText = d.desc;
    var hero = document.getElementById('detail-hero');
    if (hero) {
        hero.innerHTML = d.image ? '<img src="' + d.image + '" alt="' + (d.title || '').replace(/"/g, '&quot;') + '">' : '';
    }
    var slug = slugifyEvent(d.title);
    var eventUrl = 'https://saramoreyoga.com/eventi/#' + slug;
    var waMsg = 'Ciao Sara! Vorrei prenotare l\'evento "' + d.title + '" del ' + d.date + '.';
    var wa = document.getElementById('detail-whatsapp');
    if (wa) wa.href = 'https://wa.me/393737735552?text=' + encodeURIComponent(waMsg);
    var shareBtn = document.getElementById('detail-share');
    if (shareBtn) {
        shareBtn.onclick = function() { shareEvent(d.title, eventUrl); };
        shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Condividi';
    }
    var link = document.getElementById('detail-link');
    if (link) {
        if (d.stripeLink) { link.href = d.stripeLink; link.style.display = 'inline-block'; }
        else { link.removeAttribute('href'); link.style.display = 'none'; }
    }
    if (history.replaceState) history.replaceState(null, '', '#' + slug);
    detailLastFocus = document.activeElement;
    var modal = document.getElementById('event-detail');
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) closeBtn.focus();
    document.addEventListener('keydown', detailKeyHandler);
}
function shareEvent(title, url) {
    var shareData = { title: title, text: 'Evento yoga a Genova: ' + title, url: url };
    if (navigator.share) {
        navigator.share(shareData).catch(function() {});
        return;
    }
    var btn = document.getElementById('detail-share');
    var setFeedback = function(html) {
        if (!btn) return;
        btn.innerHTML = html;
        setTimeout(function() { btn.innerHTML = '<i class="fas fa-share-alt"></i> Condividi'; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function() {
            setFeedback('<i class="fas fa-check"></i> Link copiato');
        }).catch(function() {
            window.prompt('Copia il link:', url);
        });
    } else {
        window.prompt('Copia il link:', url);
    }
}
function closeDetail() {
    var detail = document.getElementById('event-detail');
    if (detail) {
        detail.style.display = 'none';
        detail.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    document.removeEventListener('keydown', detailKeyHandler);
    var hero = document.getElementById('detail-hero');
    if (hero) hero.innerHTML = '';
    if (history.replaceState) history.replaceState(null, '', window.location.pathname);
    if (detailLastFocus && typeof detailLastFocus.focus === 'function') {
        detailLastFocus.focus();
        detailLastFocus = null;
    }
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

/* --- FAQ ACCORDION (a11y: button-like + Enter/Space) --- */
function initFaq() {
    document.querySelectorAll('.faq-item').forEach(function(item, idx) {
        var q = item.querySelector('.faq-question');
        var a = item.querySelector('.faq-answer');
        if (!q || !a) return;
        var aId = 'faq-answer-' + idx;
        a.id = aId;
        q.setAttribute('role', 'button');
        q.setAttribute('tabindex', '0');
        q.setAttribute('aria-expanded', 'false');
        q.setAttribute('aria-controls', aId);
        function toggle() {
            var isOpen = item.classList.toggle('open');
            q.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
        q.addEventListener('click', toggle);
        q.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });
    });
}

/* --- INIT --- */
function smyInit() {
    loadClasses(); loadEvents(); initFaq();
    document.querySelectorAll('.fade-in').forEach(function(el) { fadeObserver.observe(el); });
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', smyInit);
} else {
    smyInit();
}

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
