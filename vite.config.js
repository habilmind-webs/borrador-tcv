// Multipágina: la home y cada subpágina son HTML estáticos (enlaces con barra final: /que-es/).
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: { rollupOptions: { input: {
    main: resolve(__dirname, 'index.html'),
    'que-es': resolve(__dirname, 'que-es/index.html'),
    'aplicacion': resolve(__dirname, 'aplicacion/index.html'),
    'indicadores': resolve(__dirname, 'indicadores/index.html'),
    'informes': resolve(__dirname, 'informes/index.html'),
    'documentacion': resolve(__dirname, 'documentacion/index.html'),
    'videos': resolve(__dirname, 'videos/index.html'),
    'preguntas-frecuentes': resolve(__dirname, 'preguntas-frecuentes/index.html'),
    'infografia': resolve(__dirname, 'infografia/index.html'),
    'tour-guiado': resolve(__dirname, 'tour-guiado/index.html')
  } } }
});
