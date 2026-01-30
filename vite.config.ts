import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// import { crx } from '@crxjs/vite-plugin'
// import manifest from './manifest.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    // crx({ manifest }) // Disabled for dev mode - uncomment for extension build
  ],
})
