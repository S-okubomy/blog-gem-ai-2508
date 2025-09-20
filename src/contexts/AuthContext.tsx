import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth } from '../services/firebaseService';
import { ADMIN_EMAIL } from '../config';

interface AuthContextType {
  user: firebase.User | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
});

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      
      if (!ADMIN_EMAIL) {
         console.warn("管理者メールアドレス(ADMIN_EMAIL)が.envファイルまたはビルド環境変数に設定されていません。");
         setIsAdmin(false);
      } else {
         setIsAdmin(currentUser?.email === ADMIN_EMAIL);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, isAdmin, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
