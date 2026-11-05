// Carrusel de expertos (sin framework). Autoplay cada 3 s, como en socioemociograma.
// - Se DETIENE del todo al interactuar: clic en flechas o dots, arrastre/swipe, rueda horizontal, o teclado. No hay botón de play/pausa visible.
// - Se PAUSA mientras el ratón está encima o el foco está dentro (tarjetas o controles) y sigue al salir, salvo que ya se haya detenido.
// - Con prefers-reduced-motion: reduce NO hay autoplay.
// - Solo avanza si el carrusel está a la vista y la pestaña visible. Al llegar al final vuelve al primero.
// - aria-live="off" mientras hay autoplay y "polite" cuando está detenido (patrón WAI-ARIA APG).
const INTERVALO = 3000;

export function initExpertos(raiz = document.querySelector('[data-exp-carrusel]')) {
  if (!raiz) return;
  const pista = raiz.querySelector('.exp-pista');
  const slides = Array.from(pista.querySelectorAll('.exp-slide'));
  const dots = Array.from(raiz.querySelectorAll('.exp-dot'));
  const prev = raiz.querySelector('.exp-prev');
  const next = raiz.querySelector('.exp-next');
  if (!slides.length) return;

  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  let detenido = reducido.matches; // detenido = el usuario (o reduced-motion) paró el autoplay
  let encima = false, foco = false, visible = false;
  let temporizador = null, actual = 0;

  // Posición de scroll que deja la tarjeta i alineada al inicio (tras el padding de la pista, igual que scroll-snap-align:start).
  const posDe = (el) => el.offsetLeft - pista.offsetLeft - (parseFloat(getComputedStyle(pista).paddingLeft) || 0);
  const indiceActual = () => {
    let mejor = 0, dist = Infinity;
    slides.forEach((s, i) => { const d = Math.abs(posDe(s) - pista.scrollLeft); if (d < dist) { dist = d; mejor = i; } });
    // Al final del scroll las últimas tarjetas no pueden alinearse: respetar el dot elegido.
    const max = pista.scrollWidth - pista.clientWidth;
    if (pista.scrollLeft >= max - 2 && actual > mejor) return actual;
    return mejor;
  };
  const marcar = (i) => {
    actual = i;
    dots.forEach((d, j) => (j === i ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
  };
  const ir = (i) => {
    const n = slides.length;
    i = ((i % n) + n) % n;
    const max = pista.scrollWidth - pista.clientWidth;
    pista.scrollTo({ left: Math.max(0, Math.min(max, posDe(slides[i]))), behavior: reducido.matches ? 'auto' : 'smooth' });
    marcar(i);
  };
  const paso = (dir) => {
    // Si ya estamos al final del scroll, «siguiente» vuelve al principio (y al revés).
    const max = pista.scrollWidth - pista.clientWidth;
    if (dir > 0 && pista.scrollLeft >= max - 2) return ir(0);
    if (dir < 0 && pista.scrollLeft <= 2) return ir(slides.length - 1);
    ir(actual + dir);
  };

  const programar = () => {
    clearInterval(temporizador); temporizador = null;
    const corre = !detenido && !encima && !foco && visible && !document.hidden;
    pista.setAttribute('aria-live', detenido ? 'polite' : 'off');
    raiz.dataset.autoplay = corre ? 'on' : (detenido ? 'detenido' : 'pausa');
    if (corre) temporizador = setInterval(() => paso(1), INTERVALO);
  };
  const detener = () => { detenido = true; programar(); };

  prev.addEventListener('click', () => { detener(); paso(-1); });
  next.addEventListener('click', () => { detener(); paso(1); });
  dots.forEach((d, i) => d.addEventListener('click', () => { detener(); ir(i); }));

  // Hover y foco: pausa mientras dura.
  raiz.addEventListener('mouseenter', () => { encima = true; programar(); });
  raiz.addEventListener('mouseleave', () => { encima = false; programar(); });
  raiz.addEventListener('focusin', () => { foco = true; programar(); });
  raiz.addEventListener('focusout', (e) => { if (!raiz.contains(e.relatedTarget)) { foco = false; programar(); } });

  // Teclado: flechas izquierda/derecha, Inicio/Fin dentro del carrusel.
  raiz.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'Home' || k === 'End') {
      e.preventDefault(); detener();
      if (k === 'ArrowLeft') paso(-1); else if (k === 'ArrowRight') paso(1); else ir(k === 'Home' ? 0 : slides.length - 1);
    }
  });

  // Swipe táctil (scroll nativo) y rueda: cuentan como interacción.
  pista.addEventListener('touchstart', detener, { passive: true });
  pista.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) detener(); }, { passive: true });

  // Arrastre con ratón en escritorio.
  let arr = null;
  pista.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    arr = { x: e.clientX, left: pista.scrollLeft, movido: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!arr) return;
    const dx = e.clientX - arr.x;
    if (!arr.movido && Math.abs(dx) > 5) { arr.movido = true; detener(); pista.classList.add('arrastrando'); }
    if (arr.movido) pista.scrollLeft = arr.left - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!arr) return;
    const movido = arr.movido; arr = null;
    if (movido) {
      pista.classList.remove('arrastrando');
      // Evita que el clic final del arrastre abra el «Saber más».
      pista.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); }, { capture: true, once: true });
      ir(indiceActual());
    }
  });

  // Dot activo según el scroll (también tras swipe nativo).
  let t;
  pista.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => marcar(indiceActual()), 80); }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; programar(); }, { threshold: 0.25 }).observe(raiz);
  } else visible = true;
  document.addEventListener('visibilitychange', programar);
  reducido.addEventListener?.('change', (e) => { if (e.matches) detener(); });

  marcar(0); programar();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initExpertos());
else initExpertos();
