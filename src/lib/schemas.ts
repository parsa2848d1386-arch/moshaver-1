import { z } from 'zod';

export const MessageSchema = z.object({
  text: z.string().min(1, "متن پیام نمی‌تواند خالی باشد").max(2000, "متن پیام خیلی طولانی است"),
  senderId: z.string(),
  senderName: z.string(),
  senderRole: z.string(),
  chatType: z.enum(["shared", "private"]),
  uid: z.string(),
  mood: z.string().optional().nullable(),
  replyTo: z.any().optional().nullable(),
  imageUrl: z.string().url().optional(),
  voiceUrl: z.string().url().optional(),
  voiceDuration: z.number().optional()
});

export const EditMessageSchema = z.object({
  text: z.string().min(1, "متن پیام نمی‌تواند خالی باشد").max(2000, "متن پیام خیلی طولانی است"),
  chatType: z.enum(["shared", "private"]),
  uid: z.string()
});

export const DeleteMessageSchema = z.object({
  chatType: z.enum(["shared", "private"]),
  uid: z.string()
});

export const ReactionSchema = z.object({
  chatType: z.enum(["shared", "private"]),
  uid: z.string(),
  reaction: z.object({
    emoji: z.string(),
    userId: z.string()
  })
});
