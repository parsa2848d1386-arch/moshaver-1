import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { adminDb } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/utils/rateLimit";

const defaultApiKey = process.env.GEMINI_API_KEY;

const BASE_PSYCHOLOGICAL_PROMPT = `
تو یک زوج‌درمانگر و مشاور روانشناسی در سطح جهانی هستی. هسته تحلیل تو ترکیبی از سه مکتب زیر است:
۱. متد گاتمن (John Gottman): تو در کشف "چهار اسب‌سوار" (انتقاد، تحقیر، حالت تدافعی، دیوار کشیدن) مهارت داری. اگر هر یک از این‌ها را در متن دیدی، بلافاصله مداخله ملایم کن و یک "تلاش جبرانی" (Repair Attempt) پیشنهاد بده. همچنین مراقب "غلیان احساسی" (Flooding) باش و در صورت نیاز پیشنهاد یک وقفه (Time-out) بده.
۲. ایمنی روانی (Amy Edmondson): تو فضایی کاملاً امن، عاری از قضاوت و سرزنش ایجاد می‌کنی تا هر دو طرف بدون ترس از تنبیه شدن، آسیب‌پذیری‌های خود را نشان دهند.
۳. ارتباط بدون خشونت (Marshall Rosenberg - NVC): تو به کاربر کمک می‌کنی تا پیام‌های پرخاشگرانه یا طعنه‌آمیز را به فرمول «مشاهده دقیق + بیان احساس + بیان نیاز + درخواست شفاف» ترجمه کند.

وظیفه تو کمک به زوجی به نام‌های "پارسا" (آقا) و "ملیکا" (خانم) است. تو یک مشاور «همه‌چیز تمام» (All-knowing Counselor) هستی که وظیفه داری اطلاعات و پیام‌ها را از هر دو طرف دریافت کنی، آن‌ها را با دیدی بی‌طرفانه و جامع تحلیل کنی، مشکلات زیربنایی رابطه را درک کرده و راهکارهای عملی و دوطرفه ارائه دهی.
هیچ جزئیاتی از چشم تو پنهان نمی‌ماند و هدف نهایی تو رشد، تفاهم و عشق بین این دو نفر است.

دستورالعمل‌های رفتاری و لحن تو:
- همیشه بسیار آرامش‌بخش، همدلانه، صمیمی، و حرفه‌ای باش.
- پاسخ‌هایت باید ساختاریافته، نسبتاً کوتاه، و کاملاً کاربردی باشند (از سخنرانی پرهیز کن).
- هرگز یکی را بر دیگری ترجیح نده و قضاوت نکن.
- به جای گفتن "باید این کار را بکنید"، جملات جایگزین پیشنهاد بده.
- پاسخ را با **مارکداون** فرمت کن (بولد برای نکات مهم، لیست برای پیشنهادات).

⚠️ هشدار چهار اسب‌سوار: اگر هر یک از الگوهای زیر را در پیام کاربر تشخیص دادی، ابتدا به زبان ساده و محبت‌آمیز هشدار بده:
- **انتقاد (Criticism)**: "تو همیشه..." یا "تو هیچوقت..."
- **تحقیر (Contempt)**: تمسخر، طعنه، چشم چرخاندن
- **حالت تدافعی (Defensiveness)**: بهانه آوردن، مقصر دانستن طرف مقابل
- **دیوار کشیدن (Stonewalling)**: سکوت سرد، بی‌تفاوتی
`;

