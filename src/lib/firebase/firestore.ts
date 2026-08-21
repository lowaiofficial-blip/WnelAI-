import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './config';
import { UserProfile, UserSettings } from '../../types';

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export type Chat = {
  id: string;
  userId: string;
  title: string;
  createdAt: any;
  updatedAt: any;
  isPinned: boolean;
};

export type ChatMessage = {
  id?: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: any;
};

// --- CHAT OPERATIONS ---

export async function createChat(userId: string, title: string): Promise<string> {
  const path = 'chats';
  try {
    const chatRef = await addDoc(collection(db, path), {
      userId,
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPinned: false
    });
    return chatRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
}

export function subscribeToUserChats(
  userId: string, 
  callback: (chats: Chat[]) => void,
  onError?: (err: any) => void
): () => void {
  const path = 'chats';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Chat));
      callback(chats);
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
      if (onError) onError(error);
    });
    return unsubscribe;
  } catch (error) {
    console.error("Failed to subscribe to user chats:", error);
    return () => {};
  }
}

export function getUserChats(userId: string): Promise<Chat[]>;
export function getUserChats(userId: string, callback: (chats: Chat[]) => void): () => void;
export function getUserChats(userId: string, callback?: (chats: Chat[]) => void): Promise<Chat[]> | (() => void) {
  if (callback) {
    return subscribeToUserChats(userId, callback);
  }
  const path = 'chats';
  return (async () => {
    try {
      const q = query(
        collection(db, path),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Chat));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  })();
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  const path = `chats/${chatId}/messages`;
  try {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ChatMessage));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function addMessageToChat(chatId: string, role: 'user' | 'ai', content: string): Promise<string> {
  const msgPath = `chats/${chatId}/messages`;
  try {
    const messageRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
      role,
      content,
      createdAt: serverTimestamp()
    });
    
    await updateDoc(doc(db, 'chats', chatId), {
      updatedAt: serverTimestamp()
    });
    
    return messageRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, msgPath);
    return '';
  }
}

export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  const path = `chats/${chatId}`;
  try {
    await updateDoc(doc(db, 'chats', chatId), {
      title,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleChatPin(chatId: string, isPinned: boolean): Promise<void> {
  const path = `chats/${chatId}`;
  try {
    await updateDoc(doc(db, 'chats', chatId), {
      isPinned,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteChat(chatId: string): Promise<void> {
  const path = `chats/${chatId}`;
  try {
    // Delete all messages in the subcollection first
    const messagesSnap = await getDocs(collection(db, 'chats', chatId, 'messages'));
    const batch = writeBatch(db);
    messagesSnap.forEach(mDoc => {
      batch.delete(mDoc.ref);
    });
    batch.delete(doc(db, 'chats', chatId));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- USER PROFILE & SETTINGS OPERATIONS ---

export const DEFAULT_USER_SETTINGS: UserSettings = {
  notificationsEnabled: true,
  pushEnabled: false,
  theme: 'dark',
  soundEffects: true
};

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid: userDoc.id,
        email: data.email || '',
        displayName: data.displayName || '',
        username: data.username || '',
        photoURL: data.photoURL || '',
        bio: data.bio || '',
        role: data.role || 'user',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        lastSeenAt: data.lastSeenAt,
        isBanned: data.isBanned || false,
        banReason: data.banReason || '',
        thinkingCooldownUntil: typeof data.thinkingCooldownUntil === 'number' ? data.thinkingCooldownUntil : 0,
        settings: {
          ...DEFAULT_USER_SETTINGS,
          ...(data.settings || {})
        }
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const path = `users/${uid}`;
  try {
    const cleanUpdates: any = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    delete cleanUpdates.uid; // Don't overwrite document ID field
    await setDoc(doc(db, 'users', uid), cleanUpdates, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function recordUserPresence(uid: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      lastSeenAt: serverTimestamp()
    });
  } catch (error) {
    // Non-blocking for presence
    console.debug('Presence ping:', error);
  }
}

// --- ADMIN OPERATIONS ---

export async function checkIsAdmin(uid: string, email?: string | null): Promise<boolean> {
  // Check bootstrap admin email
  if (email === 'lowai.official@gmail.com') {
    // Automatically ensure /admins/{uid} doc exists
    try {
      const adminDoc = await getDoc(doc(db, 'admins', uid));
      if (!adminDoc.exists()) {
        await setDoc(doc(db, 'admins', uid), {
          email,
          createdAt: serverTimestamp(),
          role: 'admin'
        }, { merge: true });
      }
    } catch (e) {
      console.warn("Bootstrap admin doc check:", e);
    }
    return true;
  }

  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    return adminDoc.exists();
  } catch (error) {
    return false;
  }
}

export async function getAllUsersForAdmin(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => {
      const data = d.data();
      return {
        uid: d.id,
        email: data.email || '',
        displayName: data.displayName || '',
        username: data.username || '',
        photoURL: data.photoURL || '',
        bio: data.bio || '',
        role: data.role || 'user',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        lastSeenAt: data.lastSeenAt,
        isBanned: data.isBanned || false,
        banReason: data.banReason || '',
        settings: data.settings || DEFAULT_USER_SETTINGS
      } as UserProfile;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function banUser(uid: string, banReason: string = 'Kural ihlali'): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      isBanned: true,
      banReason,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function unbanUser(uid: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      isBanned: false,
      banReason: '',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteUserAndData(uid: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    // 1. Fetch user's chats
    const chatsSnap = await getDocs(query(collection(db, 'chats'), where('userId', '==', uid)));
    for (const cDoc of chatsSnap.docs) {
      await deleteChat(cDoc.id);
    }
    // 2. Delete user doc
    await deleteDoc(doc(db, 'users', uid));
    // 3. If admin doc exists, delete it too
    try {
      await deleteDoc(doc(db, 'admins', uid));
    } catch (e) {
      // ignore
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getUserChatLogsForAdmin(userId: string): Promise<Array<Chat & { messageCount?: number; messages?: ChatMessage[] }>> {
  try {
    const chats = await getUserChats(userId);
    const chatsWithLogs = await Promise.all(
      chats.map(async (chat) => {
        const messages = await getChatMessages(chat.id);
        return {
          ...chat,
          messageCount: messages.length,
          messages
        };
      })
    );
    return chatsWithLogs;
  } catch (error) {
    console.error("Error loading chat logs for admin:", error);
    return [];
  }
}

export async function getAdminStats(): Promise<{
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  onlineUsers: number;
}> {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const chatsSnap = await getDocs(collection(db, 'chats'));
    
    let totalMessages = 0;
    // Sample messages count across chats
    for (const chatDoc of chatsSnap.docs) {
      const msgSnap = await getDocs(collection(db, 'chats', chatDoc.id, 'messages'));
      totalMessages += msgSnap.size;
    }

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    let onlineCount = 0;

    usersSnap.forEach(d => {
      const data = d.data();
      if (data.lastSeenAt) {
        const lastSeen = data.lastSeenAt.toMillis ? data.lastSeenAt.toMillis() : new Date(data.lastSeenAt).getTime();
        if (lastSeen > fiveMinutesAgo) {
          onlineCount++;
        }
      }
    });

    return {
      totalUsers: usersSnap.size,
      totalChats: chatsSnap.size,
      totalMessages,
      onlineUsers: Math.max(1, onlineCount) // At least current admin is online
    };
  } catch (error) {
    console.error("Error loading admin stats:", error);
    return {
      totalUsers: 0,
      totalChats: 0,
      totalMessages: 0,
      onlineUsers: 1
    };
  }
}
