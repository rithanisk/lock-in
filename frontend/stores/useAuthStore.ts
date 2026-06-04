"use client";

import { create } from "zustand";
import type { UserSummary } from "@/types";

interface AuthState {
  user: UserSummary | null;
  loading: boolean;
  alertsUnreadCount: number;
  setUser: (user: UserSummary | null) => void;
  setLoading: (loading: boolean) => void;
  setAlertsUnreadCount: (count: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  alertsUnreadCount: 0,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setAlertsUnreadCount: (count) => set({ alertsUnreadCount: count }),
}));
