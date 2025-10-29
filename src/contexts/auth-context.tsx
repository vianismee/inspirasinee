"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/utils/supabase/client";
import type { User, AuthError } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logger } from "@/utils/client/logger";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error("Error getting initial session", { error }, "Auth");
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        logger.error("Unexpected error getting session", { error }, "Auth");
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.debug("Auth state changed", { event, email: session?.user?.email }, "Auth");

        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          toast.success("Successfully signed in!");
          router.refresh();
        } else if (event === 'SIGNED_OUT') {
          toast.success("Successfully signed out!");
          router.refresh();
        } else if (event === 'TOKEN_REFRESHED') {
          logger.debug("Token refreshed successfully", {}, "Auth");
        } else if (event === 'USER_UPDATED') {
          logger.debug("User updated", { userId: session?.user?.id }, "Auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        toast.error(error.message);
      } else {
        toast.success("Signing in...");
      }

      return { error };
    } catch (error) {
      const authError = error as AuthError;
      console.error("Unexpected sign in error:", authError);
      toast.error("An unexpected error occurred during sign in");
      return { error: authError };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        console.error("Sign up error:", error);
        toast.error(error.message);
      } else {
        toast.success("Sign up successful! Please check your email to verify.");
      }

      return { error };
    } catch (error) {
      const authError = error as AuthError;
      console.error("Unexpected sign up error:", authError);
      toast.error("An unexpected error occurred during sign up");
      return { error: authError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Sign out error:", error);
        toast.error(error.message);
      }

      // Redirect to login page after sign out
      router.push("/login");
    } catch (error) {
      console.error("Unexpected sign out error:", error);
      toast.error("An unexpected error occurred during sign out");
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("Reset password error:", error);
        toast.error(error.message);
      } else {
        toast.success("Password reset email sent! Please check your inbox.");
      }

      return { error };
    } catch (error) {
      const authError = error as AuthError;
      console.error("Unexpected reset password error:", authError);
      toast.error("An unexpected error occurred while sending reset email");
      return { error: authError };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error("Update password error:", error);
        toast.error(error.message);
      } else {
        toast.success("Password updated successfully!");
      }

      return { error };
    } catch (error) {
      const authError = error as AuthError;
      console.error("Unexpected update password error:", authError);
      toast.error("An unexpected error occurred while updating password");
      return { error: authError };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}