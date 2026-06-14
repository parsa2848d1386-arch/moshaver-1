# پلتفرم مشاوره هوشمند (Moshaver-1)

این پروژه یک سیستم چت پیشرفته برای مشاوره است که از هوش مصنوعی برای تحلیل لحن، استخراج حافظه بلندمدت و ردیابی وضعیت روانی کاربران استفاده می‌کند.

## تکنولوژی‌های استفاده شده (Tech Stack)

- **فریم‌ورک**: Next.js (App Router)
- **زبان**: TypeScript
- **استایل‌دهی**: Tailwind CSS + Glassmorphism UI
- **پایگاه داده**: Firebase Firestore
- **مدیریت وضعیت**: Zustand
- **رندر مجازی**: TanStack Virtual
- **صفحات پس‌زمینه (Cron / Queues)**: Upstash QStash
- **محدودکننده درخواست (Rate Limiting)**: Upstash Redis
- **هوش مصنوعی**: Google Gemini API
- **اعتبارسنجی**: Zod
- **تست**: Vitest (Unit) + Playwright (E2E)

## نحوه اجرای پروژه (Local Development)

۱. ریپازیتوری را کلون کنید.
۲. وابستگی‌ها را نصب کنید:
```bash
npm install
```
۳. فایل `.env.local` را ایجاد کنید و کلیدهای ضروری (Firebase, Upstash, Gemini) را قرار دهید.
۴. سرور توسعه را اجرا کنید:
```bash
npm run dev
```
۵. پروژه در `http://localhost:3000` در دسترس خواهد بود.

## ساختار پروژه‌

- `src/app`: روت‌های Next.js و APIها
- `src/components`: کامپوننت‌های رابط کاربری
- `src/services`: لایه منطق تجاری (Business Logic)
- `src/store`: وضعیت‌های سراسری با Zustand
- `src/lib`: پیکربندی‌ها و Zod Schemas
- `src/__tests__`: تست‌های واحد
- `e2e`: تست‌های یکپارچه
