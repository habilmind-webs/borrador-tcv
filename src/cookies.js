// Consentimiento de cookies Habilmind (RGPD, LOPDGDD, LSSI-CE y guía de cookies de la AEPD).
// Versión en JS sin framework del patrón CookieConsent + consent-scripts del ecosistema.
// - Banner abajo al primer acceso con Aceptar / Rechazar / Configurar, los tres con el mismo peso visual.
// - Panel de configuración con interruptores por categoría (las técnicas siempre activas).
// - Bloqueo real: ningún script no esencial se carga hasta que su categoría está aceptada.
// - Se guarda en localStorage «habilmind_cookie_consent_v1» (fecha, hora y categorías aceptadas y rechazadas).
// - Emite «habilmind:cookie-consent» al decidir y escucha «habilmind:open-cookie-preferences».
// - window.openCookiePreferences() reabre el panel (enlace «Gestión de cookies» del pie).

export const CONSENT_KEY = 'habilmind_cookie_consent_v1';
export const CONSENT_EVENT = 'habilmind:cookie-consent';
export const OPEN_EVENT = 'habilmind:open-cookie-preferences';
const VERSION = 1;
const POLITICA = 'https://trust.habilmind.dev/politica-cookies-ecosistema-web';

export const CATEGORIAS = [
  { id: 'necesarias', nombre: 'Técnicas o necesarias', fija: true,
    desc: 'Imprescindibles para que la web funcione y para recordar tu elección sobre las cookies. No se pueden desactivar.' },
  { id: 'analisis', nombre: 'Análisis',
    desc: 'Nos permiten medir de forma agregada cómo se usa la web (Google Analytics 4) para mejorarla. Solo se cargan si las aceptas.' },
  { id: 'personalizacion', nombre: 'Personalización',
    desc: 'Recordarían preferencias para adaptar la web. Ahora mismo esta web no usa cookies de este tipo.' },
  { id: 'publicidad', nombre: 'Publicidad',
    desc: 'Servirían para mostrar publicidad según tu navegación. Ahora mismo esta web no usa cookies de este tipo.' },
  { id: 'terceros', nombre: 'Terceros',
    desc: 'Cookies de otros servicios no incluidos en las categorías anteriores. Ahora mismo esta web no usa cookies de este tipo.' },
];
const OPCIONALES = CATEGORIAS.filter((c) => !c.fija).map((c) => c.id);

// ---------- consent-scripts: registro central de scripts por categoría ----------
const registro = new Map(); // id -> { categoria, cargar, revocar, cargado }

export function readConsent() {
  try {
    const v = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
    if (!v || v.version !== VERSION || typeof v.categorias !== 'object') return null;
    return v;
  } catch { return null; }
}

export function hasConsent(categoria) {
  if (categoria === 'necesarias') return true;
  const v = readConsent();
  return !!(v && v.categorias[categoria] === true);
}

function aplicar() {
  for (const [, s] of registro) {
    const ok = hasConsent(s.categoria);
    if (ok && !s.cargado) { s.cargado = true; try { s.cargar(); } catch (e) { console.error(e); } }
    else if (!ok && s.cargado && s.revocar) { try { s.revocar(); } catch (e) { console.error(e); } }
  }
}

// Registra un script no esencial. Idempotente: el mismo id solo se registra y se carga una vez.
export function registerConsentScript(id, categoria, cargar, revocar) {
  if (registro.has(id)) return;
  registro.set(id, { categoria, cargar, revocar, cargado: false });
  if (hasConsent(categoria)) aplicar();
}

function guardar(categorias) {
  const ahora = new Date();
  const cats = { necesarias: true };
  OPCIONALES.forEach((id) => { cats[id] = categorias[id] === true; });
  const valor = {
    version: VERSION,
    fecha: ahora.toISOString().slice(0, 10),
    hora: ahora.toTimeString().slice(0, 8),
    timestamp: ahora.toISOString(),
    categorias: cats,
    aceptadas: Object.keys(cats).filter((k) => cats[k]),
    rechazadas: Object.keys(cats).filter((k) => !cats[k]),
  };
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(valor)); } catch { /* sin almacenamiento: se respeta igual en esta visita */ }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: valor }));
  return valor;
}

// ---------- Interfaz: banner + panel ----------
let banner, panel, ultimoFoco;

function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

