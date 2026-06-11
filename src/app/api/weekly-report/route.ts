import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { adminDb } from '@/lib/firebase-admin';
import { checkRateLimit } from '@/utils/rateLimit';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

const defaultApiKey = process.env.GEMINI_API_KEY;

const WEEKLY_REPORT_PROMPT = `
تو یک زوج‌درمانگر حرفه‌ای هستی که گزارش هفتگی رابطه را بر اساس مدل گاتمن تهیه می‌کنی.
بر اساس پیام‌های ۷ روز گذشته بین پارسا و ملیکا، یک تحلیل جامع انجام بده.

خروجی تو باید دقیقاً به فرمت JSON زیر باشد و هیچ متن اضافی ننویسی:
{
  "summary": "خلاصه کلی وضعیت رابطه در این هفته (۲-۳ جمله)",
  "health_score": عدد بین 0 تا 100,
  "positive_count": تعداد تعاملات مثبت,
  "negative_count": تعداد تعاملات منفی,
  "gottman_ratio": {
    "positive": تعداد تعاملات مثبت,
    "negative": تعداد تعاملات منفی,
    "ratio": نسبت مثبت به منفی (عدد اعشاری)
  },
  "suggested_exercise": "یک تمرین عملی برای بهبود رابطه بر اساس مشکلات شناسایی شده",
  "highlights": ["نکته مثبت ۱", "نکته مثبت ۲", "نکته قابل بهبود ۱"]
}

نکات مهم:
- نسبت گاتمن ایده‌آل ۵ به ۱ است (۵ تعامل مثبت به ازای هر ۱ تعامل منفی)
- health_score بر اساس کیفیت ارتباط، احترام متقابل، و عدم وجود چهار اسب‌سوار محاسبه شود
- تمرین پیشنهادی باید عملی و قابل اجرا باشد
`;

export async function GET(request: Request) {
  try {
    // اعمال محدودیت نرخ
    const rateLimitResult = checkRateLimit('weekly-report', 5, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی صبر کنید.',
          resetIn: rateLimitResult.resetIn,
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const customApiKey = searchParams.get('apiKey');

    const apiKey = customApiKey || defaultApiKey;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'کلید API تنظیم نشده است' },
        { status: 500 }
      );
    }

    // واکشی پیام‌های ۷ روز اخیر
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    const snapshot = await adminDb
      .collection('shared_chats')
      .where('createdAt', '>=', sevenDaysAgoStr)
      .orderBy('createdAt', 'asc')
      .get();

    const messages: any[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      if (!data.isDeleted && data.senderId !== 'ai') {
        messages.push({ id: doc.id, ...data });
      }
    });

    if (messages.length === 0) {
      return NextResponse.json({
        summary: 'در ۷ روز گذشته پیامی ثبت نشده است.',
        health_score: 0,
        positive_count: 0,
        negative_count: 0,
        gottman_ratio: { positive: 0, negative: 0, ratio: 0 },
        suggested_exercise: 'امروز ۵ دقیقه با هم درباره روزتان صحبت کنید.',
        highlights: [],
        messageCount: 0,
      });
    }

    // خلاصه‌سازی پیام‌ها برای ارسال به AI
    const messageSummary = messages
      .map((m) => `[${m.senderName || m.senderRole}]: ${m.text}`)
      .join('\n');

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `پیام‌های ۷ روز اخیر (${messages.length} پیام):\n\n${messageSummary}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: WEEKLY_REPORT_PROMPT,
        temperature: 0.4,
      },
    });

    const responseText = response.text || '';

    let report;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        report = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON not found');
      }
    } catch {
      report = {
        summary: 'خطا در تولید گزارش. لطفاً دوباره تلاش کنید.',
        health_score: 50,
        positive_count: 0,
        negative_count: 0,
        gottman_ratio: { positive: 0, negative: 0, ratio: 0 },
        suggested_exercise: 'امروز ۵ دقیقه با هم درباره روزتان صحبت کنید.',
        highlights: [],
      };
    }

    // ذخیره گزارش در Firestore
    const weekId = new Date().toISOString().split('T')[0];
    await adminDb.collection('weekly_reports').doc(weekId).set({
      ...report,
      messageCount: messages.length,
      generatedAt: new Date().toISOString(),
      weekStarting: sevenDaysAgoStr,
    });

    return NextResponse.json({
      ...report,
      messageCount: messages.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Weekly report error:', error);
    return NextResponse.json(
      { error: 'خطا در تولید گزارش هفتگی: ' + error.message },
      { status: 500 }
    );
  }
}
