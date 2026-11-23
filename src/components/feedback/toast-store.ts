"use client";

import { create } from "zustand";

export type ToastTone = "success" | "error" | "info" | "warn";

export type ToastItem = {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  durationMs: number;
};

type ToastState = {
  items: ToastItem[];
  push: (input: Omit<ToastItem, "id" | "durationMs"> & { durationMs?: number }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

let seq = 0;

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (input) => {
    const id = `toast-${Date.now()}-${++seq}`;
    const item: ToastItem = {
      id,
      tone: input.tone,
      title: input.title,
      description: input.description,
      durationMs: input.durationMs ?? 4200,
    };
    set((s) => ({ items: [...s.items.slice(-4), item] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
  clear: () => set({ items: [] }),
}));

export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: "success", title, description }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: "error", title, description }),
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: "info", title, description }),
  warn: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: "warn", title, description }),
};
