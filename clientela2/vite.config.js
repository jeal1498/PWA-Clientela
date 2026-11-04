import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' + HashRouter: el build funciona en cualquier carpeta de GitHub Pages.
// Se compila a ../cotiza → https://jeal1498.github.io/PWA-Clientela/cotiza/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: { outDir: '../cotiza', emptyOutDir: true },
});
