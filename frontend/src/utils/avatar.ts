// ==============================================================================
// AVATAR GENERATOR & RESOLVER
// File: frontend/src/utils/avatar.ts
// ==============================================================================

/**
 * Returns the player's custom avatar if provided, otherwise generates a unique,
 * handsome adventurer avatar seeded by their name or ID.
 * Prevents identical fallback profile photos across players.
 */
export function getPlayerAvatar(
  avatar?: string | null,
  name: string = "Player",
  id: string = "0"
): string {
  // If valid custom photo exists and is not the old hardcoded Unsplash placeholder
  if (
    avatar &&
    avatar.trim().length > 0 &&
    !avatar.includes("1535713875002") &&
    avatar.startsWith("http")
  ) {
    return avatar;
  }

  // Generate unique character per player
  const seed = encodeURIComponent(name || id || "Gamer");
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}
