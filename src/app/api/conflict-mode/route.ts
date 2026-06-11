import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, topic, sessionId, uid } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'action الزامی است' },
        { status: 400 }
      );
    }

    const sessionsRef = adminDb.collection('conflict_sessions');

    switch (action) {
      case 'start': {
        if (!topic) {
          return NextResponse.json(
            { error: 'topic برای شروع جلسه الزامی است' },
            { status: 400 }
          );
        }

        const sessionData = {
          status: 'active' as const,
          topic,
          currentSpeaker: 'parsa' as const,
          round: 1,
          startedAt: new Date().toISOString(),
          messages: [],
          createdBy: uid || 'unknown',
        };

        const docRef = await sessionsRef.add(sessionData);

        return NextResponse.json({
          success: true,
          session: { id: docRef.id, ...sessionData },
        });
      }

      case 'next_turn': {
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId الزامی است' },
            { status: 400 }
          );
        }

        const docRef = sessionsRef.doc(sessionId);
        const doc = await docRef.get();

        if (!doc.exists) {
          return NextResponse.json(
            { error: 'جلسه یافت نشد' },
            { status: 404 }
          );
        }

        const data = doc.data()!;

        if (data.status !== 'active') {
          return NextResponse.json(
            { error: 'این جلسه فعال نیست' },
            { status: 400 }
          );
        }

        const newSpeaker = data.currentSpeaker === 'parsa' ? 'melika' : 'parsa';
        const newRound = data.round + 1;

        await docRef.update({
          currentSpeaker: newSpeaker,
          round: newRound,
        });

        return NextResponse.json({
          success: true,
          session: {
            id: sessionId,
            ...data,
            currentSpeaker: newSpeaker,
            round: newRound,
          },
        });
      }

      case 'end': {
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId الزامی است' },
            { status: 400 }
          );
        }

        const docRef = sessionsRef.doc(sessionId);
        const doc = await docRef.get();

        if (!doc.exists) {
          return NextResponse.json(
            { error: 'جلسه یافت نشد' },
            { status: 404 }
          );
        }

        await docRef.update({
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
        });

        const updatedDoc = await docRef.get();

        return NextResponse.json({
          success: true,
          session: { id: sessionId, ...updatedDoc.data() },
        });
      }

      default:
        return NextResponse.json(
          { error: 'action نامعتبر است. مقادیر مجاز: start, next_turn, end' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Conflict mode error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
