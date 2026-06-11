import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// GET: دریافت همه تگ‌های خاطره
export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('memory_tags')
      .orderBy('date', 'desc')
      .get();

    const tags: any[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      tags.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({ tags });
  } catch (error: any) {
    console.error('Memory tags GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: ایجاد تگ خاطره جدید
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messageId, messageText, tag, taggedBy, uid } = body;

    if (!messageId || !messageText || !tag || !taggedBy) {
      return NextResponse.json(
        { error: 'messageId، messageText، tag و taggedBy الزامی هستند' },
        { status: 400 }
      );
    }

    const tagData = {
      messageId,
      messageText,
      tag,
      taggedBy,
      uid: uid || taggedBy,
      date: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('memory_tags').add(tagData);

    return NextResponse.json({
      success: true,
      memoryTag: { id: docRef.id, ...tagData },
    });
  } catch (error: any) {
    console.error('Memory tags POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
