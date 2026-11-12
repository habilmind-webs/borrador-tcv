// Idiomas de la ficha técnica leídos de la hoja pública de idiomas de Habilmind (mismo sistema que socioemociograma.com).
// Busca la fila cuya columna 1 = data-prueba del bloque .idiomas-chips y muestra solo los idiomas cuya celda contiene ✅.
// Si la hoja no carga, no existe la fila o no hay ningún ✅, se queda el HTML estático (fallback = idiomas actuales de la ficha).
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1iXoHFP9jHA4YXEaf9CHRjCLEIQkChWdRRL8QfPri8sg/gviz/tq?tqx=out:csv';

const IDIOMAS = [
  { col: 'Español', flag: 'es', alt: 'Bandera de España', key: 'es' },
  { col: 'Inglés', flag: 'gb', alt: 'Bandera de Reino Unido', key: 'en' },
  { col: 'Portugués (Brasil)', flag: 'br', alt: 'Bandera de Brasil', key: 'pt-br' },
  { col: 'Portugués (Portugal)', flag: 'pt', alt: 'Bandera de Portugal', key: 'pt-pt' },
  { col: 'Catalán', flag: 'cat', alt: 'Bandera de Cataluña', key: 'ca' },
];

function parseCSVRow(row) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (q && row[i + 1] === '"') { cur += '"'; i++; } else { q = !q; }
    } else if (ch === ',' && !q) { out.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  out.push(cur.trim());
  return out;
}

export function initIdiomasHoja() {
  const box = document.querySelector('.idiomas-chips[data-prueba]');
  if (!box) return;
  const prueba = box.dataset.prueba.trim();
  const labels = {
    es: box.dataset.labelEs || 'Español',
    en: box.dataset.labelEn || 'Inglés',
    'pt-br': box.dataset.labelPtBr || 'Portugués BR',
    'pt-pt': box.dataset.labelPtPt || 'Portugués PT',
    ca: box.dataset.labelCa || 'Catalán',
  };
  fetch(SHEET_CSV_URL, { credentials: 'omit', referrerPolicy: 'no-referrer' })
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error('hoja ' + r.status))))
    .then((csv) => {
      const lines = csv.split('\n').filter((l) => l.trim());
      const hi = lines.findIndex((l) => l.includes('Nombre de la prueba'));
      if (hi === -1) return;
      const headers = parseCSVRow(lines[hi]).map((h) => h.replace(/"/g, '').trim());
      const row = lines.map(parseCSVRow).find((c) => (c[0] || '').replace(/"/g, '').trim() === prueba);
      if (!row) return; // sin fila (p. ej. COB): fallback
      const disponibles = IDIOMAS.filter((idi) => {
        const ci = headers.indexOf(idi.col);
        return ci !== -1 && (row[ci] || '').includes('✅');
      });
      if (!disponibles.length) return;
      box.replaceChildren(...disponibles.map((idi) => {
        const chip = document.createElement('span');
        chip.className = 'idioma-chip';
        const img = document.createElement('img');
        img.src = '/img/flags/' + idi.flag + '.webp';
        img.alt = idi.alt;
        img.width = 16;
        img.height = 16;
        img.loading = 'lazy';
        chip.append(img, labels[idi.key]);
        return chip;
      }));
      box.dataset.fuente = 'hoja';
    })
    .catch(() => { /* fallback: se queda lo que hay en el HTML */ });
}
