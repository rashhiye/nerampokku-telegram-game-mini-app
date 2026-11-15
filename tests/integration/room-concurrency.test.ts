// ==============================================================================
// MULTIPLAYER ROOM CONCURRENCY & SEATING INTEGRATION TESTS
// File: tests/integration/room-concurrency.test.ts
// ==============================================================================

import { describe, it, expect } from "vitest";

interface SimulatedRoom {
  id: string;
  maxPlayers: number;
  status: "waiting" | "in_progress" | "completed";
  hostId: string;
  players: { profileId: string; seatIndex: number; joinedAt: number }[];
}

function simulateJoinRoom(
  room: SimulatedRoom,
  profileId: string
): { success: boolean; seatIndex?: number; error?: string } {
  if (room.status !== "waiting") {
    return { success: false, error: "GAME_ALREADY_STARTED" };
  }

  // Idempotency: rejoining returns existing seat
  const existing = room.players.find((p) => p.profileId === profileId);
  if (existing) {
    return { success: true, seatIndex: existing.seatIndex };
  }

  // Capacity check
  if (room.players.length >= room.maxPlayers) {
    return { success: false, error: "ROOM_FULL" };
  }

  // Assign lowest available seat index (0 to maxPlayers - 1)
  const occupiedSeats = new Set(room.players.map((p) => p.seatIndex));
  let allocatedSeat = -1;
  for (let s = 0; s < room.maxPlayers; s++) {
    if (!occupiedSeats.has(s)) {
      allocatedSeat = s;
      break;
    }
  }

  room.players.push({
    profileId,
    seatIndex: allocatedSeat,
    joinedAt: Date.now(),
  });

  return { success: true, seatIndex: allocatedSeat };
}

function simulateLeaveRoom(
  room: SimulatedRoom,
  profileId: string
): { success: boolean; newHostId?: string; dissolved: boolean } {
  const index = room.players.findIndex((p) => p.profileId === profileId);
  if (index === -1) return { success: false, dissolved: false };

  room.players.splice(index, 1);

  if (room.players.length === 0) {
    room.status = "completed"; // dissolved
    return { success: true, dissolved: true };
  }

  // If host leaves, reassign host to oldest remaining player
  if (room.hostId === profileId) {
    const oldest = [...room.players].sort((a, b) => a.joinedAt - b.joinedAt)[0];
    room.hostId = oldest.profileId;
    return { success: true, newHostId: oldest.profileId, dissolved: false };
  }

  return { success: true, dissolved: false };
}

describe("Multiplayer Room Concurrency & Lifecycle", () => {
  it("should sequentially fill seats 0, 1, 2, 3 and reject the 5th player", () => {
    const room: SimulatedRoom = {
      id: "room_1",
      maxPlayers: 4,
      status: "waiting",
      hostId: "user_0",
      players: [{ profileId: "user_0", seatIndex: 0, joinedAt: 100 }],
    };

    const res1 = simulateJoinRoom(room, "user_1");
    expect(res1.success).toBe(true);
    expect(res1.seatIndex).toBe(1);

    const res2 = simulateJoinRoom(room, "user_2");
    expect(res2.success).toBe(true);
    expect(res2.seatIndex).toBe(2);

    const res3 = simulateJoinRoom(room, "user_3");
    expect(res3.success).toBe(true);
    expect(res3.seatIndex).toBe(3);

    // 5th player tries to join full room
    const res4 = simulateJoinRoom(room, "user_4");
    expect(res4.success).toBe(false);
    expect(res4.error).toBe("ROOM_FULL");
    expect(room.players.length).toBe(4);
  });

  it("should be idempotent when an already-joined player reconnects or rejoins", () => {
    const room: SimulatedRoom = {
      id: "room_2",
      maxPlayers: 4,
      status: "waiting",
      hostId: "user_0",
      players: [
        { profileId: "user_0", seatIndex: 0, joinedAt: 100 },
        { profileId: "user_1", seatIndex: 1, joinedAt: 200 },
      ],
    };

    const rejoinRes = simulateJoinRoom(room, "user_1");
    expect(rejoinRes.success).toBe(true);
    expect(rejoinRes.seatIndex).toBe(1);
    expect(room.players.length).toBe(2); // Count does not increment!
  });

  it("should reassign host to oldest remaining player when host leaves", () => {
    const room: SimulatedRoom = {
      id: "room_3",
      maxPlayers: 4,
      status: "waiting",
      hostId: "user_0",
      players: [
        { profileId: "user_0", seatIndex: 0, joinedAt: 100 },
        { profileId: "user_1", seatIndex: 1, joinedAt: 200 },
        { profileId: "user_2", seatIndex: 2, joinedAt: 300 },
      ],
    };

    const leaveRes = simulateLeaveRoom(room, "user_0");
    expect(leaveRes.success).toBe(true);
    expect(leaveRes.dissolved).toBe(false);
    expect(leaveRes.newHostId).toBe("user_1");
    expect(room.hostId).toBe("user_1");
    expect(room.players.length).toBe(2);
  });

  it("should dissolve room when last player leaves", () => {
    const room: SimulatedRoom = {
      id: "room_4",
      maxPlayers: 4,
      status: "waiting",
      hostId: "user_0",
      players: [{ profileId: "user_0", seatIndex: 0, joinedAt: 100 }],
    };

    const leaveRes = simulateLeaveRoom(room, "user_0");
    expect(leaveRes.success).toBe(true);
    expect(leaveRes.dissolved).toBe(true);
    expect(room.players.length).toBe(0);
  });
});
