import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// GET: دریافت رویدادهای تقویم
export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('calendar_events')
      .orderBy('date', 'asc')
      .get();

    const events: any[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      events.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Calendar GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: ایجاد رویداد جدید
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, date, type, recurring, reminder, createdBy, uid } = body;

    if (!title || !date || !type || !createdBy) {
      return NextResponse.json(
        { error: 'title، date، type و createdBy الزامی هستند' },
        { status: 400 }
      );
    }

    const validTypes = ['anniversary', 'birthday', 'therapy', 'date', 'custom'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type نامعتبر است. مقادیر مجاز: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const eventData = {
      title,
      date,
      type,
      recurring: recurring ?? false,
      reminder: reminder ?? true,
      createdBy,
      uid: uid || createdBy,
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('calendar_events').add(eventData);

    return NextResponse.json({
      success: true,
      event: { id: docRef.id, ...eventData },
    });
  } catch (error: any) {
    console.error('Calendar POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: حذف رویداد
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId الزامی است' },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection('calendar_events').doc(eventId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'رویداد یافت نشد' },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({ success: true, deletedId: eventId });
  } catch (error: any) {
    console.error('Calendar DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
