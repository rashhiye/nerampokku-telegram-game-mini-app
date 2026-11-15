// ==============================================================================
// TELEGRAM INIT DATA CRYPTOGRAPHIC VALIDATOR
// File: supabase/functions/_shared/telegram.ts
// ==============================================================================

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface ValidatedInitData {
  query_id?: string;
  user: TelegramUser;
  auth_date: number;
  hash: string;
  chat_type?: string;
  chat_instance?: string;
  start_param?: string;
}

/**
 * Validates Telegram Mini App initData using HMAC-SHA256 according to Telegram specifications.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export async function validateTelegramInitData(
  initDataRaw: string,
  botToken: string
): Promise<{ valid: boolean; data?: ValidatedInitData; error?: string }> {
  try {
    if (!initDataRaw) {
      return { valid: false, error: "Missing initData" };
    }

    const params = new URLSearchParams(initDataRaw);
    const hash = params.get("hash");
    if (!hash) {
      return { valid: false, error: "Missing hash parameter" };
    }

    // Check auth_date freshness (expire after 24 hours = 86400 seconds)
    const authDateStr = params.get("auth_date");
    if (!authDateStr) {
      return { valid: false, error: "Missing auth_date" };
    }
    const authDate = parseInt(authDateStr, 10);
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (nowInSeconds - authDate > 86400) {
      return { valid: false, error: "initData has expired (> 24 hours)" };
    }

    // Build data-check-string by removing hash and sorting keys
    const items: string[] = [];
    params.delete("hash");
    const sortedKeys = Array.from(params.keys()).sort();
    for (const key of sortedKeys) {
      items.push(`${key}=${params.get(key)}`);
    }
    const dataCheckString = items.join("\n");

    // Crypto operations:
    // secret_key = HMAC_SHA256("WebAppData", botToken)
    const encoder = new TextEncoder();
    const webAppDataKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode("WebAppData"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const secretKeyBuffer = await crypto.subtle.sign(
      "HMAC",
      webAppDataKey,
      encoder.encode(botToken)
    );

    const secretKey = await crypto.subtle.importKey(
      "raw",
      secretKeyBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    // calculated_hash = HMAC_SHA256(secret_key, dataCheckString)
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      secretKey,
      encoder.encode(dataCheckString)
    );

    // Convert signature to hex
    const calculatedHash = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (calculatedHash.toLowerCase() !== hash.toLowerCase()) {
      return { valid: false, error: "Cryptographic signature mismatch" };
    }

    // Parse user object
    const userStr = params.get("user");
    if (!userStr) {
      return { valid: false, error: "Missing user object in initData" };
    }
    const user: TelegramUser = JSON.parse(userStr);

    return {
      valid: true,
      data: {
        query_id: params.get("query_id") || undefined,
        user,
        auth_date: authDate,
        hash,
        chat_type: params.get("chat_type") || undefined,
        chat_instance: params.get("chat_instance") || undefined,
        start_param: params.get("start_param") || undefined,
      },
    };
  } catch (err: any) {
    return { valid: false, error: err.message || "Validation exception" };
  }
}
