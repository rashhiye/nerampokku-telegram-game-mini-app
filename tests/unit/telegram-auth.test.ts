// ==============================================================================
// TELEGRAM AUTHENTICATION UNIT TESTS
// File: tests/unit/telegram-auth.test.ts
// ==============================================================================

import { describe, it, expect } from "vitest";
import { validateTelegramInitData } from "../../supabase/functions/_shared/telegram";
import * as crypto from "crypto";

/**
 * Helper to construct valid signed Telegram initData strings in test environment
 */
function createSignedInitData(
  userObj: object,
  botToken: string,
  authDateOffsetSeconds = 0,
  extraParams: Record<string, string> = {}
): string {
  const authDate = Math.floor(Date.now() / 1000) + authDateOffsetSeconds;
  const userJson = JSON.stringify(userObj);

  const params: Record<string, string> = {
    auth_date: authDate.toString(),
    user: userJson,
    ...extraParams,
  };

  // Sort keys alphabetically
  const dataCheckString = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("\n");

  // secret_key = HMAC_SHA256("WebAppData", botToken)
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  // hash = HMAC_SHA256(secret_key, dataCheckString)
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const searchParams = new URLSearchParams(params);
  searchParams.set("hash", hash);
  return searchParams.toString();
}

describe("Telegram Authentication Validator", () => {
  const TEST_BOT_TOKEN = "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ";
  const TEST_USER = {
    id: 987654321,
    first_name: "Rashid",
    username: "rashid_dev",
  };

  it("should validate a genuine Telegram initData string and parse the user", async () => {
    const validInitData = createSignedInitData(TEST_USER, TEST_BOT_TOKEN, 0, {
      chat_type: "group",
      start_param: "g_-100123456",
    });

    const result = await validateTelegramInitData(validInitData, TEST_BOT_TOKEN);
    expect(result.valid).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.user.id).toBe(987654321);
    expect(result.data?.user.first_name).toBe("Rashid");
    expect(result.data?.chat_type).toBe("group");
    expect(result.data?.start_param).toBe("g_-100123456");
  });

  it("should reject initData if the signature has been tampered with", async () => {
    const validInitData = createSignedInitData(TEST_USER, TEST_BOT_TOKEN);
    // Tamper with user id
    const tamperedInitData = validInitData.replace("987654321", "111111111");

    const result = await validateTelegramInitData(tamperedInitData, TEST_BOT_TOKEN);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Cryptographic signature mismatch");
  });

  it("should reject initData signed with a different bot token", async () => {
    const validInitData = createSignedInitData(TEST_USER, "DIFFERENT_BOT_TOKEN");
    const result = await validateTelegramInitData(validInitData, TEST_BOT_TOKEN);
    expect(result.valid).toBe(false);
  });

  it("should reject expired initData (> 24 hours old)", async () => {
    // 25 hours ago = -90000 seconds
    const expiredInitData = createSignedInitData(TEST_USER, TEST_BOT_TOKEN, -90000);
    const result = await validateTelegramInitData(expiredInitData, TEST_BOT_TOKEN);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("expired");
  });
});
