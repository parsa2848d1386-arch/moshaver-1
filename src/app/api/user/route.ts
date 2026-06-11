import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    const userDocRef = adminDb.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      return NextResponse.json(userDoc.data());
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Admin Firestore read error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, displayName, role, avatar, email, isUpdate, settings } = body;

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    const userDocRef = adminDb.collection('users').doc(uid);

    if (isUpdate) {
      // ساخت آبجکت آپدیت - فقط فیلدهای ارسال‌شده
      const updateData: any = {};
      
      if (displayName !== undefined) updateData.displayName = displayName;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (settings !== undefined) updateData.settings = settings;
      
      updateData.updatedAt = new Date().toISOString();
      
      await userDocRef.update(updateData);
    } else {
      // ایجاد پروفایل جدید
      await userDocRef.set({
        uid,
        email,
        displayName,
        role,
        avatar,
        settings: {
          aiModel: 'gemini-2.5-flash',
          customApiKey: '',
          customModelName: '',
          theme: 'dark',
        },
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin Firestore write error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
