import "server-only";
import { adminDb } from '@/lib/firebase-admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export class MessageService {
  static getCollectionRef(chatType: string, uid?: string | null) {
    if (chatType === 'shared') {
      return adminDb.collection('shared_chats');
    } else {
      if (!uid) throw new Error('uid is required for private chat');
      return adminDb.collection('private_chats').doc(uid).collection('messages');
    }
  }

  static async getMessages(chatType: string, uid: string | null, limitParam: string | null, beforeId: string | null) {
    const colRef = this.getCollectionRef(chatType, uid);
    const pageSize = parseInt(limitParam || '20', 10);
    let q = colRef.orderBy('createdAt', 'desc').limit(pageSize);

    if (beforeId) {
      const beforeDoc = await colRef.doc(beforeId).get();
      if (beforeDoc.exists) {
        q = colRef.orderBy('createdAt', 'desc').startAfter(beforeDoc).limit(pageSize);
      }
    }

    const snapshot = await q.get();
    const msgs: any[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      msgs.push({ id: doc.id, ...doc.data() });
    });

    return {
      items: msgs.reverse(),
      hasMore: msgs.length >= pageSize,
      lastId: msgs.length > 0 ? msgs[0].id : null,
    };
  }

  static async createMessage(data: any) {
    const colRef = this.getCollectionRef(data.chatType, data.uid);
    const messageData = {
      text: data.text,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      createdAt: new Date().toISOString(),
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      reactions: {},
      ...(data.mood && { mood: data.mood }),
      ...(data.replyTo && { replyTo: data.replyTo }),
      ...(data.imageUrl && { imageUrl: data.imageUrl }),
      ...(data.voiceUrl && { voiceUrl: data.voiceUrl }),
      ...(data.voiceDuration && { voiceDuration: data.voiceDuration }),
    };

    const docRef = await colRef.add(messageData);
    return { id: docRef.id, ...messageData };
  }
}
