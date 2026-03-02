import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // تعطيل خرائط المصدر لتقليل الحجم
  },
  server: {
    // هذه الإعدادات تعمل فقط محلياً ولن تؤثر على الرفع
    port: 5003,
    host: 'localhost',
  }
});