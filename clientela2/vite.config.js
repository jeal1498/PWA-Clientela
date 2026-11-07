import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' + HashRouter: el build funciona en cualquier carpeta de GitHub Pages.
// Clientela 2.0 es la app principal: se compila a app/ (la raíz es la web) → https://jeal1498.github.io/PWA-Clientela/app/
// (la app anterior vive en ../v1). emptyOutDir en false para no borrar el resto del repo; `npm run build` limpia ../app/assets antes.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: { outDir: '../app', emptyOutDir: false },
});
