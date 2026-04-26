"use client";

import { create } from "zustand";
import type { UserSummary } from "@/types";

interface AuthState {
  user: UserSummary | null;
  loading: boolean;
  setUser: (user: UserSummary | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));