export async function POST(request: Request) {
  try {
    const { messages, chatType, userDisplayName, customModel, customApiKey, currentMood } = await request.json();

    const apiKey = customApiKey || defaultApiKey;
    if (!apiKey) {
      return NextResponse.json(
        { error: "کلید API تنظیم نشده است." },
        { status: 500 }
      );
    }

    // Rate limiting
    const rl = await checkRateLimit(`chat_${userDisplayName}`, 15, 60000);
    if (!rl.allowed) {
      return NextResponse.json({
        text: "⚠️ تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً ۱ دقیقه صبر کنید.",
        isError: true,
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "فرمت تاریخچه نامعتبر است." }, { status: 400 });
    }

    // واکشی حافظه بلندمدت
    let memoryContext = "";
    try {
      const memorySnapshot = await adminDb.collection('relationship_memory')
        .orderBy('date', 'desc')
        .limit(1)
        .get();
        
      if (!memorySnapshot.empty) {
        const memoryData = memorySnapshot.docs[0].data();
        if (memoryData?.memory) {
          const m = memoryData.memory;
          memoryContext = `
[حافظه روانشناختی سیستم از گذشته رابطه]:
- خلاصه: ${m.summary || "نامشخص"}
- نمره سلامت: ${m.health_score || "نامشخص"}/100
- الگوهای رفتاری: ${m.behavioral_patterns?.join(", ") || "هیچ"}
- مشکلات حل نشده: ${m.unresolved_issues?.join(", ") || "هیچ"}
- نقاط قوت: ${m.positive_highlights?.join(", ") || "هیچ"}
${m.gottman_ratio ? `- نسبت گاتمن: ${m.gottman_ratio.positive}:${m.gottman_ratio.negative}` : ""}
`;
        }
      }
    } catch (e) {
      console.error("Error fetching memory:", e);
    }

    const modelName = customModel || "gemini-2.5-flash";
    const recentMessages = messages.slice(-20);

    const contents = recentMessages.map((msg: any) => {
      const role = msg.senderId === "ai" ? "model" : "user";
      let moodText = "";
      if (role === "user" && msg.mood) {
        moodText = `(با حالت احساسی: ${msg.mood}) `;
      }
      const prefix = role === "user" ? `[${msg.senderName || "کاربر"}]: ` : "";
      return {
        role,
        parts: [{ text: `${prefix}${moodText}${msg.text}` }],
      };
    });

    let contextInstruction = BASE_PSYCHOLOGICAL_PROMPT + memoryContext;
    
    if (chatType === "shared") {
      contextInstruction += `
\n[موقعیت فعلی]: جلسه زوج‌درمانی دو نفره با پارسا و ملیکا.
تکنیک گاتمن: اگر انتقاد یا تحقیر دیدی، مداخله کن و جمله را با NVC بازنویسی کن.
`;
    } else {
      const moodContext = currentMood ? `کاربر در حال حاضر احساس "${currentMood}" دارد.` : "";
      contextInstruction += `
\n[موقعیت فعلی]: جلسه خصوصی با ${userDisplayName || "یکی از آنها"}.
${moodContext}
تکنیک ادموندسون: فضای ایمن ایجاد کن. به او اطمینان بده که شنیده می‌شود.
`;
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: contextInstruction,
        temperature: 0.6,
      },
    });

    return NextResponse.json({ text: response.text || "پاسخی دریافت نشد." });
  } catch (error: any) {
    let errorMessage = "متأسفم، خطایی رخ داد. لطفاً دوباره تلاش کنید.";
    
    const errStr = error.message || "";
    if (errStr.includes("API key")) {
      errorMessage = "کلید API معتبر نیست. لطفاً در تنظیمات بررسی کنید.";
    } else if (errStr.includes("model")) {
      errorMessage = "مدل انتخاب‌شده در دسترس نیست. مدل دیگری انتخاب کنید.";
    } else if (errStr.includes("quota") || errStr.includes("429")) {
      errorMessage = "سقف مصرف پر شده. کمی صبر کنید یا از کلید شخصی استفاده کنید.";
    } else if (errStr.includes("fetch") || errStr.includes("network")) {
      errorMessage = "خطای شبکه. اتصال اینترنت را بررسی کنید.";
    }

    return NextResponse.json({ 
      text: `⚠️ ${errorMessage}`,
      isError: true
    });
  }
}
