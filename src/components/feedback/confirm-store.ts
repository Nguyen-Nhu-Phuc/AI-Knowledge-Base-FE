"use client";

import { create } from "zustand";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmState = {
  open: boolean;
  options: ConfirmOptions | null;
  resolve: ((value: boolean) => void) | null;
  ask: (options: ConfirmOptions) => Promise<boolean>;
  close: (value: boolean) => void;
};

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  options: null,
  resolve: null,
  ask: (options) =>
    new Promise<boolean>((resolve) => {
      const prev = get().resolve;
      if (prev) prev(false);
      set({ open: true, options, resolve });
    }),
  close: (value) => {
    const { resolve } = get();
    resolve?.(value);
    set({ open: false, options: null, resolve: null });
  },
}));

export function confirmDialog(options: ConfirmOptions) {
  return useConfirmStore.getState().ask(options);
}
