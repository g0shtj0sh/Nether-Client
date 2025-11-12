import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Désactiver les warnings de dynamic import
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.message.includes('dynamically imported')) return;
        if (warning.message.includes('but also statically imported')) return;
        warn(warning);
      }
    }
  }
})
