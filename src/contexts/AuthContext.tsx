import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  sendEmailVerification, 
  updateProfile as firebaseUpdateProfile,
  deleteUser as firebaseDeleteUser
} from 'firebase/auth';
import { auth, db } from '../lib/firebase/config';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { UserProfile, UserSettings } from '../types';
import { checkIsAdmin, getUserProfile, updateUserProfile as dbUpdateUserProfile, recordUserPresence, DEFAULT_USER_SETTINGS, deleteUserAndData } from '../lib/firebase/firestore';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isGo: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const isGo = profile?.plan === 'go';

  const fetchProfile = useCallback(async (uid: string, currentUser: User) => {
    try {
      const p = await getUserProfile(uid);
      if (p) {
        setProfile(p);
      } else {
        // Create initial profile
        const initialProfile: Partial<UserProfile> = {
          email: currentUser.email || '',
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Kullanıcı',
          username: currentUser.email?.split('@')[0] || `user_${uid.slice(0, 5)}`,
          photoURL: currentUser.photoURL || '',
          bio: '',
          role: currentUser.email === 'lowai.official@gmail.com' ? 'admin' : 'user',
          plan: 'free',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastSeenAt: serverTimestamp(),
          isBanned: false,
          banReason: '',
          thinkingCooldownUntil: 0,
          settings: DEFAULT_USER_SETTINGS
        };
        await setDoc(doc(db, 'users', uid), initialProfile, { merge: true });
        setProfile({
          uid,
          email: currentUser.email || '',
          displayName: initialProfile.displayName || '',
          username: initialProfile.username || '',
          photoURL: initialProfile.photoURL || '',
          bio: '',
          role: initialProfile.role,
          plan: 'free',
          isBanned: false,
          thinkingCooldownUntil: 0,
          settings: DEFAULT_USER_SETTINGS
        });
      }

      // Check Admin status
      const adminStatus = await checkIsAdmin(uid, currentUser.email);
      setIsAdmin(adminStatus);
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  }, []);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;
    let presenceInterval: any = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchProfile(currentUser.uid, currentUser);

        // Real-time listener for current user's profile updates (e.g. if banned or profile/plan updated)
        const userDocRef = doc(db, 'users', currentUser.uid);
        unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile(prev => ({
              uid: currentUser.uid,
              email: data.email || currentUser.email || '',
              displayName: data.displayName || currentUser.displayName || '',
              username: data.username || '',
              photoURL: data.photoURL || currentUser.photoURL || '',
              bio: data.bio || '',
              role: data.role || (currentUser.email === 'lowai.official@gmail.com' ? 'admin' : 'user'),
              plan: (data.plan === 'go' ? 'go' : 'free'),
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              lastSeenAt: data.lastSeenAt,
              isBanned: !!data.isBanned,
              banReason: data.banReason || '',
              thinkingCooldownUntil: typeof data.thinkingCooldownUntil === 'number' ? data.thinkingCooldownUntil : 0,
              thinkingUsesToday: typeof data.thinkingUsesToday === 'number' ? data.thinkingUsesToday : 0,
              thinkingLastUsedDate: data.thinkingLastUsedDate || '',
              chatCountToday: typeof data.chatCountToday === 'number' ? data.chatCountToday : 0,
              chatLastDate: data.chatLastDate || '',
              voiceSecondsUsedToday: typeof data.voiceSecondsUsedToday === 'number' ? data.voiceSecondsUsedToday : 0,
              voiceLastUsedDate: data.voiceLastUsedDate || '',
              settings: {
                ...DEFAULT_USER_SETTINGS,
                ...(data.settings || {})
              }
            }));
          }
        });

        // Record presence initially and periodically
        recordUserPresence(currentUser.uid);
        presenceInterval = setInterval(() => {
          recordUserPresence(currentUser.uid);
        }, 120000); // every 2 mins
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        if (unsubscribeDoc) unsubscribeDoc();
        if (presenceInterval) clearInterval(presenceInterval);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
      if (presenceInterval) clearInterval(presenceInterval);
    };
  }, [fetchProfile]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const resendVerificationEmail = async () => {
    if (user) {
      await sendEmailVerification(user);
    }
  };

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await dbUpdateUserProfile(user.uid, updates);
      
      // Also update Auth profile displayName/photoURL if provided
      if (updates.displayName || updates.photoURL) {
        await firebaseUpdateProfile(user, {
          displayName: updates.displayName !== undefined ? updates.displayName : user.displayName,
          photoURL: updates.photoURL !== undefined ? updates.photoURL : user.photoURL
        });
      }

      // Local optimistic update
      setProfile(prev => prev ? ({ ...prev, ...updates }) : null);
    } catch (error) {
      console.error("Error updating profile data:", error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid, user);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    const uid = user.uid;
    await deleteUserAndData(uid);
    await firebaseDeleteUser(user);
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      isAdmin, 
      isGo,
      loading, 
      signOut, 
      resendVerificationEmail, 
      updateProfileData, 
      refreshProfile,
      deleteAccount 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
