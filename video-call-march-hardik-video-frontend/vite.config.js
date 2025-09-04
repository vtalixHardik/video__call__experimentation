import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    host: true, // listen on all addresses
    hmr: {
      host: '192.168.1.23', // e.g. '192.168.1.10'
      port: 5173, // or whatever your vite port is
    },
  },
})
