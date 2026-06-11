'use client';
import { useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useTyping(uid: string | null, chatType: string) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Set typing status
  const setTyping = useCallback(
    (typing: boolean) => {
      if (!uid) return;
      if (isTypingRef.current === typing) return;
      isTypingRef.current = typing;

      const typingDocPath = chatType === 'shared' ? 'typing_shared' : `typing_private_${uid}`;
      setDoc(
        doc(db, 'typing_status', typingDocPath),
        {
          [uid]: typing,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(console.error);
    },
    [uid, chatType]
  );

  // Handle input change - start typing
  const handleTypingStart = useCallback(() => {
    setTyping(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 3000);
  }, [setTyping]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setTyping(false);
    };
  }, [setTyping]);

  return { handleTypingStart, setTyping };
}

export function usePartnerTyping(
  uid: string | null,
  partnerUid: string | null,
  chatType: string
) {
  const [isPartnerTyping, setIsPartnerTyping] = React.useState(false);

  React.useEffect(() => {
    if (!uid || !partnerUid) return;

    const typingDocPath = chatType === 'shared' ? 'typing_shared' : `typing_private_${partnerUid}`;
    const unsub = onSnapshot(
      doc(db, 'typing_status', typingDocPath),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setIsPartnerTyping(data[partnerUid] === true);
        }
      }
    );

    return () => unsub();
  }, [uid, partnerUid, chatType]);

  return isPartnerTyping;
}

import React from 'react';
