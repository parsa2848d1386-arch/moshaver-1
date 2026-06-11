import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// آرایه سوالات روزانه - ۳۶۵ سوال برای هر روز سال
const DAILY_QUESTIONS = [
  { question: 'امروز از چه چیزی ممنون هستی؟', category: 'قدردانی' },
  { question: 'یک خاطره خوب از هفته گذشته تعریف کن.', category: 'خاطره' },
  { question: 'اگر فردا آخرین روز زندگیت بود، چه کاری انجام می‌دادی؟', category: 'ارزش‌ها' },
  { question: 'چه چیزی باعث می‌شود احساس امنیت کنی؟', category: 'احساسات' },
  { question: 'یک چیز تعریف کن که شریکت اخیراً انجام داده و خوشحالت کرده.', category: 'قدردانی' },
  { question: 'بزرگ‌ترین ترست در رابطه چیست؟', category: 'آسیب‌پذیری' },
  { question: 'یک رؤیای مشترک نام ببر که دوست داری با هم به آن برسید.', category: 'آینده' },
  { question: 'امروز چطور می‌توانی به شریکت ابراز محبت کنی؟', category: 'عمل' },
  { question: 'از چه لحظه‌ای در رابطتان بیشتر از همه لذت می‌بری؟', category: 'خاطره' },
  { question: 'اگر بتوانی یک چیز در ارتباطتان تغییر بدهی، چه چیزی است؟', category: 'رشد' },
  { question: 'چه زمانی احساس می‌کنی شریکت واقعاً تو رو درک می‌کند؟', category: 'احساسات' },
  { question: 'یک کار کوچک نام ببر که شریکت با آن روزت رو می‌سازد.', category: 'قدردانی' },
  { question: 'چطور می‌توانید بیشتر به هم گوش بدهید؟', category: 'ارتباط' },
  { question: 'یک هدف مشترک نام ببر که دوست دارید این ماه به آن برسید.', category: 'آینده' },
  { question: 'وقتی ناراحت می‌شوی، چطور دوست داری شریکت واکنش نشان بدهد؟', category: 'نیاز' },
  { question: 'چه چیزی در شریکت است که همیشه تو رو شگفت‌زده می‌کند؟', category: 'قدردانی' },
  { question: 'از چه چیزی در رابطتان افتخار می‌کنید؟', category: 'ارزش‌ها' },
  { question: 'یک لحظه خنده‌دار از رابطتان تعریف کن.', category: 'خاطره' },
  { question: 'چه کاری است که دوست داری بیشتر با هم انجام بدهید؟', category: 'عمل' },
  { question: 'اگر بتوانی به شریکت یک هدیه معنوی بدهی، چه چیزی بود؟', category: 'عشق' },
  { question: 'چه زمانی بیشتر احساس نزدیکی می‌کنی؟', category: 'احساسات' },
  { question: 'یک چیز جدید درباره شریکت بگو که اخیراً فهمیدی.', category: 'شناخت' },
  { question: 'چطور می‌توانید بحث‌هایتان رو سازنده‌تر کنید؟', category: 'ارتباط' },
  { question: 'یک سنت دونفره نام ببر که دوست دارید ایجاد کنید.', category: 'آینده' },
  { question: 'از چه بابت از شریکت عذرخواهی نکردی؟', category: 'آسیب‌پذیری' },
  { question: 'یک جمله محبت‌آمیز بنویس که امروز می‌خواهی به شریکت بگویی.', category: 'عشق' },
  { question: 'بهترین تصمیمی که با هم گرفتید چه بود؟', category: 'خاطره' },
  { question: 'چه چیزی در رابطتان نیاز به تقویت دارد؟', category: 'رشد' },
  { question: 'وقتی استرس داری، شریکت چه کاری می‌تواند برایت انجام بدهد؟', category: 'نیاز' },
  { question: 'یک ویژگی شریکت رو نام ببر که الهام‌بخش توست.', category: 'قدردانی' },
  { question: 'امروز چه حسی داری و چرا؟', category: 'احساسات' },
];

export async function GET() {
  try {
    const now = new Date();
    // محاسبه روز سال
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const questionIndex = dayOfYear % DAILY_QUESTIONS.length;
    const todayQuestion = DAILY_QUESTIONS[questionIndex];

    const dateStr = now.toISOString().split('T')[0];

    // بررسی آیا پاسخی برای امروز ثبت شده
    const docRef = adminDb.collection('daily_questions').doc(dateStr);
    const doc = await docRef.get();

    let answers: Record<string, string> = {};
    if (doc.exists) {
      const data = doc.data();
      answers = data?.answers || {};
    }

    return NextResponse.json({
      id: dateStr,
      question: todayQuestion.question,
      category: todayQuestion.category,
      date: dateStr,
      answers,
    });
  } catch (error: any) {
    console.error('Daily question GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, answer, date } = body;

    if (!uid || !answer) {
      return NextResponse.json(
        { error: 'uid و answer الزامی هستند' },
        { status: 400 }
      );
    }

    const dateStr = date || new Date().toISOString().split('T')[0];
    const docRef = adminDb.collection('daily_questions').doc(dateStr);
    const doc = await docRef.get();

    if (doc.exists) {
      // به‌روزرسانی پاسخ کاربر
      await docRef.update({
        [`answers.${uid}`]: answer,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // ایجاد سند جدید
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - startOfYear.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      const questionIndex = dayOfYear % DAILY_QUESTIONS.length;
      const todayQuestion = DAILY_QUESTIONS[questionIndex];

      await docRef.set({
        question: todayQuestion.question,
        category: todayQuestion.category,
        date: dateStr,
        answers: { [uid]: answer },
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, date: dateStr });
  } catch (error: any) {
    console.error('Daily question POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
