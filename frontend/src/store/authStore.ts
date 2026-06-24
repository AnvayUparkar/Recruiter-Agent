import { create } from "zustand";

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: "user" | "recruiter";
  profile_picture?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

// Helper to safely get from local storage
const getLocalStorageItem = (key: string) => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
};

// Initialize state from local storage if available
const initialToken = getLocalStorageItem("recruiter_auth_token");
const initialUserStr = getLocalStorageItem("recruiter_auth_user");
let initialUser: User | null = null;

try {
  if (initialUserStr) {
    initialUser = JSON.parse(initialUserStr);
  }
} catch (e) {
  console.error("Failed to parse user from local storage", e);
}

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  user: initialUser,
  isAuthenticated: !!initialToken,

  login: (token: string, user: User) => {
    localStorage.setItem("recruiter_auth_token", token);
    localStorage.setItem("recruiter_auth_user", JSON.stringify(user));
    
    // Legacy flag for backward compatibility
    localStorage.setItem("recruiter_authenticated", "true");

    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("recruiter_auth_token");
    localStorage.removeItem("recruiter_auth_user");
    localStorage.removeItem("recruiter_authenticated");
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateUser: (updates: Partial<User>) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...updates };
      localStorage.setItem("recruiter_auth_user", JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },
}));
