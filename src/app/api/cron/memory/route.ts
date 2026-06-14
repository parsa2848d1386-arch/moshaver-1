import { NextResponse } from 'next/server';
import { Client } from "@upstash/qstash";

const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN || "dummy_token_for_build",
});

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Authorization check
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://moshaver-seven.vercel.app";
    
    // In a real scenario, we might query Firebase here to find all users 
    // that need their memory processed, and dispatch a QStash message for EACH user.
    // For now, we dispatch a single job to process the shared chat.
    
    const messageId = await qstashClient.publishJSON({
      url: `${appUrl}/api/cron/process-memory`,
      body: { 
        date: new Date().toISOString(),
        chatType: "shared"
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Job queued to QStash successfully",
      messageId: messageId.messageId
    });

  } catch (error: any) {
    console.error('Cron dispatch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
