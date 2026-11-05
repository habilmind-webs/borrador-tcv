# Lista de revisión del borrador (la usa Esmarelda)

Borrador publicado solo en `https://<repo>.2-31-95-201.sslip.io` (noindex). Nunca toca dominios reales.

- [ ] **Imágenes propias**: todas en `public/` o `src/`; ninguna URL de Lovable (`lovable`, `__l5e`, `gpt-engineer`).
- [ ] **GA4 con Consent v2**: `GA4_ID` correcto; 0 peticiones a Google antes de «Aceptar»; tras aceptar, `collect` con el ID.
- [ ] **Banner Flash** presente (`serve-widget`).
- [ ] **Chat de Ofelia** presente (`https://go.habilmind.net/webchat/widget.js`).
- [ ] **PageSpeed** (móvil y escritorio) anotado; imágenes con `width`/`height`, webp/avif.
- [ ] Textos, enlaces y formularios revisados.
- [ ] Resultado: «apto para dominio real» o lista de cambios.

**Pasar a dominio real: solo con el OK de Joaquín** (DNS + Caddy de producción).
