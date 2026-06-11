import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    // گرفتن ۷ رکورد آخر از حافظه بلندمدت برای نمایش روند سلامت رابطه
    const snapshot = await adminDb.collection('relationship_memory')
      .orderBy('date', 'desc')
      .limit(7)
      .get();

    const memories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).reverse(); // مرتب‌سازی صعودی (از قدیم به جدید) برای نمودارها

    return NextResponse.json(memories);
  } catch (error: any) {
    console.error('Insights read error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
