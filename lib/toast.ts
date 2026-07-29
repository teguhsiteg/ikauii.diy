/**
 * Global Toast Notification System
 * Menggunakan CustomEvent browser — tidak butuh library eksternal.
 * Gunakan: import { toast } from "@/lib/toast";
 */

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastPayload {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastOptions {
  duration?: number;
}

const TOAST_EVENT = "__ika_toast__";

function emit(type: ToastType, message: string, options?: ToastOptions) {
  if (typeof window === "undefined") return;
  const payload: ToastPayload = {
    id: Date.now() + Math.random(),
    type,
    message,
    duration: options?.duration ?? 4500,
  };
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: payload }));
}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    emit("success", message, options),
  error: (message: string, options?: ToastOptions) =>
    emit("error", message, options),
  warning: (message: string, options?: ToastOptions) =>
    emit("warning", message, options),
  info: (message: string, options?: ToastOptions) =>
    emit("info", message, options),
};

export { TOAST_EVENT };
