import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatType = searchParams.get('chatType');
    const uid = searchParams.get('uid');
    const format = searchParams.get('format') || 'json';

    if (!chatType) {
      return NextResponse.json(
        { error: 'chatType الزامی است' },
        { status: 400 }
      );
    }

    let colRef;
    if (chatType === 'shared') {
      colRef = adminDb.collection('shared_chats');
    } else {
      if (!uid) {
        return NextResponse.json(
          { error: 'uid برای چت خصوصی الزامی است' },
          { status: 400 }
        );
      }
      colRef = adminDb.collection('private_chats').doc(uid).collection('messages');
    }

    const snapshot = await colRef.orderBy('createdAt', 'asc').get();
    const messages: any[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      if (!data.isDeleted) {
        messages.push({ id: doc.id, ...data });
      }
    });

    if (format === 'text') {
      // خروجی به فرمت متنی خوانا
      const chatTitle =
        chatType === 'shared'
          ? 'چت مشترک - مشاور رابطه'
          : `چت خصوصی - ${uid}`;

      let textContent = `═══════════════════════════════════════\n`;
      textContent += `  ${chatTitle}\n`;
      textContent += `  تاریخ خروجی: ${new Date().toLocaleDateString('fa-IR')}\n`;
      textContent += `  تعداد پیام‌ها: ${messages.length}\n`;
      textContent += `═══════════════════════════════════════\n\n`;

      messages.forEach((msg) => {
        const date = new Date(msg.createdAt);
        const timeStr = date.toLocaleString('fa-IR');
        const senderLabel =
          msg.senderId === 'ai' ? '🤖 مشاور' : `👤 ${msg.senderName || msg.senderRole || 'ناشناس'}`;
        const moodStr = msg.mood ? ` (${msg.mood})` : '';
        const editedStr = msg.isEdited ? ' [ویرایش شده]' : '';
        const pinnedStr = msg.isPinned ? ' 📌' : '';

        textContent += `${senderLabel}${moodStr}${editedStr}${pinnedStr}\n`;
        textContent += `${timeStr}\n`;
        textContent += `${msg.text}\n`;
        textContent += `───────────────────────────────────────\n`;
      });

      return new Response(textContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="chat-export-${chatType}-${new Date().toISOString().split('T')[0]}.txt"`,
        },
      });
    }

    // خروجی JSON
    const jsonContent = {
      exportDate: new Date().toISOString(),
      chatType,
      messageCount: messages.length,
      messages,
    };

    return new Response(JSON.stringify(jsonContent, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="chat-export-${chatType}-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
