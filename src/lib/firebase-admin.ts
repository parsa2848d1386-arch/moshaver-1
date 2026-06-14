import "server-only";
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Use the full service-account JSON stored as a single env var
  // This is the most reliable method, especially on Vercel
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. ' +
      'Please add it to your Vercel environment variables.'
    );
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  return initializeApp({ credential: cert(serviceAccount) });
}

const adminApp = getAdminApp();
export const adminDb = getFirestore(adminApp);
