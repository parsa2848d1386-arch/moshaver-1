import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// GET: دریافت همه اهداف فعال
export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('shared_goals')
      .orderBy('createdAt', 'desc')
      .get();

    const goals: any[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      goals.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({ goals });
  } catch (error: any) {
    console.error('Goals GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: ایجاد هدف جدید
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, deadline, createdBy, uid } = body;

    if (!title || !createdBy) {
      return NextResponse.json(
        { error: 'title و createdBy الزامی هستند' },
        { status: 400 }
      );
    }

    const goalData = {
      title,
      description: description || '',
      deadline: deadline || null,
      createdBy,
      uid: uid || createdBy,
      progress: 0,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('shared_goals').add(goalData);

    return NextResponse.json({
      success: true,
      goal: { id: docRef.id, ...goalData },
    });
  } catch (error: any) {
    console.error('Goals POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: به‌روزرسانی پیشرفت یا وضعیت هدف
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { goalId, progress, status } = body;

    if (!goalId) {
      return NextResponse.json(
        { error: 'goalId الزامی است' },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection('shared_goals').doc(goalId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'هدف یافت نشد' }, { status: 404 });
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (typeof progress === 'number') {
      updateData.progress = Math.min(100, Math.max(0, progress));
    }

    if (status && ['active', 'completed', 'paused'].includes(status)) {
      updateData.status = status;
    }

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    return NextResponse.json({
      success: true,
      goal: { id: goalId, ...updatedDoc.data() },
    });
  } catch (error: any) {
    console.error('Goals PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
