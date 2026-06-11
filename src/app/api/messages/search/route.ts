import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatType = searchParams.get('chatType');
    const uid = searchParams.get('uid');
    const query = searchParams.get('q');

    if (!chatType) {
      return NextResponse.json(
        { error: 'chatType الزامی است' },
        { status: 400 }
      );
    }

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'عبارت جستجو (q) الزامی است' },
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

    const snapshot = await colRef.orderBy('createdAt', 'desc').get();
    const searchLower = query.toLowerCase();
    const results: any[] = [];

    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      if (results.length >= 20) return;
      const data = doc.data();
      if (data.isDeleted) return;
      if (data.text && data.text.toLowerCase().includes(searchLower)) {
        results.push({ id: doc.id, ...data });
      }
    });

    return NextResponse.json({ results, total: results.length });
  } catch (error: any) {
    console.error('Error searching messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
