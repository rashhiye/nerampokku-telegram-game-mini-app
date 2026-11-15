// ==============================================================================
// TELEGRAM HAPTIC FEEDBACK WRAPPER
// File: frontend/src/telegram/haptics.ts
// ==============================================================================

type ImpactStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
type NotificationType = "error" | "success" | "warning";

export const haptics = {
  impact: (style: ImpactStyle = "medium") => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred(style);
      }
    } catch {
      // Ignore if not supported
    }
  },

  notification: (type: NotificationType = "success") => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred(type);
      }
    } catch {
      // Ignore
    }
  },

  selection: () => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.selectionChanged();
      }
    } catch {
      // Ignore
    }
  },
};
