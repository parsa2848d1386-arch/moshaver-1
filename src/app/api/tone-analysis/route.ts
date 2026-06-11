import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { checkRateLimit } from '@/utils/rateLimit';

const defaultApiKey = process.env.GEMINI_API_KEY;

const TONE_ANALYSIS_PROMPT = `
تو یک تحلیل‌گر لحن حرفه‌ای هستی که بر اساس مدل جان گاتمن کار می‌کنی.
وظیفه تو تحلیل لحن پیام فارسی زیر از نظر:
- پرخاشگری و خشونت کلامی
- انتقاد (Criticism)
- تحقیر (Contempt)
- حالت تدافعی (Defensiveness)
- دیوار کشیدن (Stonewalling)

باید خروجی خود را دقیقاً به فرمت JSON زیر بدهی و هیچ متن اضافی ننویسی:
{
  "level": "safe" | "caution" | "danger",
  "score": عدد بین 0 تا 100 (100 = بسیار پرخاشگرانه),
  "suggestion": "یک نسخه ملایم‌تر و محترمانه‌تر از همان پیام",
  "nvcVersion": "بازنویسی پیام با فرمول NVC: مشاهده + احساس + نیاز + درخواست"
}

قوانین:
- score زیر 30: level = "safe"
- score بین 30 تا 60: level = "caution"
- score بالای 60: level = "danger"
- suggestion باید همان مفهوم پیام اصلی را منتقل کند ولی با لحن آرام
- nvcVersion باید کاملاً بر اساس ارتباط بدون خشونت مارشال روزنبرگ باشد
`;

export async function POST(request: Request) {
  try {
    // اعمال محدودیت نرخ
    const rateLimitResult = checkRateLimit('tone-analysis', 20, 60000);
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
          parts: [{ text: `پیام برای تحلیل:\n"${text}"` }],
        },
      ],
      config: {
        systemInstruction: TONE_ANALYSIS_PROMPT,
        temperature: 0.3,
      },
    });

    const responseText = response.text || '';

    // استخراج JSON از پاسخ
    let analysisResult;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON not found in response');
      }
    } catch {
      // fallback در صورت خطای parse
      analysisResult = {
        level: 'safe' as const,
        score: 0,
        suggestion: text,
        nvcVersion: text,
      };
    }

    return NextResponse.json(analysisResult);
  } catch (error: any) {
    console.error('Tone analysis error:', error);
    return NextResponse.json(
      { error: 'خطا در تحلیل لحن: ' + error.message },
      { status: 500 }
    );
  }
}
