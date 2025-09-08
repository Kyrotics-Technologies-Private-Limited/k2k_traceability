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
  login: (email: string, password: string, role: 'admin' | 'customer') => Promise<void>;
  loginWithPhone: (phoneNumber: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<User>;
  logout: () => Promise<void>;
  setUserFromToken: (token: string) => Promise<void>;
  fetchUserDetails: (uid: string) => Promise<void>;
  createUserDocument: (uid: string, userData: UserData) => Promise<void>;
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
      console.log('🔐 Auth State Changed:', {
        user: user ? {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        } : null,
        timestamp: new Date().toISOString()
      });
      setUser(user);
      
      // Fetch user details if user is logged in
      if (user) {
        await fetchUserDetails(user.uid);
        // Optionally create user document if it doesn't exist
        // await createUserDocument(user.uid, user);
      } else {
        setUserName(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string, role: 'admin' | 'customer') => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setUserRole(role);
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
      setUserRole('customer');
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const fetchUserDetails = async (uid: string) => {
    try {
      const response = await fetch(`/api/get-user?uid=${uid}`);
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

  const createUserDocument = async (uid: string, userData: UserData) => {
    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          name: userData.displayName || userData.email || 'User',
          email: userData.email || null,
          phoneNumber: userData.phoneNumber || null,
          role: userRole || 'customer'
        }),
      });
      
      if (response.ok) {
        console.log('User document created successfully');
      }
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  };

  const setUserFromToken = async (token: string) => {
    try {
      // Verify token via API
      const response = await fetch(`/api/verify-token?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        // Create a mock user object for token-based auth
        const mockUser = {
          uid: data.user.uid,
          email: data.user.email,
          emailVerified: data.user.email_verified,
        } as User;
        setUser(mockUser);
        
        // Fetch user details from Firestore which will set the role
        await fetchUserDetails(data.user.uid);
        
        // If no role is set from Firestore, default to customer
        if (!userRole) {
          setUserRole('customer');
        }
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      throw error;
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
    setUserFromToken,
    fetchUserDetails,
    createUserDocument,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
