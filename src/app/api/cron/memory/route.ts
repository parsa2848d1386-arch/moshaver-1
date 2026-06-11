import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

export async function GET(request: Request) {
  try {
    // 1. بررسی امنیت Cron (در صورت تنظیم شدن CRON_SECRET)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 });
    }

    // 2. محاسبه زمان 24 ساعت گذشته
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    const yesterdayIso = yesterday.toISOString();

    // 3. واکشی پیام‌های مشترک 24 ساعت گذشته
    const messagesRef = adminDb.collection('shared_chats');
    const snapshot = await messagesRef
      .where('createdAt', '>=', yesterdayIso)
      .orderBy('createdAt', 'asc')
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ message: 'No messages in the last 24 hours to summarize.' });
    }

    const messages = snapshot.docs.map(doc => doc.data());
    
    // فیلتر کردن و قالب‌بندی پیام‌ها برای هوش مصنوعی
    const formattedMessages = messages.map(msg => 
      `[${msg.senderName || msg.senderRole} - ${msg.createdAt}]: ${msg.text}`
    ).join('\n');

    // 4. ارسال به Gemini برای خلاصه‌سازی روانشناختی
    const ai = new GoogleGenAI({ apiKey });
    
    const systemPrompt = `
تو یک تحلیل‌گر ارشد روانشناسی رابطه با تخصص در رویکرد گاتمن هستی.
وظیفه تو تحلیل پیام‌های ۲۴ ساعت گذشته بین پارسا و ملیکا است.
خروجی تو باید به عنوان "حافظه بلندمدت" برای مشاور هوش مصنوعی سیستم ذخیره شود تا در روزهای آینده از آن برای کانتکست استفاده کند.

بر اساس مکالمات زیر، یک فایل JSON با ساختار زیر تولید کن:
{
  "summary": "خلاصه ۲ تا ۳ جمله‌ای از مهم‌ترین اتفاقات و بحث‌های ۲۴ ساعت گذشته",
  "dominant_emotions": {
    "parsa": ["لیست احساسات غالب پارسا"],
    "melika": ["لیست احساسات غالب ملیکا"]
  },
  "behavioral_patterns": ["الگوهای مشاهده شده، مثل: انتقاد، حالت تدافعی، حمایت، قدردانی و غیره"],
  "health_score": یک عدد بین 0 تا 100 که نشان‌دهنده سلامت رابطه در این 24 ساعت است,
  "unresolved_issues": ["مشکلاتی که هنوز حل نشده‌اند"],
  "positive_highlights": ["نکات مثبت و لحظات خوب"]
}

توجه: فقط خروجی JSON معتبر برگردان بدون هیچ متن اضافه‌ای در ابتدا یا انتها. خروجی باید قابل پارس شدن با JSON.parse باشد.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: `پیام‌های ۲۴ ساعت گذشته:\n\n${formattedMessages}` }] }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2, // پاسخ دقیق و تحلیلی
        responseMimeType: "application/json",
      },
    });

    const replyText = response.text || "{}";
    
    // تلاش برای پارس کردن خروجی
    let memoryData;
    try {
      memoryData = JSON.parse(replyText);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", replyText);
      // Fallback
      memoryData = {
        summary: replyText.substring(0, 500),
        health_score: 50,
        parse_error: true
      };
    }

    // 5. ذخیره در Firestore به عنوان حافظه بلندمدت
    const todayStr = new Date().toISOString().split('T')[0]; // فرمت YYYY-MM-DD
    
    await adminDb.collection('relationship_memory').doc(todayStr).set({
      date: todayStr,
      createdAt: new Date().toISOString(),
      messageCount: messages.length,
      memory: memoryData
    });

    return NextResponse.json({ 
      success: true, 
      date: todayStr,
      messageCount: messages.length,
      healthScore: memoryData.health_score 
    });

  } catch (error: any) {
    console.error('Cron memory error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
