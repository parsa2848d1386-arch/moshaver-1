import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Use a service account JSON stored as an env variable, or fall back to
// Application Default Credentials (works on Vercel with no extra config if
// you add the individual fields as env vars).
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Option A: Full service-account JSON stored in FIREBASE_SERVICE_ACCOUNT_JSON
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    return initializeApp({
      credential: cert(serviceAccount),
    });
  }

  // Option B: Individual env vars (simpler for Vercel)
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  // Option C: No credentials — fall back to project ID only (works with
  // Firestore emulator or if GOOGLE_APPLICATION_CREDENTIALS is set).
  console.warn(
    'Firebase Admin: no service-account credentials found. ' +
    'Add FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY to your env vars.'
  );
  return initializeApp({ projectId });
}

const adminApp = getAdminApp();
export const adminDb = getFirestore(adminApp);
