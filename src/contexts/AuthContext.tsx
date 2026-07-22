"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult as FirebaseConfirmationResult
} from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';

interface UserData {
  uid: string;
  name?: string;
  displayName?: string;
  email?: string | null;
  phoneNumber?: string | null;
  role?: 'admin' | 'customer';
  createdAt?: string | null;
  lastLoginAt?: string | null;
}

interface AuthContextType {
  user: User | null;
  userRole: 'admin' | 'customer' | null;
  userName: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phoneNumber: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<User>;
  logout: () => Promise<void>;
  fetchUserDetails: (uid: string, token: string) => Promise<void>;
  createUserDocument: (uid: string, userData: UserData, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'customer' | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<FirebaseConfirmationResult | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      // Fetch user details if user is logged in
      if (user) {
        // --- Task 4.1: Read role from JWT custom claim first (fast path) ---
        const tokenResult = await user.getIdTokenResult();
        const claimRole = tokenResult.claims.role as string | undefined;

        if (claimRole === 'admin' || claimRole === 'customer') {
          // Role is already in token - no API fetch needed
          setUserRole(claimRole);
          setUserName(user.displayName || user.email || 'User');
        } else {
          // Fallback to fetch details with token
          const token = await user.getIdToken();
          await fetchUserDetails(user.uid, token);
        }
      } else {
        setUserName(null);
        setUserRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;
      const token = await loggedInUser.getIdToken();

      // Sync profile only — role is never written from the client
      await createUserDocument(loggedInUser.uid, {
        uid: loggedInUser.uid,
        displayName: loggedInUser.displayName || email.split('@')[0],
        email: loggedInUser.email,
        phoneNumber: loggedInUser.phoneNumber,
      }, token);

      try {
        await fetch('/api/auth/set-claims', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ uid: loggedInUser.uid }),
        });
        await loggedInUser.getIdToken(true);
      } catch (claimErr) {
        console.warn('[auth] Custom claim stamping failed:', claimErr);
      }

      const tokenResult = await loggedInUser.getIdTokenResult();
      const resolvedRole = tokenResult.claims.role as string | undefined;
      if (resolvedRole !== 'admin') {
        await signOut(auth);
        throw new Error('Access denied. This account is not an administrator.');
      }

      setUserRole('admin');
    } catch (error) {
      throw error;
    }
  };

  const loginWithPhone = async (phoneNumber: string) => {
    try {
      // Set up reCAPTCHA verifier
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved - allow phone authentication
        },
        'expired-callback': () => {
          // Handle expired reCAPTCHA
        },
      });

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(confirmationResult);
    } catch (error) {
      throw error;
    }
  };

  const verifyOtp = async (otp: string) => {
    try {
      if (!confirmationResult) {
        throw new Error('No confirmation result available');
      }
      const result = await confirmationResult.confirm(otp);
      const token = await result.user.getIdToken();

      // Create user profile only — server assigns role on first create
      await createUserDocument(result.user.uid, {
        uid: result.user.uid,
        phoneNumber: result.user.phoneNumber,
      }, token);

      try {
        await fetch('/api/auth/set-claims', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ uid: result.user.uid }),
        });
        await result.user.getIdToken(true);
      } catch (claimErr) {
        console.warn('[auth] OTP claims stamp failed:', claimErr);
      }

      const tokenResult = await result.user.getIdTokenResult();
      const resolvedRole = tokenResult.claims.role as 'admin' | 'customer' | undefined;
      setUserRole(resolvedRole === 'admin' ? 'admin' : 'customer');
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const fetchUserDetails = async (uid: string, token: string) => {
    try {
      const response = await fetch(`/api/get-user?uid=${uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const userName = data.user.name || data.user.displayName || data.user.email || 'User';
        setUserName(userName);

        // You can also set the user role from Firestore if needed
        if (data.user.role) {
          setUserRole(data.user.role);
        }
      } else {
        console.error('Failed to fetch user details');
        setUserName('User');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setUserName('User');
    }
  };

  const createUserDocument = async (uid: string, userData: UserData, token: string) => {
    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          uid,
          name: userData.displayName || userData.name || userData.email || 'User',
          email: userData.email || null,
          phoneNumber: userData.phoneNumber || null,
        }),
      });

      if (response.ok) {
        console.log('User document created successfully');
      }
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
      setUserName(null);
      setConfirmationResult(null);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    userRole,
    userName,
    loading,
    login,
    loginWithPhone,
    verifyOtp,
    logout,
    fetchUserDetails,
    createUserDocument,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
