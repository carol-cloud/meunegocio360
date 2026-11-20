import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Em desenvolvimento, /api é repassado ao backend local: o navegador fala sempre com a
    // mesma origem, e o cookie de refresh (SameSite=Strict) é enviado (RNF-FE-10, RNF-103).
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // O Bootstrap 5.3 ainda usa @import e funções globais do Sass; silencia apenas os
        // avisos de depreciação vindos dele.
        quietDeps: true,
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
      },
    },
  },
});
