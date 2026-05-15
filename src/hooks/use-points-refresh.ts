"use client";

import { create } from "zustand";

interface PointsRefreshState {
  timestamp: number;
  triggerRefresh: () => void;
}

export const usePointsRefreshStore = create<PointsRefreshState>((set) => ({
  timestamp: Date.now(),
  triggerRefresh: () => set({ timestamp: Date.now() }),
}));
