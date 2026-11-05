import './style.css';

// GA4 con Consent Mode v2. Pon aquí el ID G-XXXXXXXXXX de la web (lo da Esmarelda/Ofelia).
// En el borrador (*.sslip.io) NO se carga GA4 nunca, para no ensuciar las estadísticas.
const GA4_ID = 'G-XXXXXXXXXX';
const ES_BORRADOR = location.hostname.endsWith('.sslip.io') || location.hostname === 'localhost';
const KEY = 'hm-consent-analitica';

function cargarGA4() {
  if (ES_BORRADOR || !/^G-[A-Z0-9]{6,}$/.test(GA4_ID) || GA4_ID === 'G-XXXXXXXXXX') return;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
  const s = document.createElement('script');
  s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
  document.head.appendChild(s);
  gtag('js', new Date()); gtag('config', GA4_ID);
}

const caja = document.getElementById('cookies');
const v = localStorage.getItem(KEY);
if (v === 'si') cargarGA4();
else if (v !== 'no') caja.hidden = false;
document.getElementById('ck-aceptar').onclick = () => { localStorage.setItem(KEY, 'si'); caja.hidden = true; cargarGA4(); };
document.getElementById('ck-rechazar').onclick = () => { localStorage.setItem(KEY, 'no'); caja.hidden = true; };
