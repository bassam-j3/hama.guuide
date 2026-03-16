import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(), 
    sentryVitePlugin({
      org: "bjtcompany",
      project: "hama-guide"
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true, // 🚀 (مهم جداً) تفعيل خرائط المصدر لكي يقرأ Sentry الأخطاء بدقة
  },
  server: {
    // هذه الإعدادات تعمل فقط محلياً ولن تؤثر على الرفع
    port: 5003,
    host: 'localhost',
  },
  // 🚀 إعدادات بيئة الاختبار الآلي (Vitest)
  test: {
    globals: true,
    environment: 'jsdom', // محاكاة المتصفح داخل الـ Terminal
    setupFiles: './src/setupTests.js', // ملف إعدادات الاختبار الذي سننشئه
    css: false, // تعطيل معالجة الـ CSS أثناء الاختبار لتسريع العملية
  }
});