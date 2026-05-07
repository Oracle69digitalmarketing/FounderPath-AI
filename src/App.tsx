import { useState, useEffect } from 'react';
import { auth, db, OperationType, handleFirestoreError, safeStringify } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from './types';
import { Layout } from './components/Layout';
import { Landing } from './components/Landing';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        // Initialize profile if it doesn't exist
        const newProfile: UserProfile = {
          user_id: user.uid,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          operational_status: {
            business_plan_generated: false,
            pitch_deck_generated: false,
            crm_configured: false,
            last_nudge_sent: '',
            nudge_cadence: 'daily'
          }
        };
        setDoc(profileRef, newProfile).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`));
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      setLoading(false);
    });

    return () => unsubscribeProfile();
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', safeStringify(error));
    }
  };

  const handleLogout = () => auth.signOut();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      {user ? (
        <Dashboard profile={profile} />
      ) : (
        <Landing onLogin={handleLogin} />
      )}
    </Layout>
  );
}
