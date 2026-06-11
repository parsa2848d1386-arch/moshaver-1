import { NextResponse } from 'next/server';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return NextResponse.json(userDoc.data());
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Server Firestore read error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, displayName, role, avatar, email, isUpdate } = body;

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    const userDocRef = doc(db, 'users', uid);

    if (isUpdate) {
      await updateDoc(userDocRef, {
        displayName,
        avatar
      });
    } else {
      await setDoc(userDocRef, {
        uid,
        email,
        displayName,
        role,
        avatar,
        createdAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Server Firestore write error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
