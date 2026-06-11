import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chatType, uid } = body;

    if (!chatType) {
      return NextResponse.json({ error: 'chatType is required' }, { status: 400 });
    }

    let colRef;
    if (chatType === 'shared') {
      colRef = adminDb.collection('shared_chats');
    } else {
      if (!uid) {
        return NextResponse.json({ error: 'uid is required for private chat' }, { status: 400 });
      }
      colRef = adminDb.collection('private_chats').doc(uid).collection('messages');
    }

    // حذف دسته‌ای پیام‌ها (batch delete)
    const snapshot = await colRef.get();
    
    if (snapshot.empty) {
      return NextResponse.json({ success: true, deleted: 0 });
    }

    const batchSize = 500;
    const docs = snapshot.docs;
    let deleted = 0;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = adminDb.batch();
      const chunk = docs.slice(i, i + batchSize);
      
      chunk.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      deleted += chunk.length;
    }

    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    console.error('Chat clear error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
