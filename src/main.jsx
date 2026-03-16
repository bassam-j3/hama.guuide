import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 🚀 1. استيراد Sentry
import * as Sentry from "@sentry/react";

// 🚀 2. تهيئة Sentry (نظام المراقبة المتقدم)
Sentry.init({
  dsn: "https://d6aee3b1f7ec03eb67d8644b226f56d1@o4511054366310400.ingest.us.sentry.io/4511054375878656", 
  
  // 🚀 تفعيل جمع بيانات المستخدم (مثل الـ IP) بناءً على توصية Sentry
  sendDefaultPii: true,
  
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false, // لكي تتمكن من قراءة النصوص في فيديو الخطأ
      blockAllMedia: false, // لكي تتمكن من رؤية الصور في فيديو الخطأ
    }),
  ],
  // تتبع أداء الصفحات
  tracesSampleRate: 1.0, 
  
  // تصوير الشاشة بالفيديو (Replays)
  replaysSessionSampleRate: 0.1, 
  replaysOnErrorSampleRate: 1.0, // تصوير 100% من الأخطاء التي تحدث!
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, 
      retry: 1, 
      staleTime: 5 * 60 * 1000, 
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)