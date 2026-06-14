import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { adminDb } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/utils/rateLimit";

const defaultApiKey = process.env.GEMINI_API_KEY;

const BASE_PSYCHOLOGICAL_PROMPT = `
تو یک زوج‌درمانگر و مشاور روانشناسی در سطح جهانی هستی.
هسته تحلیل تو: متد گاتمن، ایمنی روانی (ادموندسون)، ارتباط بدون خشونت (NVC).
وظیفه تو کمک به زوجی به نام‌های "پارسا" (آقا) و "ملیکا" (خانم) است.
پاسخ‌هایت باید ساختاریافته، کوتاه و کاربردی باشند.
از **مارکداون** برای فرمت‌بندی استفاده کن.
هرگز یکی را بر دیگری ترجیح نده.
`;

export async function POST(request: Request) {
  try {
    const { messages, chatType, userDisplayName, customModel, customApiKey, currentMood } = await request.json();

    const apiKey = customApiKey || defaultApiKey;
    if (!apiKey) {
      return new Response("data: " + JSON.stringify({ text: "⚠️ کلید API تنظیم نشده است." }) + "\n\ndata: [DONE]\n\n", {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Rate limiting
    const rl = await checkRateLimit(`stream_${userDisplayName}`, 15, 60000);
    if (!rl.allowed) {
      return new Response("data: " + JSON.stringify({ text: "⚠️ تعداد درخواست‌ها بیش از حد مجاز. لطفاً ۱ دقیقه صبر کنید." }) + "\n\ndata: [DONE]\n\n", {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "فرمت نامعتبر" }, { status: 400 });
    }

    // واکشی حافظه بلندمدت
    let memoryContext = "";
    try {
      const memorySnapshot = await adminDb.collection('relationship_memory')
        .orderBy('date', 'desc')
        .limit(1)
        .get();
        
      if (!memorySnapshot.empty) {
        const m = memorySnapshot.docs[0].data()?.memory;
        if (m) {
          memoryContext = `\n[حافظه رابطه]: خلاصه: ${m.summary || "نامشخص"} | سلامت: ${m.health_score || "?"}/100`;
        }
      }
    } catch (e) {
      console.error("Memory fetch error:", e);
    }

    const modelName = customModel || "gemini-2.5-flash";
    const recentMessages = messages.slice(-20);

    const contents = recentMessages.map((msg: any) => {
      const role = msg.senderId === "ai" ? "model" : "user";
      let moodText = "";
      if (role === "user" && msg.mood) {
        moodText = `(حالت: ${msg.mood}) `;
      }
      const prefix = role === "user" ? `[${msg.senderName || "کاربر"}]: ` : "";
      return {
        role,
        parts: [{ text: `${prefix}${moodText}${msg.text}` }],
      };
    });

    let contextInstruction = BASE_PSYCHOLOGICAL_PROMPT + memoryContext;
    
    if (chatType === "shared") {
      contextInstruction += "\n[موقعیت]: جلسه زوج‌درمانی دو نفره.";
    } else {
      const moodContext = currentMood ? ` احساس: "${currentMood}".` : "";
      contextInstruction += `\n[موقعیت]: جلسه خصوصی با ${userDisplayName || "کاربر"}.${moodContext}`;
    }

    // Use streaming API
    const stream = await ai.models.generateContentStream({
      model: modelName,
      contents,
      config: {
        systemInstruction: contextInstruction,
        temperature: 0.6,
      },
    });

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text || '';
            if (text) {
              const data = `data: ${JSON.stringify({ text })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error: any) {
          console.error("Streaming error:", error);
          const errMsg = `data: ${JSON.stringify({ text: `\n\n⚠️ خطا: ${error.message || "مشکلی پیش آمد"}` })}\n\n`;
          controller.enqueue(encoder.encode(errMsg));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Stream route error:", error);
    return new Response(
      `data: ${JSON.stringify({ text: "⚠️ خطای سرور. لطفاً دوباره تلاش کنید." })}\n\ndata: [DONE]\n\n`,
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }
}
