import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// Camera and geolocation need a secure context, so testing the scan on a real
// phone needs HTTPS even over the LAN — a plain http://192.168.x.x address will
// have getUserMedia refused. `npm run dev:https` serves the app with a
// self-signed cert on every interface; the phone warns once about the
// certificate, which is expected. Normal `npm run dev` and production builds
// are unaffected.
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const httpsDev = mode === 'https';

  return {
    logLevel: 'error', // Suppress warnings, only show errors
    plugins: [
      react(),
      ...(httpsDev ? [basicSsl()] : []),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
