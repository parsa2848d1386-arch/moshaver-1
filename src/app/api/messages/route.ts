import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { checkRateLimit } from '@/utils/rateLimit';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatType = searchParams.get('chatType');
    const uid = searchParams.get('uid');
    const limitParam = searchParams.get('limit');
    const beforeId = searchParams.get('before');

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

    const pageSize = parseInt(limitParam || '20', 10);
    let q = colRef.orderBy('createdAt', 'desc').limit(pageSize);

    // Cursor-based pagination
    if (beforeId) {
      const beforeDoc = await colRef.doc(beforeId).get();
      if (beforeDoc.exists) {
        q = colRef.orderBy('createdAt', 'desc').startAfter(beforeDoc).limit(pageSize);
      }
    }

    const snapshot = await q.get();
    const msgs: any[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      msgs.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({
      items: msgs.reverse(),
      hasMore: msgs.length >= pageSize,
      lastId: msgs.length > 0 ? msgs[0].id : null,
    });
  } catch (error: any) {
    console.error('Messages read error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chatType, uid, text, senderId, senderName, senderRole, mood, replyTo, imageUrl, voiceUrl, voiceDuration } = body;

    if (!chatType || !text || !senderId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Rate limiting
    const rl = checkRateLimit(`msg_${senderId}`, 30, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'تعداد پیام‌های شما بیش از حد مجاز است. لطفاً کمی صبر کنید.' },
        { status: 429 }
      );
    }

    const messageData: Record<string, any> = {
      text,
      senderId,
      senderName,
      senderRole,
      createdAt: new Date().toISOString(),
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      reactions: {},
    };

    if (mood) messageData.mood = mood;
    if (replyTo) messageData.replyTo = replyTo;
    if (imageUrl) messageData.imageUrl = imageUrl;
    if (voiceUrl) messageData.voiceUrl = voiceUrl;
    if (voiceDuration) messageData.voiceDuration = voiceDuration;

    let colRef;
    if (chatType === 'shared') {
      colRef = adminDb.collection('shared_chats');
    } else {
      if (!uid) {
        return NextResponse.json({ error: 'uid is required for private chat' }, { status: 400 });
      }
      colRef = adminDb.collection('private_chats').doc(uid).collection('messages');
    }

    const docRef = await colRef.add(messageData);

    return NextResponse.json({ success: true, id: docRef.id, ...messageData });
  } catch (error: any) {
    console.error('Message write error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
