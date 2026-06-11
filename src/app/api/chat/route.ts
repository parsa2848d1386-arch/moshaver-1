import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const SYSTEM_INSTRUCTION = `
تو یک مشاور صمیمی، دلسوز، عاقل و باتجربه برای رابطه بین دو همسر/شریک زندگی به نام‌های پارسا (آقا) و ملیکا (خانم) هستی. تو به آنها کمک می‌کنی تا مشکلات ارتباطی خود را حل کنند، احساسات یکدیگر را بهتر درک کنند، از سوءتفاهم‌ها دوری کنند و رابطه‌ای سالم‌تر و عاشقانه‌تر بسازند.

قوانین و لحن تو:
۱. بسیار آرامش‌بخش، مثبت، همدلانه، صمیمی و محترمانه باشد.
۲. عاری از هرگونه قضاوت و سرزنش باشد و به هر دو طرف حق ابراز وجود و احساسات بدهد.
۳. در جلسات دو نفره (چت مشترک) به عنوان یک میانجی عمل کنی و سعی کنی گفتگو را بین آنها تسهیل کنی و نگذاری بحث به لجاجت کشیده شود.
۴. در چت‌های خصوصی، کاملاً رازدار باشی و به فرد کمک کنی تا سهم خود را در رابطه بهتر بفهمد و با آرامش برای صحبت با شریکش آماده شود.
۵. همیشه پاسخ‌ها را به زبان فارسی روان بنویس و از فرمول‌های ارتباطی کاربردی (مانند بیانات من‌محور، گوش دادن فعال و تکنیک‌های کاهش تنش) استفاده کن.
`;

export async function POST(request: Request) {
  try {
    if (!ai) {
      return NextResponse.json(
        { error: "کلید API برای Gemini تنظیم نشده است." },
        { status: 500 }
      );
    }

    const { messages, chatType, userDisplayName } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "فرمت تاریخچه پیام‌ها نامعتبر است." },
        { status: 400 }
      );
    }

    // Filter messages to get only the last 20 messages to keep request context small and efficient
    const recentMessages = messages.slice(-20);

    // Convert messages history to Gemini SDK format
    const contents = recentMessages.map((msg: any) => {
      const role = msg.senderId === "ai" ? "model" : "user";
      // We prepend the sender's display name to user messages so the AI knows who is speaking
      const prefix = role === "user" ? `[${msg.senderName || "کاربر"}]: ` : "";
      return {
        role,
        parts: [{ text: `${prefix}${msg.text}` }],
      };
    });

    // Determine specific instruction based on chat type (private vs shared)
    let contextInstruction = SYSTEM_INSTRUCTION;
    if (chatType === "shared") {
      contextInstruction += `\nدر حال حاضر، تو در یک چت مشترک (جلسه دو نفره) با حضور هر دو نفر (پارسا و ملیکا) هستی. پیام‌های قبلی را بخوان و به عنوان میانجی کمکشان کن با هم گفتگو کنند.`;
    } else {
      contextInstruction += `\nدر حال حاضر، تو در یک جلسه خصوصی با ${userDisplayName || "یکی از آنها"} هستی. این چت کاملاً خصوصی است و شریک او پیام‌های این اتاق را نمی‌بیند. به او کمک کن تا احساساتش را تحلیل کند و برای گفتگو با شریکش آماده شود. کاملاً رازدار باش.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: contextInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "متاسفم، در حال حاضر نمی‌توانم پاسخی بدهم.";

    return NextResponse.json({ text: replyText });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error.message || "خطایی در برقراری ارتباط با هوش مصنوعی رخ داد." },
      { status: 500 }
    );
  }
}
