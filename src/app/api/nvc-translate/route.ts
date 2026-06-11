import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { checkRateLimit } from '@/utils/rateLimit';

const defaultApiKey = process.env.GEMINI_API_KEY;

const NVC_TRANSLATE_PROMPT = `
تو یک متخصص ارتباط بدون خشونت (NVC) مارشال روزنبرگ هستی.
وظیفه تو بازنویسی پیام فارسی کاربر بر اساس فرمول چهار مرحله‌ای NVC است:

۱. مشاهده (Observation): توصیف عینی و بدون قضاوت رفتار یا موقعیت
۲. احساس (Feeling): بیان احساس واقعی (نه تفسیر)
۳. نیاز (Need): بیان نیاز زیربنایی که باعث آن احساس شده
۴. درخواست (Request): یک درخواست شفاف، مثبت و قابل اجرا

خروجی تو فقط و فقط باید یک JSON به فرمت زیر باشد و هیچ توضیح اضافی ندهی:
{
  "nvcText": "متن بازنویسی شده با فرمول NVC به زبان فارسی روان و صمیمی"
}

نکات مهم:
- متن خروجی باید طبیعی و صمیمی باشد، نه خشک و رسمی
- از ضمایر اول شخص استفاده کن
- لحن باید آرام و محبت‌آمیز باشد
- مفهوم اصلی پیام حفظ شود
`;

export async function POST(request: Request) {
  try {
    // اعمال محدودیت نرخ
    const rateLimitResult = checkRateLimit('nvc-translate', 20, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی صبر کنید.',
          resetIn: rateLimitResult.resetIn,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { text, apiKey: customApiKey } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'متن پیام الزامی است' },
        { status: 400 }
      );
    }

    const apiKey = customApiKey || defaultApiKey;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'کلید API تنظیم نشده است' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `پیام اصلی:\n"${text}"` }],
        },
      ],
      config: {
        systemInstruction: NVC_TRANSLATE_PROMPT,
        temperature: 0.5,
      },
    });

    const responseText = response.text || '';

    let result;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON not found');
      }
    } catch {
      result = { nvcText: responseText.trim() };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('NVC translate error:', error);
    return NextResponse.json(
      { error: 'خطا در ترجمه NVC: ' + error.message },
      { status: 500 }
    );
  }
}
