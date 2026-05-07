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
    if (obj === null || obj === undefined) return String(obj);
    if (typeof obj !== 'object') return String(obj);
    
    const seen = new WeakSet();
    
    // Helper to check for internal Firebase/Firestore objects
    const isInternal = (val: any) => {
      try {
        if (!val || typeof val !== 'object') return false;
        const cName = val.constructor?.name;
        if (!cName) return false;
        
        return (
          ['Y2', 'Ka', 'Firestore', 'FirestoreDatabase', 'FirestoreClient', 'FirebaseAppImpl'].includes(cName) ||
          cName.length < 3 || 
          cName.startsWith('Firebase') ||
          cName.startsWith('Firestore') ||
          (val.i && val.src && cName === 'Ka')
        );
      } catch (e) {
        return false;
      }
    };

    // If the root object itself is internal, stop immediately
    if (isInternal(obj)) {
      return `[Internal Object ${obj.constructor?.name || 'Unknown'}]`;
    }

    return JSON.stringify(obj, (key, value) => {
      // Basic type handling
      if (value === null || value === undefined) return value;

      // Handle Errors
      if (value instanceof Error) {
        return {
          message: value.message,
          name: value.name,
          code: (value as any).code,
          stack: value.stack,
        };
      }

      // Handle Map/Set
      if (value instanceof Map) return Array.from(value.entries());
      if (value instanceof Set) return Array.from(value.values());

      // Object handling
      if (typeof value === 'object') {
        // Circularity check
        if (seen.has(value)) {
          return '[Circular]';
        }
        
        // Add to seen BEFORE internal check to be safe
        seen.add(value);

        // Internal object check
        if (isInternal(value)) {
          return `[Internal Object ${value.constructor?.name || 'Unknown'}]`;
        }
      }
      
      return value;
    }, 2);
  } catch (err) {
    try {
       return `[Unserializable: ${String(obj)}]`;
    } catch (e) {
       return '[Unserializable Content]';
    }
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
  
  // Use a safe way to log properties
  const loggableError = error instanceof Error ? {
    message: error.message,
    name: error.name,
    code: (error as any).code
  } : String(error);

  // Use safeStringify for the console log as well to avoid any circular structure issues in platform loggers
  console.error(`Firestore Error [${operationType}] at [${path}]: ${safeStringify(loggableError)}`);
  
  throw new Error(stringified);
}
