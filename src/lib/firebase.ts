import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection successful');
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function safeStringify(obj: any): string {
  try {
    if (obj === null || typeof obj !== 'object') return String(obj);
    
    // Use a WeakSet to track seen objects
    const seen = new WeakSet();
    
    return JSON.stringify(obj, (key, value) => {
      // Handle the value being an Error object
      if (value instanceof Error) {
        return {
          message: value.message,
          name: value.name,
          stack: value.stack,
        };
      }

      // Handle circular references and internal Firebase objects
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);

        // Filter out suspected internal Firestore/Firebase objects which are problematic for stringification
        if (value?.constructor?.name && 
            (value.constructor.name === 'Y2' || 
             value.constructor.name === 'Ka' ||
             value.constructor.name === 'Firestore' ||
             value.constructor.name === 'FirestoreDatabase')) {
          return `[FirebaseInternal ${value.constructor.name}]`;
        }
      }
      
      return value;
    }, 2);
  } catch (err) {
    console.warn("safeStringify failed:", err);
    return `[Non-serializable: ${err instanceof Error ? err.message : String(err)}]`;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Create a minimal info object to avoid passing potentially huge or circular objects
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  
  const stringified = safeStringify(errInfo);
  console.error(`Firestore Error [${operationType}] at [${path}]:`, {
    message: errorMessage,
    path,
    operation: operationType,
    // Avoid logging the raw error object if it might be circular
    code: (error as any)?.code || 'unknown'
  });
  
  throw new Error(stringified);
}