function crearBanner() {
  banner = el(`
    <div class="hmc-banner" role="dialog" aria-live="polite" aria-labelledby="hmc-t" aria-describedby="hmc-d" hidden>
      <div class="hmc-in">
        <div class="hmc-txt">
          <p class="hmc-tit" id="hmc-t">Uso de Cookies</p>
          <p id="hmc-d">Utilizamos cookies propias, necesarias para que la web funcione, y, solo si las aceptas, cookies de análisis de terceros (Google Analytics) para conocer de forma agregada cómo se usa el sitio y mejorarlo. No usamos cookies de publicidad ni de perfilado. Puedes consultar nuestra <a href="${POLITICA}" target="_blank" rel="noopener">Política de Cookies</a> para obtener más información.</p>
        </div>
        <div class="hmc-btns">
          <button type="button" class="hmc-btn" data-hmc="aceptar">Aceptar</button>
          <button type="button" class="hmc-btn" data-hmc="rechazar">Rechazar</button>
          <button type="button" class="hmc-btn" data-hmc="configurar">Configurar</button>
        </div>
      </div>
    </div>`);
  document.body.appendChild(banner);
  banner.addEventListener('click', (e) => {
    const a = e.target.closest('[data-hmc]'); if (!a) return;
    const acc = a.dataset.hmc;
    if (acc === 'aceptar') decidir(Object.fromEntries(OPCIONALES.map((id) => [id, true])));
    else if (acc === 'rechazar') decidir({});
    else { banner.hidden = true; abrirPanel(); }
  });
}

function crearPanel() {
  const filas = CATEGORIAS.map((c) => `
    <div class="hmc-cat">
      <div class="hmc-cat-txt">
        <label class="hmc-cat-nom" for="hmc-${c.id}">${c.nombre}${c.fija ? ' <span class="hmc-siempre">(siempre activas)</span>' : ''}</label>
        <p id="hmc-${c.id}-d">${c.desc}</p>
      </div>
      <input class="hmc-sw" type="checkbox" role="switch" id="hmc-${c.id}" data-cat="${c.id}" aria-describedby="hmc-${c.id}-d" ${c.fija ? 'checked disabled' : ''} />
    </div>`).join('');
  panel = el(`
    <div class="hmc-capa" hidden>
      <div class="hmc-panel" role="dialog" aria-modal="true" aria-labelledby="hmc-pt" tabindex="-1">
        <div class="hmc-panel-cab">
          <p class="hmc-tit" id="hmc-pt">Configuración de cookies</p>
          <button type="button" class="hmc-cerrar" data-hmc="cerrar" aria-label="Cerrar sin guardar">×</button>
        </div>
        <p class="hmc-intro">Elige qué categorías aceptas. Puedes cambiar tu elección cuando quieras desde «Gestión de cookies», en el pie de la página. Más información en la <a href="${POLITICA}" target="_blank" rel="noopener">Política de Cookies</a>.</p>
        <div class="hmc-cats">${filas}</div>
        <div class="hmc-btns">
          <button type="button" class="hmc-btn" data-hmc="todas">Aceptar todas</button>
          <button type="button" class="hmc-btn" data-hmc="ninguna">Rechazar todo</button>
          <button type="button" class="hmc-btn" data-hmc="guardar">Guardar selección</button>
        </div>
      </div>
    </div>`);
  document.body.appendChild(panel);
  panel.addEventListener('click', (e) => {
    if (e.target === panel) { cerrarPanel(); return; }
    const a = e.target.closest('[data-hmc]'); if (!a) return;
    const acc = a.dataset.hmc;
    if (acc === 'cerrar') cerrarPanel();
    else if (acc === 'todas') decidir(Object.fromEntries(OPCIONALES.map((id) => [id, true])));
    else if (acc === 'ninguna') decidir({});
    else if (acc === 'guardar') {
      const sel = {};
      panel.querySelectorAll('.hmc-sw[data-cat]').forEach((i) => { if (!i.disabled) sel[i.dataset.cat] = i.checked; });
      decidir(sel);
    }
  });
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { cerrarPanel(); return; }
    if (e.key !== 'Tab') return;
    const f = [...panel.querySelectorAll('button, a[href], input:not([disabled])')];
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });
}

function abrirPanel() {
  if (!panel) crearPanel();
  const v = readConsent();
  panel.querySelectorAll('.hmc-sw[data-cat]').forEach((i) => { if (!i.disabled) i.checked = !!(v && v.categorias[i.dataset.cat]); });
  ultimoFoco = document.activeElement;
  panel.hidden = false;
  document.documentElement.classList.add('hmc-abierto');
  panel.querySelector('.hmc-panel').focus();
}

function cerrarPanel() {
  if (!panel || panel.hidden) return;
  panel.hidden = true;
  document.documentElement.classList.remove('hmc-abierto');
  if (!readConsent() && banner) banner.hidden = false; // sin decisión, el banner sigue a la vista
  if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
}

function decidir(categorias) {
  guardar(categorias);
  if (banner) banner.hidden = true;
  cerrarPanel();
}

export function openCookiePreferences() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

// Equivalente a initConsentScripts(): se llama una vez al cargar la página.
export function initConsentScripts() {
  if (window.__hmConsentInit) return; window.__hmConsentInit = true;
  window.openCookiePreferences = openCookiePreferences;
  window.addEventListener(OPEN_EVENT, () => { if (banner) banner.hidden = true; abrirPanel(); });
  window.addEventListener(CONSENT_EVENT, aplicar);
  window.addEventListener('storage', (e) => { if (e.key === CONSENT_KEY) aplicar(); });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-cookie-preferences]');
    if (a) { e.preventDefault(); openCookiePreferences(); }
  });
  crearBanner();
  if (!readConsent()) banner.hidden = false;
  aplicar();
}
