import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { checkRateLimit } from '@/utils/rateLimit';

const defaultApiKey = process.env.GEMINI_API_KEY;

const PERSPECTIVE_PROMPT = `
تو یک روانشناس بالینی متخصص در روابط زوجین هستی.
وظیفه تو این است که وقتی یکی از طرفین یک پیام خاص ارسال می‌کند، تحلیل کنی:
- فرستنده احتمالاً چه احساسی داشته؟
- چه نیاز برآورده‌نشده‌ای پشت این پیام نهفته است؟
- چه ترسی ممکن است داشته باشد؟
- چگونه می‌توان با همدلی به این پیام پاسخ داد؟

پاسخ خود را به زبان فارسی ساده و صمیمی بنویس.
از تحلیل‌های گاتمن و روزنبرگ استفاده کن.
پاسخ باید مستقیم و بدون عنوان‌بندی باشد (یک یا دو پاراگراف).
خروجی تو فقط باید یک JSON به فرمت زیر باشد:
{
  "perspective": "تحلیل فارسی احساس و نیاز فرستنده"
}
`;

export async function POST(request: Request) {
  try {
    // اعمال محدودیت نرخ
    const rateLimitResult = await checkRateLimit('perspective', 20, 60000);
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
    const { messageText, senderRole, context, apiKey: customApiKey } = body;

    if (!messageText) {
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

    // ساخت متن بافت (context) از ۵ پیام آخر
    let contextText = '';
    if (context && Array.isArray(context) && context.length > 0) {
      contextText = '\n\nبافت مکالمه (۵ پیام آخر):\n';
      context.forEach((msg: any, i: number) => {
        contextText += `${i + 1}. [${msg.senderName || msg.senderRole}]: ${msg.text}\n`;
      });
    }

    const senderName = senderRole === 'parsa' ? 'پارسا' : 'ملیکا';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `فرستنده: ${senderName} (${senderRole})\nپیام مورد تحلیل:\n"${messageText}"${contextText}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: PERSPECTIVE_PROMPT,
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
      result = { perspective: responseText.trim() };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Perspective analysis error:', error);
    return NextResponse.json(
      { error: 'خطا در تحلیل دیدگاه: ' + error.message },
      { status: 500 }
    );
  }
}
