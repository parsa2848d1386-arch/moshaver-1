import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/utils/rateLimit';
import { MessageSchema } from '@/lib/schemas';
import { MessageService } from '@/services/messageService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatType = searchParams.get('chatType');
    const uid = searchParams.get('uid');
    const limitParam = searchParams.get('limit');
    const beforeId = searchParams.get('before');

    if (!chatType) {
      return NextResponse.json({ error: 'chatType is required' }, { status: 400 });
    }

    const result = await MessageService.getMessages(chatType, uid, limitParam, beforeId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Messages read error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Zod Validation
    const validation = MessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors }, { status: 400 });
    }
    const validatedData = validation.data;

    // Rate limiting with Redis
    const rl = await checkRateLimit(`msg_${validatedData.senderId}`, 30, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'تعداد پیام‌های شما بیش از حد مجاز است. لطفاً کمی صبر کنید.' },
        { status: 429 }
      );
    }

    // Call Service
    const message = await MessageService.createMessage(validatedData);

    return NextResponse.json({ success: true, ...message });
  } catch (error: any) {
    console.error('Message write error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
