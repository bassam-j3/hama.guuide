import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), sentryVitePlugin({
    org: "bjtcompany",
    project: "hama-guide"
  })],
  build: {
    outDir: 'dist',
    sourcemap: true, // تعطيل خرائط المصدر لتقليل الحجم
  },
  server: {
    // هذه الإعدادات تعمل فقط محلياً ولن تؤثر على الرفع
    port: 5003,
    host: 'localhost',
  }
});