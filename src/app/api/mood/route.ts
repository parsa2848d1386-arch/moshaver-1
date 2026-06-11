import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// POST: ذخیره وضعیت روحی
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, mood, date } = body;

    if (!uid || !mood) {
      return NextResponse.json(
        { error: 'uid و mood الزامی هستند' },
        { status: 400 }
      );
    }

    const dateStr = date || new Date().toISOString().split('T')[0];
    const docId = `${uid}_${dateStr}`;

    const moodData = {
      uid,
      mood,
      date: dateStr,
      createdAt: new Date().toISOString(),
    };

    await adminDb.collection('mood_history').doc(docId).set(moodData);

    return NextResponse.json({ success: true, id: docId, ...moodData });
  } catch (error: any) {
    console.error('Mood POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: دریافت تاریخچه مود ۷ روز اخیر
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'uid الزامی است' },
        { status: 400 }
      );
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const snapshot = await adminDb
      .collection('mood_history')
      .where('uid', '==', uid)
      .where('date', '>=', sevenDaysAgoStr)
      .orderBy('date', 'desc')
      .get();

    const moods: any[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      moods.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({ moods });
  } catch (error: any) {
    console.error('Mood GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
