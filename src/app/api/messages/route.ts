import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatType = searchParams.get('chatType');
    const uid = searchParams.get('uid');

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

    const snapshot = await colRef.orderBy('createdAt', 'asc').get();
    const msgs: any[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      msgs.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json(msgs);
  } catch (error: any) {
    console.error('Admin Firestore messages read error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chatType, uid, text, senderId, senderName, senderRole } = body;

    if (!chatType || !text || !senderId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const messageData = {
      text,
      senderId,
      senderName,
      senderRole,
      createdAt: new Date().toISOString(),
    };

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

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error('Admin Firestore message write error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
