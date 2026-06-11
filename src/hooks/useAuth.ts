'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserProfile, UserSettings } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setError('');
        try {
          const res = await fetch(`/api/user?uid=${firebaseUser.uid}`);
          if (res.ok) {
            const profileData = (await res.json()) as UserProfile;
            setProfile(profileData);
          } else {
            router.push('/login');
          }
        } catch (err: any) {
          console.error('Profile load error:', err);
          setError('خطا در بارگذاری اطلاعات. لطفاً صفحه را رفرش کنید.');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    },
    []
  );

  const saveSettings = useCallback(
    async (
      editName: string,
      editAvatar: string,
      settings: UserSettings
    ) => {
      if (!user || !profile) throw new Error('کاربر وارد نشده');
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          displayName: editName.trim() || profile.displayName,
          avatar: editAvatar,
          settings,
          isUpdate: true,
        }),
      });
      if (!res.ok) throw new Error('خطا در ذخیره تنظیمات');
      updateProfile({
        displayName: editName.trim() || profile.displayName,
        avatar: editAvatar,
        settings,
      });
    },
    [user, profile, updateProfile]
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    router.push('/login');
  }, [router]);

  return { user, profile, loading, error, updateProfile, saveSettings, logout };
}
