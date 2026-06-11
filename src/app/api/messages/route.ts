import { NextResponse } from 'next/server';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatType = searchParams.get('chatType');
    const uid = searchParams.get('uid');

    if (!chatType) {
      return NextResponse.json({ error: 'chatType is required' }, { status: 400 });
    }

    let q;
    if (chatType === 'shared') {
      const sharedRef = collection(db, 'shared_chats');
      q = query(sharedRef, orderBy('createdAt', 'asc'));
    } else {
      if (!uid) {
        return NextResponse.json({ error: 'uid is required for private chat' }, { status: 400 });
      }
      const privateRef = collection(db, 'private_chats', uid, 'messages');
      q = query(privateRef, orderBy('createdAt', 'asc'));
    }

    const snapshot = await getDocs(q);
    const msgs: any[] = [];
    snapshot.forEach((doc) => {
      msgs.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json(msgs);
  } catch (error: any) {
    console.error('Server Firestore messages read error:', error);
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
      createdAt: new Date().toISOString()
    };

    let chatCollectionRef;
    if (chatType === 'shared') {
      chatCollectionRef = collection(db, 'shared_chats');
    } else {
      if (!uid) {
        return NextResponse.json({ error: 'uid is required for private chat' }, { status: 400 });
      }
      chatCollectionRef = collection(db, 'private_chats', uid, 'messages');
    }

    const docRef = await addDoc(chatCollectionRef, messageData);

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error('Server Firestore message write error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
