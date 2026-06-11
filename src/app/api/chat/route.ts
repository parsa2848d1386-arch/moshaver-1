import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { adminDb } from "@/lib/firebase-admin";

const defaultApiKey = process.env.GEMINI_API_KEY;

// مهندسی پرامپت روانشناختی (گاتمن، ادموندسون، روزنبرگ)
const BASE_PSYCHOLOGICAL_PROMPT = `
تو یک زوج‌درمانگر و مشاور روانشناسی در سطح جهانی هستی. هسته تحلیل تو ترکیبی از سه مکتب زیر است:
۱. متد گاتمن (John Gottman): تو در کشف "چهار اسب‌سوار" (انتقاد، تحقیر، حالت تدافعی، دیوار کشیدن) مهارت داری. اگر هر یک از این‌ها را در متن دیدی، بلافاصله مداخله ملایم کن و یک "تلاش جبرانی" (Repair Attempt) پیشنهاد بده. همچنین مراقب "غلیان احساسی" (Flooding) باش و در صورت نیاز پیشنهاد یک وقفه (Time-out) بده.
۲. ایمنی روانی (Amy Edmondson): تو فضایی کاملاً امن، عاری از قضاوت و سرزنش ایجاد می‌کنی تا هر دو طرف بدون ترس از تنبیه شدن، آسیب‌پذیری‌های خود را نشان دهند.
۳. ارتباط بدون خشونت (Marshall Rosenberg - NVC): تو به کاربر کمک می‌کنی تا پیام‌های پرخاشگرانه یا طعنه‌آمیز را به فرمول «مشاهده دقیق + بیان احساس + بیان نیاز + درخواست شفاف» ترجمه کند.

وظیفه تو کمک به زوجی به نام‌های "پارسا" (آقا) و "ملیکا" (خانم) است.

دستورالعمل‌های رفتاری و لحن تو:
- همیشه بسیار آرامش‌بخش، همدلانه، صمیمی، و حرفه‌ای باش.
- پاسخ‌هایت باید ساختاریافته، نسبتاً کوتاه، و کاملاً کاربردی باشند (از سخنرانی پرهیز کن).
- هرگز یکی را بر دیگری ترجیح نده و قضاوت نکن.
- به جای گفتن "باید این کار را بکنید"، جملات جایگزین پیشنهاد بده (مثلاً: "پیشنهاد می‌کنم به جای X بگویید Y").
`;

export async function POST(request: Request) {
  try {
    const { messages, chatType, userDisplayName, customModel, customApiKey, currentMood } = await request.json();

    const apiKey = customApiKey || defaultApiKey;
    if (!apiKey) {
      return NextResponse.json(
        { error: "کلید API تنظیم نشده است. لطفاً از بخش تنظیمات وارد کنید." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "فرمت تاریخچه نامعتبر است." }, { status: 400 });
    }

    // واکشی آخرین حافظه بلندمدت (کانتکست رابطه)
    let memoryContext = "";
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      // جستجوی آخرین حافظه ثبت شده در 7 روز گذشته (اخیرا)
      const memorySnapshot = await adminDb.collection('relationship_memory')
        .orderBy('date', 'desc')
        .limit(1)
        .get();
        
      if (!memorySnapshot.empty) {
        const memoryData = memorySnapshot.docs[0].data();
        if (memoryData && memoryData.memory) {
          const m = memoryData.memory;
          memoryContext = `
[حافظه روانشناختی سیستم از گذشته رابطه - فقط برای اطلاع تو]:
- خلاصه وضعیت اخیر: ${m.summary || "نامشخص"}
- نمره سلامت رابطه (از ۱۰۰): ${m.health_score || "نامشخص"}
- الگوهای رفتاری کشف شده: ${m.behavioral_patterns ? m.behavioral_patterns.join(", ") : "هیچ"}
- مشکلات حل نشده: ${m.unresolved_issues ? m.unresolved_issues.join(", ") : "هیچ"}
- نقاط قوت: ${m.positive_highlights ? m.positive_highlights.join(", ") : "هیچ"}

این اطلاعات مربوط به گذشته است. از آن برای درک عمیق‌تر صحبت‌های فعلی استفاده کن اما مستقیماً به کاربر نگو که در حال خواندن حافظه هستی مگه اینکه خودش بپرسه.
`;
        }
      }
    } catch (e) {
      console.error("Error fetching long-term memory:", e);
      // ادامه بدون حافظه در صورت بروز خطا
    }

    const modelName = customModel || "gemini-2.5-flash";
    const recentMessages = messages.slice(-20);

    const contents = recentMessages.map((msg: any) => {
      const role = msg.senderId === "ai" ? "model" : "user";
      
      // تزریق حس و حال فعلی اگر ارسال شده باشد
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
\n[موقعیت فعلی]: تو در یک چت مشترک (جلسه زوج‌درمانی دو نفره) با حضور پارسا و ملیکا هستی.
تکنیک گاتمن در این موقعیت: اگر هرگونه انتقاد (Criticism) یا تحقیر (Contempt) در پیام‌ها دیدی، قبل از اینکه بحث بالا بگیرد، مداخله کن و جمله کاربر را با فرمول NVC بازنویسی کرده و پیشنهاد بده.
`;
    } else {
      const moodContext = currentMood ? `کاربر در حال حاضر احساس "${currentMood}" دارد.` : "";
      contextInstruction += `
\n[موقعیت فعلی]: تو در یک جلسه کاملاً خصوصی با ${userDisplayName || "یکی از آنها"} هستی. شریک او این پیام‌ها را نمی‌بیند.
${moodContext}
تکنیک ادموندسون در این موقعیت: فضای ایمنی روانی را تضمین کن. به او اطمینان بده که شنیده و درک می‌شود. سپس با تکنیک NVC کمکش کن تا احساسات و نیازهای زیرین خودش را بشناسد و برای بیان آنها به شریکش (در فضای مشترک) آماده شود.
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
    console.error("AI API Error:", error);
    let errorMessage = "خطایی رخ داد.";
    if (error.message?.includes("API key")) errorMessage = "کلید API نامعتبر است.";
    else if (error.message?.includes("model")) errorMessage = "مدل انتخاب‌شده در دسترس نیست.";
    else if (error.message?.includes("quota")) errorMessage = "سقف مصرف API پر شده است.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
