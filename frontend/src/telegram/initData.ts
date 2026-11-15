// ==============================================================================
// TELEGRAM MINI APP CLIENT SDK WRAPPER
// File: frontend/src/telegram/initData.ts
// ==============================================================================

export interface TelegramProfile {
  id: string; // uuid
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export interface TelegramLaunchContext {
  isTelegram: boolean;
  initDataRaw: string;
  user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  };
  chatType?: string;
  chatInstance?: string;
  startParam?: string; // e.g. "g_-100123456"
}

// Default fallback mock profile for local browser development
export const MOCK_TELEGRAM_USERS = [
  {
    id: 100000001,
    first_name: "Alex",
    last_name: "Vance",
    username: "alex_gamer",
    photo_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80",
  },
  {
    id: 100000002,
    first_name: "Sarah",
    last_name: "Connor",
    username: "sarah_p",
    photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
  },
  {
    id: 100000003,
    first_name: "Thomas",
    last_name: "Anderson",
    username: "neo_matrix",
    photo_url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80",
  },
  {
    id: 100000004,
    first_name: "Elena",
    last_name: "Rostova",
    username: "elena_r",
    photo_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&h=120&q=80",
  },
];

/**
 * Returns the Telegram Mini App context, automatically detecting real Telegram or local mock.
 */
export function getTelegramLaunchContext(): TelegramLaunchContext {
  const tg = (typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null);

  // Extract startParam from all possible sources (Telegram WebApp API, URL query, URL hash)
  let detectedStartParam: string | undefined = undefined;

  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const hashClean = window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hashClean);

    detectedStartParam =
      tg?.initDataUnsafe?.start_param ||
      urlParams.get("tgWebAppStartParam") ||
      urlParams.get("startapp") ||
      hashParams.get("tgWebAppStartParam") ||
      hashParams.get("startapp") ||
      undefined;
  }

  if (tg && (tg.initData || tg.initDataUnsafe?.user)) {
    // Running inside official Telegram client
    try {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation?.();
    } catch (e) {
      console.warn("Telegram WebApp API initialization notice:", e);
    }

    const u = tg.initDataUnsafe?.user;
    if (u) {
      return {
        isTelegram: true,
        initDataRaw: tg.initData || "",
        user: {
          id: u.id,
          first_name: u.first_name || "Player",
          last_name: u.last_name,
          username: u.username,
          photo_url: u.photo_url,
        },
        chatType: tg.initDataUnsafe?.chat_type,
        chatInstance: tg.initDataUnsafe?.chat_instance,
        startParam: detectedStartParam,
      };
    }
  }

  // Running in external browser or dev testing
  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const mockUserIndex = parseInt(urlParams.get("user") || "0", 10) % MOCK_TELEGRAM_USERS.length;
  const mockUser = MOCK_TELEGRAM_USERS[mockUserIndex] || MOCK_TELEGRAM_USERS[0];

  return {
    isTelegram: false,
    initDataRaw: `mock_init_data=true&user_id=${mockUser.id}`,
    user: mockUser,
    chatType: "supergroup",
    chatInstance: "mock_chat_instance_123",
    startParam: detectedStartParam,
  };
}
