import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

function getCollectionRef(chatType: string, uid?: string | null) {
  if (chatType === 'shared') {
    return adminDb.collection('shared_chats');
  }
  if (!uid) return null;
  return adminDb.collection('private_chats').doc(uid).collection('messages');
}

// PUT: ویرایش متن پیام
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { chatType, uid, text } = body;

    if (!chatType || !text) {
      return NextResponse.json(
        { error: 'chatType و text الزامی هستند' },
        { status: 400 }
      );
    }

    const colRef = getCollectionRef(chatType, uid);
    if (!colRef) {
      return NextResponse.json(
        { error: 'uid برای چت خصوصی الزامی است' },
        { status: 400 }
      );
    }

    const docRef = colRef.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'پیام یافت نشد' }, { status: 404 });
    }

    await docRef.update({
      text,
      isEdited: true,
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error editing message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: حذف نرم پیام
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const chatType = searchParams.get('chatType');
    const uid = searchParams.get('uid');

    if (!chatType) {
      return NextResponse.json(
        { error: 'chatType الزامی است' },
        { status: 400 }
      );
    }

    const colRef = getCollectionRef(chatType, uid);
    if (!colRef) {
      return NextResponse.json(
        { error: 'uid برای چت خصوصی الزامی است' },
        { status: 400 }
      );
    }

    const docRef = colRef.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'پیام یافت نشد' }, { status: 404 });
    }

    await docRef.update({
      isDeleted: true,
      text: 'پیام حذف شده',
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: تغییر وضعیت پین یا اضافه/حذف ری‌اکشن
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { chatType, uid, isPinned, reaction } = body;

    if (!chatType) {
      return NextResponse.json(
        { error: 'chatType الزامی است' },
        { status: 400 }
      );
    }

    const colRef = getCollectionRef(chatType, uid);
    if (!colRef) {
      return NextResponse.json(
        { error: 'uid برای چت خصوصی الزامی است' },
        { status: 400 }
      );
    }

    const docRef = colRef.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'پیام یافت نشد' }, { status: 404 });
    }

    // حالت ۱: تغییر وضعیت پین
    if (typeof isPinned !== 'undefined') {
      await docRef.update({ isPinned: !!isPinned });
      return NextResponse.json({ success: true, id, isPinned: !!isPinned });
    }

    // حالت ۲: اضافه یا حذف ری‌اکشن
    if (reaction) {
      const { emoji, userId } = reaction;
      if (!emoji || !userId) {
        return NextResponse.json(
          { error: 'emoji و userId برای ری‌اکشن الزامی هستند' },
          { status: 400 }
        );
      }

      const data = doc.data()!;
      const reactions: Record<string, string[]> = data.reactions || {};

      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }

      const userIndex = reactions[emoji].indexOf(userId);
      if (userIndex === -1) {
        // اضافه کردن ری‌اکشن
        reactions[emoji].push(userId);
      } else {
        // حذف ری‌اکشن (toggle)
        reactions[emoji].splice(userIndex, 1);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      }

      await docRef.update({ reactions });
      return NextResponse.json({ success: true, id, reactions });
    }

    return NextResponse.json(
      { error: 'باید isPinned یا reaction ارسال شود' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error patching message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
