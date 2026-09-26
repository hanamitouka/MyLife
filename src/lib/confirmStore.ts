import { create } from 'zustand';

/**
 * 应用内确认弹窗的全局状态。
 *
 * 为什么不用原生 window.confirm：打包成桌面端（Tauri WebView）和安卓 APK 后，
 * 原生弹窗可能弹不出来或行为不稳。这里用「ask → 用户点确定/取消 → respond」的方式，
 * 让三端行为一致。
 */
interface ConfirmRequest {
  message: string;
  confirmLabel: string;
}

interface ConfirmState {
  request: ConfirmRequest | null;
  resolve: ((ok: boolean) => void) | null;
  ask: (message: string, confirmLabel?: string) => Promise<boolean>;
  respond: (ok: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  request: null,
  resolve: null,

  ask(message, confirmLabel = '确定') {
    return new Promise<boolean>((resolve) => {
      set({ request: { message, confirmLabel }, resolve });
    });
  },

  respond(ok) {
    get().resolve?.(ok);
    set({ request: null, resolve: null });
  },
}));
