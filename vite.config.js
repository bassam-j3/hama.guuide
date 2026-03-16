import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { VitePWA } from 'vite-plugin-pwa'; // 🚀 استيراد مكتبة PWA

export default defineConfig({
  plugins: [
    react(), 
    sentryVitePlugin({
      org: "bjtcompany",
      project: "hama-guide"
    }),
    // 🚀 إعدادات تطبيق الـ PWA السحرية
    VitePWA({
      registerType: 'autoUpdate', // تحديث التطبيق عند العميل تلقائياً إذا رفعت كوداً جديداً
      devOptions: {
        enabled: true // تفعيل الـ PWA في بيئة التطوير لنتمكن من اختباره
      },
      manifest: {
        name: 'لوحة تحكم دليل حماة',
        short_name: 'دليل حماة',
        description: 'نظام إدارة المحتوى الشامل لدليل حماة',
        theme_color: '#ffffff', // لون شريط الإشعارات في الجوال
        background_color: '#f8f9fa',
        display: 'standalone', // 🚀 الأهم: يفتح كتطبيق مستقل بدون أشرطة المتصفح
        lang: 'ar',
        dir: 'rtl',
        icons: [
          {
            src: '/logo192.png', // ⚠️ تأكد من وضع صورة بهذا الاسم في مجلد public
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo512.png', // ⚠️ تأكد من وضع صورة بهذا الاسم في مجلد public
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5003,
    host: 'localhost',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: false,
  }
});