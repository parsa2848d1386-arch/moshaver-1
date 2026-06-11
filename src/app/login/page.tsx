'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Profile settings for first time users
  const [setupMode, setSetupMode] = useState(false);
  const [role, setRole] = useState<'parsa' | 'melika'>('parsa');
  const [displayName, setDisplayName] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const router = useRouter();

  // تشخیص موبایل بودن دستگاه
  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  useEffect(() => {
    // بررسی نتیجه redirect بعد از Google Sign-In
    const checkRedirectResult = async () => {
      setLoading(true);
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          // کاربر از redirect گوگل برگشته - onAuthStateChanged بقیه رو هندل میکنه
          console.log("Google redirect sign-in successful");
        }
      } catch (err: any) {
        console.error("Redirect result error:", err);
        const errCode = err.code || '';
        if (errCode !== 'auth/null-user') {
          setError(`ورود با گوگل ناموفق بود (${errCode || err.message}). لطفاً دوباره تلاش کنید.`);
        }
      }
      setLoading(false);
    };

    checkRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true);
        setError('');
        try {
          // Fetch user profile from Server-side proxy API
          const res = await fetch(`/api/user?uid=${user.uid}`);
          
          if (res.status === 200) {
            // Profile exists
            router.push('/');
          } else if (res.status === 404) {
            // Profile does not exist, show setup screen
            setCurrentUser(user);
            setDisplayName(user.displayName || '');
            setSetupMode(true);
          } else {
            const data = await res.json();
            throw new Error(data.error || 'خطا در ارتباط با سرور دیتابیس');
          }
        } catch (err: any) {
          console.error("Profile check error:", err);
          setError(`خطا در بررسی پروفایل (${err.message}). لطفاً وضعیت اتصال اینترنت خود را چک کنید.`);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // setLoading(false) نباید اینجا باشه چون onAuthStateChanged ادامه میده
    } catch (err: any) {
      console.error("Auth error:", err);
      const errCode = err.code || '';
      setError(
        errCode === 'auth/user-not-found' || errCode === 'auth/wrong-password' || errCode === 'auth/invalid-credential'
          ? 'ایمیل یا رمز عبور اشتباه است.'
          : errCode === 'auth/email-already-in-use'
          ? 'این ایمیل قبلاً ثبت شده است.'
          : errCode === 'auth/weak-password'
          ? 'رمز عبور باید حداقل ۶ کاراکتر باشد.'
          : errCode === 'auth/invalid-email'
          ? 'فرمت ایمیل نامعتبر است.'
          : errCode === 'auth/network-request-failed'
          ? 'خطای شبکه. لطفاً اتصال اینترنت را بررسی کنید.'
          : `خطایی رخ داد (${errCode || err.message}). لطفاً وضعیت اتصال و فعال بودن ورود ایمیلی در کنسول فایربیس را بررسی کنید.`
      );
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      if (isMobile()) {
        // روی موبایل از redirect استفاده می‌کنیم (پاپ‌آپ بلاک می‌شه)
        await signInWithRedirect(auth, googleProvider);
        // صفحه redirect می‌شه، پس اینجا نمی‌رسه
      } else {
        // روی دسکتاپ از popup استفاده می‌کنیم
        await signInWithPopup(auth, googleProvider);
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Google sign in error:", err);
      const errCode = err.code || '';
      if (errCode === 'auth/popup-blocked') {
        // اگه popup بلاک شد، سعی کن با redirect
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr: any) {
          setError(`ورود با گوگل ناموفق بود. لطفاً اجازه popup را در مرورگر خود بدهید.`);
          setLoading(false);
        }
      } else if (errCode === 'auth/popup-closed-by-user') {
        setError('پنجره ورود بسته شد. لطفاً دوباره تلاش کنید.');
        setLoading(false);
      } else if (errCode === 'auth/unauthorized-domain') {
        setError('این دامنه در Firebase مجاز نیست. لطفاً در کنسول Firebase، دامنه را به Authorized Domains اضافه کنید.');
        setLoading(false);
      } else if (errCode === 'auth/network-request-failed') {
        setError('خطای شبکه. لطفاً اتصال اینترنت را بررسی کنید.');
        setLoading(false);
      } else {
        setError(`ورود با گوگل ناموفق بود (${errCode || err.message}).`);
        setLoading(false);
      }
    }
  };

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const finalName = displayName.trim() || (role === 'parsa' ? 'پارسا' : 'ملیکا');
      
      // Save profile via Server-side proxy API
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: finalName,
          role: role,
          avatar: role === 'parsa' ? '👨‍💻' : '👩‍🎨',
          isUpdate: false
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'خطا در ثبت پروفایل');
      }

      router.push('/');
    } catch (err: any) {
      console.error(err);
      setError(`ذخیره اطلاعات پروفایل ناموفق بود (${err.message}).`);
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }} className="animate-fade-in">
          <span style={{ fontSize: '48px' }}>🕯️</span>
          <h1 style={{ fontSize: '28px', marginTop: '16px', fontWeight: 'bold' }}>مشاور هوشمند رابطه</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>
            فضایی امن برای گفتگو و تفاهم بین پارسا و ملیکا
          </p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.15)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            color: '#f87171', 
            padding: '12px', 
            borderRadius: '12px', 
            marginBottom: '16px', 
            fontSize: '14px',
            textAlign: 'center',
            lineHeight: '1.6'
          }}>
            {error}
          </div>
        )}

        {/* PROFILE SETUP MODE */}
        {setupMode ? (
          <form onSubmit={handleProfileSetup} className="glass-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '18px', textAlign: 'center', marginBottom: '8px' }}>تکمیل اطلاعات پروفایل</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
              لطفاً نقش و نام نمایشی خود را برای شخصی‌سازی جلسات مشاوره انتخاب کنید:
            </p>
            
            <div className="input-group">
              <label className="input-label">شما کدام هستید؟</label>
              <div className="rooms-tabs">
                <div 
                  className={`room-tab ${role === 'parsa' ? 'active' : ''}`}
                  onClick={() => setRole('parsa')}
                  style={{ cursor: 'pointer' }}
                >
                  پارسا (👨‍💻)
                </div>
                <div 
                  className={`room-tab ${role === 'melika' ? 'active' : ''}`}
                  onClick={() => setRole('melika')}
                  style={{ cursor: 'pointer' }}
                >
                  ملیکا (👩‍🎨)
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">نام نمایشی شما</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder={role === 'parsa' ? 'پارسا' : 'ملیکا'}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '8px' }}>
              {loading ? 'در حال ثبت...' : 'ورود به مشاور'}
            </button>
          </form>
        ) : (
          /* REGULAR LOGIN/SIGNUP MODE */
          <div className="glass-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '20px', textAlign: 'center', marginBottom: '8px' }}>
              {isSignUp ? 'ثبت نام حساب جدید' : 'ورود به برنامه'}
            </h2>

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">ایمیل</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">رمز عبور</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="حداقل ۶ کاراکتر" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'صبر کنید...' : isSignUp ? 'ثبت نام' : 'ورود'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0', color: 'var(--text-muted)' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
              <span style={{ padding: '0 10px', fontSize: '12px' }}>یا</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
            </div>

            <button onClick={handleGoogleSignIn} disabled={loading} className="btn btn-google">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '8px' }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              {loading ? 'در حال ورود...' : 'ورود با حساب گوگل'}
            </button>

            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }} 
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '14px', cursor: 'pointer', marginTop: '8px' }}
            >
              {isSignUp ? 'حساب کاربری دارید؟ وارد شوید' : 'حساب کاربری ندارید؟ ثبت نام کنید'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
