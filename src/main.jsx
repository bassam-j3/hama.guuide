import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// 🚀 1. استيراد أدوات React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 🚀 2. إنشاء نسخة من الـ QueryClient مع بعض الإعدادات الاحترافية
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // لا تقم بإعادة الجلب كلما عاد المستخدم لنافذة المتصفح
      retry: 1, // إذا فشل الاتصال، جرب مرة واحدة إضافية قبل إعلان الخطأ
      staleTime: 5 * 60 * 1000, // اعتبر البيانات "طازجة" لمدة 5 دقائق (لا تجلبها من السيرفر مجدداً خلال هذه المدة)
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 🚀 3. تغليف التطبيق بالـ Provider */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)