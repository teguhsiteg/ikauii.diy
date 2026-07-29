"use client";

import { useEffect, useState, useCallback } from "react";
import { TOAST_EVENT, ToastPayload, ToastType } from "@/lib/toast";

// ---- Warna & Ikon per tipe ----
const CONFIG: Record<
  ToastType,
  { bg: string; border: string; iconBg: string; text: string; icon: React.ReactNode }
> = {
  success: {
    bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    border: "#22c55e",
    iconBg: "#16a34a",
    text: "#166534",
    icon: (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  error: {
    bg: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
    border: "#ef4444",
    iconBg: "#dc2626",
    text: "#991b1b",
    icon: (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M3 3l6 6M9 3l-6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  warning: {
    bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    border: "#f59e0b",
    iconBg: "#d97706",
    text: "#92400e",
    icon: (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 4v3M6 8.5v.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  info: {
    bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    border: "#3b82f6",
    iconBg: "#2563eb",
    text: "#1e40af",
    icon: (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 5v4M6 3.5V3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
};

// ---- Single Toast Item ----
function ToastItem({
  item,
  onClose,
}: {
  item: ToastPayload;
  onClose: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const cfg = CONFIG[item.type];

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => onClose(item.id), 320);
  }, [item.id, onClose]);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 10);
    const hideTimer = setTimeout(close, item.duration);

    // Progress bar update
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / item.duration) * 100);
      setProgress(pct);
      if (pct <= 0) clearInterval(interval);
    }, 50);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearInterval(interval);
    };
  }, [item.duration, close]);

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "14px 16px 16px 16px",
        background: cfg.bg,
        border: `1px solid ${cfg.border}40`,
        borderLeft: `4px solid ${cfg.border}`,
        borderRadius: "14px",
        boxShadow: `0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.05), 0 0 0 1px ${cfg.border}20`,
        minWidth: "300px",
        maxWidth: "420px",
        overflow: "hidden",
        transform: visible ? "translateX(0) scale(1)" : "translateX(130%) scale(0.95)",
        opacity: visible ? 1 : 0,
        transition:
          "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease",
        fontFamily: "'Inter', 'Geist Sans', system-ui, -apple-system, sans-serif",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: cfg.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "1px",
          boxShadow: `0 2px 6px ${cfg.border}40`,
        }}
      >
        {cfg.icon}
      </div>

      {/* Message */}
      <p
        style={{
          margin: 0,
          fontSize: "14px",
          lineHeight: "1.55",
          color: cfg.text,
          fontWeight: "500",
          flex: 1,
          wordBreak: "break-word",
        }}
      >
        {item.message}
      </p>

      {/* Close button */}
      <button
        onClick={close}
        aria-label="Tutup notifikasi"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#9ca3af",
          fontSize: "18px",
          lineHeight: 1,
          padding: "0",
          marginLeft: "4px",
          flexShrink: 0,
          borderRadius: "4px",
          transition: "color 0.15s",
          display: "flex",
          alignItems: "center",
        }}
        onMouseOver={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.color = "#6b7280")
        }
        onMouseOut={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.color = "#9ca3af")
        }
      >
        ×
      </button>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "3px",
          width: `${progress}%`,
          background: cfg.border,
          borderRadius: "0 0 0 14px",
          transition: "width 0.05s linear",
          opacity: 0.6,
        }}
      />
    </div>
  );
}

// ---- Toast Container (dipasang di root layout) ----
export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const payload = (e as CustomEvent).detail as ToastPayload;
      setToasts((prev) => {
        // Maks 5 toast sekaligus
        const updated = prev.length >= 5 ? prev.slice(1) : prev;
        return [...updated, payload];
      });
    };

    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifikasi"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        alignItems: "flex-end",
        pointerEvents: "none",
      }}
    >
      {toasts.map((item) => (
        <div key={item.id} style={{ pointerEvents: "auto" }}>
          <ToastItem item={item} onClose={removeToast} />
        </div>
      ))}
    </div>
  );
}
