import {
  GoogleAuthProvider,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { auth } from "./config";
import { deleteUserData } from "../db/userDb";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      signUp: async (email, password) => {
        await createUserWithEmailAndPassword(auth, email, password);
      },
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signInWithGoogle: async () => {
        await signInWithPopup(auth, new GoogleAuthProvider());
      },
      logOut: async () => {
        await signOut(auth);
      },
      deleteAccount: async (password) => {
        if (!auth.currentUser) return;

        const providerId = auth.currentUser.providerData[0]?.providerId;
        if (providerId === "password") {
          if (!password || !auth.currentUser.email) {
            throw new Error("Enter your password to delete your account.");
          }
          await reauthenticateWithCredential(
            auth.currentUser,
            EmailAuthProvider.credential(auth.currentUser.email, password),
          );
        } else if (providerId === "google.com") {
          await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider());
        }

        await deleteUserData(auth.currentUser.uid);
        await deleteUser(auth.currentUser);
      },
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
