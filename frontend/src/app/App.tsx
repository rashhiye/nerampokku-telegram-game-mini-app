// ==============================================================================
// നേരംപോക്ക്: MAIN APPLICATION CONTROLLER
// File: frontend/src/app/App.tsx
// ==============================================================================

import React, { useState, useEffect, useRef } from "react";
import { getTelegramLaunchContext, MOCK_TELEGRAM_USERS } from "../telegram/initData";
import { LobbyBrowser } from "../multiplayer/LobbyBrowser";
import { WaitingRoom } from "../multiplayer/WaitingRoom";
import { UnoTable } from "../games/uno/components/UnoTable";
import { LudoTable } from "../games/ludo/components/LudoTable";
import { InGameChat } from "../chat/InGameChat";
import { ProfileView } from "../profiles/ProfileView";
import { LeaderboardView, LeaderboardEntry } from "../leaderboard/LeaderboardView";
import { GameSessionInfo, SessionPlayerInfo, GameType } from "../multiplayer/types";
import { ChatMessage, QuickReactionEvent } from "../chat/types";
import { UnoGameState, CardColor } from "../games/uno/engine/types";
import { LudoGameState } from "../games/ludo/engine/types";
import { createUnoGame, applyUnoAction } from "../games/uno/engine/unoEngine";
import { createLudoGame, applyLudoAction } from "../games/ludo/engine/ludoEngine";
import { supabase } from "../services/supabase";
import { Home, Trophy, User, HelpCircle } from "lucide-react";
import { haptics } from "../telegram/haptics";
import { getPlayerAvatar } from "../utils/avatar";

type AppScreen = "lobby" | "waiting" | "game_uno" | "game_ludo" | "profile" | "leaderboard" | "help";

export const App: React.FC = () => {
  const [context, setContext] = useState(getTelegramLaunchContext());
  const [screen, setScreen] = useState<AppScreen>("lobby");
  const [currentUserIndex, setCurrentUserIndex] = useState(0);

  // Authenticated Supabase profile & group context
  const [profileId, setProfileId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupTitle, setGroupTitle] = useState<string>("Group Lobby");

  // Active Session state
  const [currentSession, setCurrentSession] = useState<GameSessionInfo | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<SessionPlayerInfo[]>([]);
  const [mySeatIndex, setMySeatIndex] = useState<number>(0);

  // Active Game State
  const [unoState, setUnoState] = useState<UnoGameState | null>(null);
  const [ludoState, setLudoState] = useState<LudoGameState | null>(null);

  // Real-time Chat & Reactions
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [floatingReactions, setFloatingReactions] = useState<QuickReactionEvent[]>([]);

  // Real-time In-Game Speech Bubbles (Seat index -> { text, expiresAt })
  const [speechBubbles, setSpeechBubbles] = useState<Record<number, { text: string; expiresAt: number }>>({});

  // Auto-expire speech bubbles after 4.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setSpeechBubbles((prev) => {
        let hasExpired = false;
        const next = { ...prev };
        for (const seatStr in next) {
          if (next[Number(seatStr)]?.expiresAt <= now) {
            delete next[Number(seatStr)];
            hasExpired = true;
          }
        }
        return hasExpired ? next : prev;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Lobby Sessions
  const [sessions, setSessions] = useState<GameSessionInfo[]>([]);

  // Real Leaderboards & Profile Stats
  const [unoLeaderboard, setUnoLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [ludoLeaderboard, setLudoLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState({
    uno: { played: 0, wins: 0, losses: 0, winRate: 0 },
    ludo: { played: 0, wins: 0, losses: 0, winRate: 0 },
  });

  const roomChannelRef = useRef<any>(null);

  // ----------------------------------------------------------------------------
  // 1. Initialize Profile & Real Group Context from Telegram
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const initProfileAndGroup = async () => {
      try {
        // 1. Sync User Profile to Supabase (Safe select first to honor RLS policies)
        let resolvedProfileId: string;
        const { data: existingProf } = await supabase
          .from("profiles")
          .select("id")
          .eq("telegram_id", context.user.id)
          .maybeSingle();

        if (existingProf) {
          resolvedProfileId = existingProf.id;
          setProfileId(existingProf.id);

          // Update user photo and details in Supabase
          if (context.user.photo_url || context.user.first_name) {
            await supabase
              .from("profiles")
              .update({
                first_name: context.user.first_name,
                last_name: context.user.last_name || null,
                username: context.user.username || null,
                photo_url: context.user.photo_url || null,
                last_seen_at: new Date().toISOString(),
              })
              .eq("id", existingProf.id);
          }
        } else {
          const { data: newProf, error: insErr } = await supabase
            .from("profiles")
            .insert({
              telegram_id: context.user.id,
              username: context.user.username || null,
              first_name: context.user.first_name,
              last_name: context.user.last_name || null,
              photo_url: context.user.photo_url || null,
              last_seen_at: new Date().toISOString(),
            })
            .select("id")
            .maybeSingle();

          if (newProf && !insErr) {
            resolvedProfileId = newProf.id;
            setProfileId(newProf.id);
          } else {
            const padded = Math.abs(context.user.id).toString().padStart(12, "0").slice(-12);
            resolvedProfileId = `00000000-0000-4000-a000-${padded}`;
            setProfileId(resolvedProfileId);
          }
        }

        // 2. Resolve Real Telegram Group Name
        const tgChat = (window as any).Telegram?.WebApp?.initDataUnsafe?.chat;
        let detectedTitle = tgChat?.title || null;
        let detectedGroupId: string | null = null;

        const startParam = context.startParam || "";
        const gMatch = startParam.match(/g_(-?\d+)/);
        const sMatch = startParam.match(/(?:_s_|s_)([a-f0-9\-]+)/);
        const targetChatId = gMatch ? gMatch[1] : tgChat?.id ? tgChat.id.toString() : null;

        if (targetChatId) {
          // Look up verified group name stored by bot update
          const { data: grp } = await supabase
            .from("telegram_groups")
            .select("id, title")
            .eq("telegram_chat_id", targetChatId)
            .maybeSingle();

          if (grp) {
            detectedTitle = grp.title;
            detectedGroupId = grp.id;
          } else {
            const initialTitle = detectedTitle || "Telegram Group";
            const { data: newGrp } = await supabase
              .from("telegram_groups")
              .insert({
                telegram_chat_id: targetChatId,
                title: initialTitle,
                chat_type: "group",
              })
              .select("id, title")
              .maybeSingle();
            if (newGrp) {
              detectedGroupId = newGrp.id;
              detectedTitle = newGrp.title;
            }
          }
        } else if (sMatch) {
          // Joined via direct session invite link -> resolve session and its group
          const { data: sessRow } = await supabase
            .from("game_sessions")
            .select("group_id, telegram_groups(id, title)")
            .eq("id", sMatch[1])
            .maybeSingle();

          if (sessRow) {
            detectedGroupId = sessRow.group_id;
            detectedTitle = (sessRow as any).telegram_groups?.title || "Match Lobby";
          }
        }

        if (detectedTitle) {
          setGroupTitle(detectedTitle);
        } else {
          setGroupTitle("Community Lobby");
        }

        if (detectedGroupId) {
          setGroupId(detectedGroupId);
        }

        // 3. Direct Join via Invite Link (?startapp=s_uuid or legacy ?startapp=g_xxx_s_uuid)
        if (sMatch) {
          const directSessionId = sMatch[1];
          await handleJoinSession(directSessionId, resolvedProfileId);
        }

        // 4. Fetch Stats & Leaderboard
        fetchUserStats(resolvedProfileId);
        fetchLeaderboards();
      } catch (err) {
        console.warn("Supabase profile/group sync error:", err);
      }
    };

    initProfileAndGroup();
  }, [context.user.id, context.startParam]);

  // ----------------------------------------------------------------------------
  // 2. Fetch Sessions for Lobby (Real-Time Synchronized)
  // ----------------------------------------------------------------------------
  const fetchSessions = async () => {
    try {
      let query = supabase
        .from("game_sessions")
        .select(
          `id, group_id, game_type, status, host_id, min_players, max_players, current_player_count, created_at,
           profiles!game_sessions_host_id_fkey(first_name),
           telegram_groups(title)`
        )
        .eq("status", "waiting")
        .order("created_at", { ascending: false });

      if (groupId) {
        query = query.eq("group_id", groupId);
      }

      const { data, error } = await query;
      if (data && !error) {
        const mapped: GameSessionInfo[] = data.map((row: any) => ({
          id: row.id,
          groupId: row.group_id,
          groupTitle: row.telegram_groups?.title || groupTitle,
          gameType: row.game_type,
          status: row.status,
          hostId: row.host_id,
          hostName: row.profiles?.first_name || "Host",
          minPlayers: row.min_players,
          maxPlayers: row.max_players,
          currentPlayerCount: row.current_player_count,
          createdAt: row.created_at,
        }));
        setSessions(mapped);
      }
    } catch (e) {
      console.warn("fetchSessions error:", e);
    }
  };

  useEffect(() => {
    fetchSessions();

    const channel = supabase
      .channel("public_game_sessions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_sessions" },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, groupTitle]);

  // ----------------------------------------------------------------------------
  // 3. Real-Time Room & In-Game Synchronization
  // ----------------------------------------------------------------------------
  const fetchRoomPlayers = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from("game_players")
        .select("id, profile_id, seat_index, status, profiles(first_name, username, photo_url)")
        .eq("session_id", sessionId)
        .order("seat_index", { ascending: true });

      if (data && !error) {
        const activeProf = profileId || context.user.id.toString();
        const mapped: SessionPlayerInfo[] = data.map((p: any) => {
          const isCurrentUser = p.profile_id === activeProf;
          const rawPhoto = (isCurrentUser && context.user.photo_url)
            ? context.user.photo_url
            : p.profiles?.photo_url;
          const playerName = p.profiles?.first_name || (isCurrentUser ? context.user.first_name : "Player");

          return {
            id: p.id,
            profileId: p.profile_id,
            name: playerName,
            username: p.profiles?.username || undefined,
            avatar: getPlayerAvatar(rawPhoto, playerName, p.profile_id),
            seatIndex: p.seat_index,
            isHost: p.seat_index === 0,
            status: p.status,
          };
        });

        setRoomPlayers(mapped);

        // Update my seat
        const me = mapped.find((p) => p.profileId === activeProf);
        if (me) {
          setMySeatIndex(me.seatIndex);
        }
      }
    } catch (e) {
      console.warn("fetchRoomPlayers error:", e);
    }
  };

  const fetchGameState = async (sessionId: string) => {
    try {
      const { data } = await supabase
        .from("game_states")
        .select("public_state")
        .eq("session_id", sessionId)
        .single();

      if (data?.public_state) {
        if (currentSession?.gameType === "uno") {
          setUnoState(data.public_state);
          setScreen("game_uno");
        } else {
          setLudoState(data.public_state);
          setScreen("game_ludo");
        }
      }
    } catch (e) {
      console.warn("fetchGameState error:", e);
    }
  };

  // Broadcast helper to notify room participants instantly
  const broadcastRoomUpdate = () => {
    if (roomChannelRef.current) {
      try {
        roomChannelRef.current.send({
          type: "broadcast",
          event: "room_update",
          payload: { timestamp: Date.now() },
        });
      } catch (err) {
        // Safe ignore
      }
    }
  };

  // Active room player poller while in waiting room (guarantees host & guests stay in sync)
  useEffect(() => {
    if (screen === "waiting" && currentSession) {
      const pollTimer = setInterval(() => {
        fetchRoomPlayers(currentSession.id);
      }, 1500);
      return () => clearInterval(pollTimer);
    }
  }, [screen, currentSession?.id]);

  // Lobby sessions poller
  useEffect(() => {
    if (screen === "lobby") {
      const pollTimer = setInterval(() => {
        fetchSessions();
      }, 3000);
      return () => clearInterval(pollTimer);
    }
  }, [screen, groupId]);

  useEffect(() => {
    if (!currentSession) return;

    fetchRoomPlayers(currentSession.id);

    // Channel for room players, game states, and chat
    const channel = supabase
      .channel(`room_${currentSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_players",
          filter: `session_id=eq.${currentSession.id}`,
        },
        () => {
          fetchRoomPlayers(currentSession.id);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${currentSession.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            if (payload.new.status === "in_progress") {
              // Host started match -> transition everyone to game!
              fetchGameState(currentSession.id);
            } else if (payload.new.status === "abandoned" || payload.new.status === "cancelled") {
              // Room was disbanded or closed
              setCurrentSession(null);
              setUnoState(null);
              setLudoState(null);
              setRoomPlayers([]);
              setScreen("lobby");
              fetchSessions();
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_states",
          filter: `session_id=eq.${currentSession.id}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.public_state) {
            const next = payload.new.public_state;
            if (currentSession.gameType === "uno") {
              setUnoState(next);
              setScreen("game_uno");
            } else {
              setLudoState(next);
              setScreen("game_ludo");
            }
          }
        }
      )
      // ZERO-LAG REALTIME BROADCAST GAME STATE (Sub-50ms peer turn sync)
      .on("broadcast", { event: "game_state" }, (payload: any) => {
        if (payload.payload && payload.payload.state) {
          const next = payload.payload.state;
          if (currentSession.gameType === "uno") {
            setUnoState(next);
            setScreen("game_uno");
          } else {
            setLudoState(next);
            setScreen("game_ludo");
          }
        }
      })
      // IN-GAME SPEECH BUBBLE & INSTANT CHAT BROADCAST
      .on("broadcast", { event: "chat_bubble" }, (payload: any) => {
        if (payload.payload) {
          const { seatIndex, text, message } = payload.payload;
          if (typeof seatIndex === "number" && text) {
            setSpeechBubbles((prev) => ({
              ...prev,
              [seatIndex]: { text, expiresAt: Date.now() + 4500 },
            }));
          }
          if (message && message.senderId !== (profileId || context.user.id.toString())) {
            setChatMessages((prev) => {
              if (prev.some((m) => m.id === message.id)) return prev;
              return [...prev, message];
            });
          }
        }
      })
      // PLAYER LEFT EVENT (Notification & Auto-advance turn)
      .on("broadcast", { event: "player_left" }, (payload: any) => {
        const leftSeat = payload?.payload?.seatIndex;
        haptics.notification("warning");
        if (typeof leftSeat === "number") {
          // Advance turn if it was departed player's turn
          setUnoState((prev) => {
            if (!prev) return null;
            if (prev.currentTurnSeat === leftSeat) {
              const nextTurn =
                (prev.currentTurnSeat +
                  (prev.direction === 1 ? 1 : prev.playerCount - 1)) %
                prev.playerCount;
              return { ...prev, currentTurnSeat: nextTurn };
            }
            return prev;
          });

          setLudoState((prev) => {
            if (!prev) return null;
            if (prev.currentTurnSeat === leftSeat) {
              const nextTurn = (prev.currentTurnSeat + 1) % prev.playerCount;
              return {
                ...prev,
                currentTurnSeat: nextTurn,
                turnPhase: "ROLL",
                currentRoll: null,
                remainingMoves: [],
              };
            }
            return prev;
          });
        }
        fetchRoomPlayers(currentSession.id);
      })
      // ROOM CLOSED BY HOST EVENT
      .on("broadcast", { event: "room_closed" }, (payload: any) => {
        const hostName = payload?.payload?.hostName || "The host";
        alert(`Room was closed by ${hostName}. Returning to Lobby.`);
        setCurrentSession(null);
        setUnoState(null);
        setLudoState(null);
        setRoomPlayers([]);
        setScreen("lobby");
        fetchSessions();
      })
      .on("broadcast", { event: "room_update" }, () => {
        fetchRoomPlayers(currentSession.id);
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${currentSession.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            const msg: ChatMessage = {
              id: payload.new.id,
              sessionId: payload.new.session_id,
              senderId: payload.new.sender_id,
              senderName: payload.new.sender_name || "Player",
              senderAvatar: payload.new.sender_avatar,
              content: payload.new.content,
              createdAt: payload.new.created_at,
            };
            setChatMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        }
      )
      .on("broadcast", { event: "quick_reaction" }, (payload: any) => {
        if (payload.payload) {
          setFloatingReactions((prev) => [...prev, payload.payload]);
          setTimeout(() => {
            setFloatingReactions((prev) => prev.filter((r) => r.id !== payload.payload.id));
          }, 2500);
        }
      })
      .subscribe();

    roomChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSession?.id, profileId]);

  // ----------------------------------------------------------------------------
  // 4. Create Match
  // ----------------------------------------------------------------------------
  const handleCreateSession = async (
    gameType: GameType,
    maxPlayers: number,
    rules: any
  ) => {
    try {
      let targetGroupId = groupId;
      if (!targetGroupId) {
        // Fallback to shared Community Lobby group
        const { data: comm } = await supabase
          .from("telegram_groups")
          .select("id")
          .eq("telegram_chat_id", 0)
          .maybeSingle();

        if (comm) {
          targetGroupId = comm.id;
        } else {
          const { data: newComm } = await supabase
            .from("telegram_groups")
            .insert({
              telegram_chat_id: 0,
              title: "Community Lobby",
              chat_type: "group",
            })
            .select("id")
            .maybeSingle();
          if (newComm) targetGroupId = newComm.id;
        }
      }

      const activeProf = profileId || context.user.id.toString();
      if (!targetGroupId) return;

      // 1. Insert session row
      const { data: newSession, error: sErr } = await supabase
        .from("game_sessions")
        .insert({
          group_id: targetGroupId,
          game_type: gameType,
          status: "waiting",
          host_id: activeProf,
          min_players: gameType === "ludo" ? 4 : 3,
          max_players: maxPlayers,
          current_player_count: 1,
        })
        .select()
        .single();

      if (sErr || !newSession) throw sErr;

      // 2. Insert host into game_players at seat 0
      await supabase.from("game_players").insert({
        session_id: newSession.id,
        profile_id: activeProf,
        seat_index: 0,
        status: "waiting",
      });

      const sessionInfo: GameSessionInfo = {
        id: newSession.id,
        groupId: targetGroupId,
        groupTitle: groupTitle,
        gameType,
        status: "waiting",
        hostId: activeProf,
        hostName: context.user.first_name,
        minPlayers: newSession.min_players,
        maxPlayers: newSession.max_players,
        currentPlayerCount: 1,
        createdAt: newSession.created_at,
      };

      setCurrentSession(sessionInfo);
      setMySeatIndex(0);
      setRoomPlayers([
        {
          id: `p_${activeProf}`,
          profileId: activeProf,
          name: context.user.first_name,
          username: context.user.username,
          avatar: getPlayerAvatar(context.user.photo_url, context.user.first_name, activeProf),
          seatIndex: 0,
          isHost: true,
          status: "waiting",
        },
      ]);
      setScreen("waiting");
    } catch (err: any) {
      console.error("Create session error:", err.message);
    }
  };

  // ----------------------------------------------------------------------------
  // 5. Join Match (Atomic via Supabase join_game_session)
  // ----------------------------------------------------------------------------
  const handleJoinSession = async (sessionId: string, explicitProfileId?: string) => {
    const activeProf = explicitProfileId || profileId || context.user.id.toString();

    let session = sessions.find((s) => s.id === sessionId);
    if (!session) {
      const { data: sData } = await supabase
        .from("game_sessions")
        .select("*, telegram_groups(title), profiles!game_sessions_host_id_fkey(first_name)")
        .eq("id", sessionId)
        .single();

      if (sData) {
        session = {
          id: sData.id,
          groupId: sData.group_id,
          groupTitle: sData.telegram_groups?.title || groupTitle,
          gameType: sData.game_type,
          status: sData.status,
          hostId: sData.host_id,
          hostName: sData.profiles?.first_name || "Host",
          minPlayers: sData.min_players,
          maxPlayers: sData.max_players,
          currentPlayerCount: sData.current_player_count,
          createdAt: sData.created_at,
        };
      }
    }

    if (!session) return;
    setCurrentSession(session);

    try {
      // Call Supabase atomic RPC join_game_session
      const { data: joinRes, error: rpcErr } = await supabase.rpc("join_game_session", {
        p_session_id: sessionId,
        p_profile_id: activeProf,
      });

      if (joinRes && joinRes.success) {
        setMySeatIndex(joinRes.seat_index);
      } else if (rpcErr) {
        // Fallback insert if RPC not present
        const { data: existingP } = await supabase
          .from("game_players")
          .select("seat_index")
          .eq("session_id", sessionId)
          .eq("profile_id", activeProf)
          .single();

        if (existingP) {
          setMySeatIndex(existingP.seat_index);
        } else {
          const { count } = await supabase
            .from("game_players")
            .select("*", { count: "exact", head: true })
            .eq("session_id", sessionId);

          const newSeat = count || 0;
          if (newSeat < session.maxPlayers) {
            await supabase.from("game_players").insert({
              session_id: sessionId,
              profile_id: activeProf,
              seat_index: newSeat,
              status: "waiting",
            });
            setMySeatIndex(newSeat);
          }
        }
      }

      await fetchRoomPlayers(sessionId);
      broadcastRoomUpdate();
      setScreen("waiting");
    } catch (err: any) {
      console.error("Join session error:", err.message);
    }
  };

  // Leave room or match
  const handleLeaveRoom = async () => {
    if (currentSession) {
      const activeProf = profileId || context.user.id.toString();
      try {
        if (roomChannelRef.current) {
          try {
            roomChannelRef.current.send({
              type: "broadcast",
              event: "player_left",
              payload: { seatIndex: mySeatIndex, playerName: context.user.first_name },
            });
          } catch (e) {
            // safe ignore
          }
        }
        await supabase
          .from("game_players")
          .delete()
          .eq("session_id", currentSession.id)
          .eq("profile_id", activeProf);
        broadcastRoomUpdate();
      } catch (e) {
        console.warn("Leave room error:", e);
      }
    }
    setCurrentSession(null);
    setUnoState(null);
    setLudoState(null);
    setRoomPlayers([]);
    setScreen("lobby");
    fetchSessions();
  };

  // Host Close & Disband Entire Room
  const handleCloseRoom = async () => {
    if (!currentSession) return;
    try {
      if (roomChannelRef.current) {
        try {
          roomChannelRef.current.send({
            type: "broadcast",
            event: "room_closed",
            payload: { hostName: context.user.first_name },
          });
        } catch (e) {
          // safe ignore
        }
      }

      await supabase
        .from("game_sessions")
        .update({ status: "abandoned" })
        .eq("id", currentSession.id);

      await supabase
        .from("game_players")
        .delete()
        .eq("session_id", currentSession.id);

      broadcastRoomUpdate();
    } catch (e) {
      console.warn("handleCloseRoom error:", e);
    }

    setCurrentSession(null);
    setUnoState(null);
    setLudoState(null);
    setRoomPlayers([]);
    setScreen("lobby");
    fetchSessions();
  };

  // Optional: Host can add a bot player for testing
  const handleAddBot = async () => {
    if (!currentSession || roomPlayers.length >= currentSession.maxPlayers) return;
    const botIdx = roomPlayers.length;
    const botNames = ["Bot Chandu", "Bot Appu", "Bot Malu", "Bot Raju", "Bot Dasan"];

    try {
      // Insert bot into Supabase profiles & game_players
      const botTgId = 999900000 + botIdx;
      const { data: botProf } = await supabase
        .from("profiles")
        .upsert(
          {
            telegram_id: botTgId,
            first_name: botNames[botIdx - 1] || `Bot ${botIdx}`,
            username: `bot_${botIdx}`,
            photo_url: `https://api.dicebear.com/7.x/bottts/svg?seed=bot_${botIdx}`,
          },
          { onConflict: "telegram_id" }
        )
        .select("id")
        .single();

      if (botProf) {
        await supabase.from("game_players").insert({
          session_id: currentSession.id,
          profile_id: botProf.id,
          seat_index: botIdx,
          status: "waiting",
        });
        broadcastRoomUpdate();
      }
    } catch (e) {
      // Fallback local
      const newBot: SessionPlayerInfo = {
        id: `bot_${botIdx}_${Date.now()}`,
        profileId: `bot_${botIdx}`,
        name: botNames[botIdx - 1] || `Bot ${botIdx}`,
        username: `bot_${botIdx}`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=bot_${botIdx}`,
        seatIndex: botIdx,
        isHost: false,
        status: "waiting",
      };
      setRoomPlayers((prev) => [...prev, newBot]);
    }
    haptics.impact("light");
  };

  // ----------------------------------------------------------------------------
  // 6. Start Match (Synchronized across all participants)
  // ----------------------------------------------------------------------------
  const handleStartMatch = async () => {
    if (!currentSession) return;
    haptics.notification("success");

    let initialGame: any;
    if (currentSession.gameType === "uno") {
      initialGame = createUnoGame(roomPlayers.length);
      setUnoState(initialGame);
      setScreen("game_uno");
    } else {
      const pCount = (
        roomPlayers.length >= 6 ? 6 : roomPlayers.length === 5 ? 5 : 4
      ) as 4 | 5 | 6;
      initialGame = createLudoGame(pCount);
      setLudoState(initialGame);
      setScreen("game_ludo");
    }

    try {
      // 1. Upload initial authoritative game state snapshot to Supabase
      await supabase.from("game_states").upsert(
        {
          session_id: currentSession.id,
          public_state: initialGame,
          version: 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_id" }
      );

      // 2. Transition game session to in_progress (triggers Realtime on all players' phones)
      await supabase
        .from("game_sessions")
        .update({ status: "in_progress", started_at: new Date().toISOString() })
        .eq("id", currentSession.id);
    } catch (err: any) {
      console.warn("Start match sync error:", err.message);
    }
  };

  // Synchronize game state updates on moves and record match conclusions
  const syncGameState = async (nextState: any) => {
    if (!currentSession) return;

    // 1. FAST REALTIME BROADCAST (Zero-lag turn transitions across all devices)
    if (roomChannelRef.current) {
      try {
        roomChannelRef.current.send({
          type: "broadcast",
          event: "game_state",
          payload: { state: nextState, seat: mySeatIndex, timestamp: Date.now() },
        });
      } catch (err) {
        console.warn("Broadcast game_state error:", err);
      }
    }

    // 2. Authoritative background persistence to Supabase
    try {
      await supabase.from("game_states").upsert(
        {
          session_id: currentSession.id,
          public_state: nextState,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_id" }
      );

      // Detect match winner and automatically award stats & points in Supabase
      let winnerProfileId: string | null = null;
      if (
        currentSession.gameType === "uno" &&
        nextState.winnerSeat !== null &&
        nextState.winnerSeat !== undefined
      ) {
        const winner = roomPlayers.find((p) => p.seatIndex === nextState.winnerSeat);
        if (winner && winner.profileId) {
          winnerProfileId = winner.profileId;
        }
      } else if (
        currentSession.gameType === "ludo" &&
        nextState.winnerRanking &&
        nextState.winnerRanking.length > 0
      ) {
        const firstSeat = nextState.winnerRanking[0];
        const winner = roomPlayers.find((p) => p.seatIndex === firstSeat);
        if (winner && winner.profileId) {
          winnerProfileId = winner.profileId;
        }
      }

      if (winnerProfileId) {
        await supabase.rpc("record_match_result", {
          p_session_id: currentSession.id,
          p_winner_profile_id: winnerProfileId,
          p_game_type: currentSession.gameType,
        });

        // Refresh stats & leaderboard
        const activeProf = profileId || context.user.id.toString();
        fetchUserStats(activeProf);
        fetchLeaderboards();
      }
    } catch (err) {
      console.warn("syncGameState error:", err);
    }
  };

  // ----------------------------------------------------------------------------
  // 7. UNO Game Actions
  // ----------------------------------------------------------------------------
  const handleUnoPlayCard = (cardId: string, chosenColor?: CardColor) => {
    if (!unoState) return;
    try {
      const next = applyUnoAction(unoState, {
        type: "PLAY_CARD",
        seat: mySeatIndex,
        cardId,
        chosenColor,
      });
      setUnoState(next);
      syncGameState(next);
    } catch (err: any) {
      console.warn("UNO Action Error:", err.message);
    }
  };

  const handleUnoDrawCard = () => {
    if (!unoState) return;
    try {
      const next = applyUnoAction(unoState, {
        type: "DRAW_CARD",
        seat: mySeatIndex,
      });
      setUnoState(next);
      syncGameState(next);
    } catch (err: any) {
      console.warn("UNO Draw Error:", err.message);
    }
  };

  const handleUnoCallUno = () => {
    if (!unoState) return;
    const next = applyUnoAction(unoState, {
      type: "CALL_UNO",
      seat: mySeatIndex,
    });
    setUnoState(next);
    syncGameState(next);
  };

  const handleUnoCatchUno = () => {
    if (!unoState) return;
    const next = applyUnoAction(unoState, {
      type: "CATCH_UNO",
      reporterSeat: mySeatIndex,
    });
    setUnoState(next);
    syncGameState(next);
  };

  const handleUnoDecideChallenge = (challenge: boolean) => {
    if (!unoState) return;
    const next = applyUnoAction(unoState, {
      type: "DECIDE_CHALLENGE",
      challengerSeat: mySeatIndex,
      challenge,
    });
    setUnoState(next);
    syncGameState(next);
  };

  // ----------------------------------------------------------------------------
  // 8. LUDO Game Actions
  // ----------------------------------------------------------------------------
  const handleLudoRollDice = () => {
    if (!ludoState) return;
    try {
      const next = applyLudoAction(ludoState, {
        type: "ROLL_DICE",
        seat: mySeatIndex,
      });
      setLudoState(next);
      syncGameState(next);
    } catch (err: any) {
      console.warn("Ludo Roll Error:", err.message);
    }
  };

  const handleLudoMoveToken = (tokenId: string) => {
    if (!ludoState) return;
    try {
      const next = applyLudoAction(ludoState, {
        type: "MOVE_TOKEN",
        seat: mySeatIndex,
        tokenId,
      });
      setLudoState(next);
      syncGameState(next);
    } catch (err: any) {
      console.warn("Ludo Move Error:", err.message);
    }
  };

  // ----------------------------------------------------------------------------
  // 9. Real-Time Chat & Emoji Reactions
  // ----------------------------------------------------------------------------
  const handleSendChatMessage = async (content: string) => {
    if (!currentSession) return;
    const activeProf = profileId || context.user.id.toString();

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      sessionId: currentSession.id,
      senderId: activeProf,
      senderName: context.user.first_name,
      senderAvatar: context.user.photo_url,
      content,
      createdAt: new Date().toISOString(),
    };

    // 1. Immediately display locally
    setChatMessages((prev) => [...prev, newMsg]);

    // 2. Set local speech bubble over player's seat
    setSpeechBubbles((prev) => ({
      ...prev,
      [mySeatIndex]: { text: content, expiresAt: Date.now() + 4500 },
    }));

    // 3. Broadcast speech bubble to all participants immediately
    if (roomChannelRef.current) {
      try {
        roomChannelRef.current.send({
          type: "broadcast",
          event: "chat_bubble",
          payload: {
            seatIndex: mySeatIndex,
            text: content,
            message: newMsg,
          },
        });
      } catch (e) {
        // safe ignore
      }
    }

    // 4. Background persistence to chat_messages table
    try {
      await supabase.from("chat_messages").insert({
        session_id: currentSession.id,
        sender_id: activeProf,
        sender_name: context.user.first_name,
        sender_avatar: context.user.photo_url || null,
        content,
      });
    } catch (e) {
      // safe ignore
    }
  };

  const handleSendReaction = (emoji: string) => {
    const reactionEvent: QuickReactionEvent = {
      id: `react_${Date.now()}_${Math.random()}`,
      emoji,
      senderName: context.user.first_name,
    };

    setFloatingReactions((prev) => [...prev, reactionEvent]);

    // Broadcast over Supabase Realtime channel
    if (roomChannelRef.current) {
      roomChannelRef.current.send({
        type: "broadcast",
        event: "quick_reaction",
        payload: reactionEvent,
      });
    }

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reactionEvent.id));
    }, 2500);
  };

  // ----------------------------------------------------------------------------
  // 10. Fetch Real Leaderboards & User Profile Statistics
  // ----------------------------------------------------------------------------
  const fetchLeaderboards = async () => {
    try {
      const { data, error } = await supabase
        .from("player_statistics")
        .select("game_type, wins, matches_played, win_rate, profiles(id, first_name, username, photo_url)")
        .order("wins", { ascending: false })
        .limit(20);

      if (data && !error && data.length > 0) {
        const uno: LeaderboardEntry[] = [];
        const ludo: LeaderboardEntry[] = [];

        data.forEach((row: any) => {
          const entry: LeaderboardEntry = {
            rank: 0,
            profileId: row.profiles?.id || "",
            name: row.profiles?.first_name || "Player",
            username: row.profiles?.username || undefined,
            avatar: row.profiles?.photo_url || undefined,
            wins: row.wins || 0,
            matchesPlayed: row.matches_played || 0,
            winRate: row.win_rate || 0,
          };

          if (row.game_type === "uno") {
            entry.rank = uno.length + 1;
            uno.push(entry);
          } else {
            entry.rank = ludo.length + 1;
            ludo.push(entry);
          }
        });

        if (uno.length > 0) setUnoLeaderboard(uno);
        if (ludo.length > 0) setLudoLeaderboard(ludo);
      }
    } catch (e) {
      console.warn("fetchLeaderboards error:", e);
    }
  };

  const fetchUserStats = async (pId: string) => {
    try {
      const { data } = await supabase
        .from("player_statistics")
        .select("*")
        .eq("profile_id", pId);

      if (data && data.length > 0) {
        const uno = data.find((d: any) => d.game_type === "uno");
        const ludo = data.find((d: any) => d.game_type === "ludo");

        setUserStats({
          uno: {
            played: uno?.matches_played || 0,
            wins: uno?.wins || 0,
            losses: (uno?.matches_played || 0) - (uno?.wins || 0),
            winRate: uno?.win_rate || 0,
          },
          ludo: {
            played: ludo?.matches_played || 0,
            wins: ludo?.wins || 0,
            losses: (ludo?.matches_played || 0) - (ludo?.wins || 0),
            winRate: ludo?.win_rate || 0,
          },
        });
      }
    } catch (e) {
      console.warn("fetchUserStats error:", e);
    }
  };

  // Dev user switcher for testing
  const switchMockUser = (idx: number) => {
    setCurrentUserIndex(idx);
    const u = MOCK_TELEGRAM_USERS[idx];
    setContext((prev) => ({
      ...prev,
      user: u,
    }));
    haptics.selection();
  };

  const isPlayingGame = screen === "game_uno" || screen === "game_ludo";

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col font-['Outfit',sans-serif]">
      {/* Dev Mode Sandbox Toolbar for Multi-Player Testing in Browser */}
      {!context.isTelegram && (
        <div className="bg-indigo-950/90 border-b border-indigo-800/80 px-3 py-1.5 flex items-center justify-between text-xs">
          <span className="font-bold text-indigo-300">🎮 Dev Sandbox Player:</span>
          <div className="flex space-x-1.5">
            {MOCK_TELEGRAM_USERS.map((u, i) => (
              <button
                key={u.id}
                onClick={() => switchMockUser(i)}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  currentUserIndex === i
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {u.first_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {screen === "lobby" && (
          <LobbyBrowser
            currentGroupTitle={groupTitle}
            sessions={sessions}
            onJoinSession={handleJoinSession}
            onCreateSession={handleCreateSession}
            onRefresh={fetchSessions}
          />
        )}

        {screen === "waiting" && currentSession && (
          <WaitingRoom
            session={currentSession}
            players={roomPlayers}
            currentUserId={profileId || context.user.id.toString()}
            isHost={mySeatIndex === 0}
            onStartMatch={handleStartMatch}
            onLeaveRoom={handleLeaveRoom}
            onCloseRoom={handleCloseRoom}
            onAddBot={handleAddBot}
          />
        )}

        {screen === "game_uno" && unoState && (
          <UnoTable
            gameState={unoState}
            currentSeat={mySeatIndex}
            players={roomPlayers.map((p) => ({
              seat: p.seatIndex,
              name: p.name,
              avatar: p.avatar,
              isCurrentUser: p.seatIndex === mySeatIndex,
            }))}
            speechBubbles={speechBubbles}
            isHost={mySeatIndex === 0}
            onPlayCard={handleUnoPlayCard}
            onDrawCard={handleUnoDrawCard}
            onCallUno={handleUnoCallUno}
            onCatchUno={handleUnoCatchUno}
            onDecideChallenge={handleUnoDecideChallenge}
            onRematch={handleStartMatch}
            onLeaveMatch={handleLeaveRoom}
            onCloseMatch={handleCloseRoom}
          />
        )}

        {screen === "game_ludo" && ludoState && (
          <LudoTable
            gameState={ludoState}
            currentSeat={mySeatIndex}
            players={roomPlayers.map((p) => ({
              seat: p.seatIndex,
              name: p.name,
              avatar: p.avatar,
              isCurrentUser: p.seatIndex === mySeatIndex,
            }))}
            speechBubbles={speechBubbles}
            isHost={mySeatIndex === 0}
            onRollDice={handleLudoRollDice}
            onMoveToken={handleLudoMoveToken}
            onPassTurn={() => {}}
            onRematch={handleStartMatch}
            onLeaveMatch={handleLeaveRoom}
            onCloseMatch={handleCloseRoom}
          />
        )}

        {screen === "profile" && (
          <ProfileView
            user={{
              id: context.user.id,
              first_name: context.user.first_name,
              last_name: context.user.last_name,
              username: context.user.username,
              photo_url: context.user.photo_url,
            }}
            stats={userStats}
            onBack={() => setScreen("lobby")}
          />
        )}

        {screen === "leaderboard" && (
          <LeaderboardView
            unoLeaderboard={unoLeaderboard}
            ludoLeaderboard={ludoLeaderboard}
            onBack={() => setScreen("lobby")}
          />
        )}

        {screen === "help" && (
          <div className="w-full max-w-md mx-auto p-4 space-y-4 pb-20">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-white font-malayalam">നേരംപോക്ക്</h2>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800">GAME RULES</span>
            </div>
            
            <div className="p-4 rounded-3xl bg-[#161B26] border border-slate-800 space-y-2 text-xs text-slate-300">
              <h3 className="font-bold text-amber-400 text-sm">🃏 UNO (3–6 Players)</h3>
              <p>• Match cards from your hand by color, number, or action symbol.</p>
              <p>• Action cards: <strong>Skip</strong> (skips next player), <strong>Reverse</strong> (reverses turn order), <strong>Draw Two</strong> (+2 penalty cards).</p>
              <p>• <strong>Wild cards</strong> can be played on any card to choose the active color. <strong>Wild Draw Four (+4)</strong> can be challenged!</p>
              <p>• When you have only 1 card left, tap <strong>"Call UNO!"</strong> before opponents catch you, or draw a 2-card penalty.</p>
              <p>• First player to discard all their cards wins the round!</p>
            </div>

            <div className="p-4 rounded-3xl bg-[#161B26] border border-slate-800 space-y-2 text-xs text-slate-300">
              <h3 className="font-bold text-blue-400 text-sm">🎲 LUDO (4, 5 & 6 Players)</h3>
              <p>• Roll a <strong>6</strong> on the dice to release a token from your base onto the starting track.</p>
              <p>• Rolling a 6 grants an immediate extra roll (three consecutive sixes forfeits your turn).</p>
              <p>• Land on an opponent's token on non-safe squares to capture it and send it back to their base!</p>
              <p>• Star squares (★) and starting positions are 100% safe zones from capture.</p>
              <p>• Reach the Home center with an exact dice roll. First player to get all 4 tokens Home wins!</p>
            </div>
          </div>
        )}
      </main>

      {/* Floating In-Game Real-Time Chat (Available during matches) */}
      {isPlayingGame && (
        <InGameChat
          sessionId={currentSession?.id || "default"}
          currentUserId={profileId || context.user.id.toString()}
          currentUserName={context.user.first_name}
          currentUserAvatar={context.user.photo_url}
          messages={chatMessages}
          onSendMessage={handleSendChatMessage}
          onSendReaction={handleSendReaction}
          floatingReactions={floatingReactions}
        />
      )}

      {/* Bottom Global Navigation Bar */}
      {!isPlayingGame && (
        <nav className="fixed bottom-0 inset-x-0 bg-[#0F141E]/95 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2 flex items-center justify-around z-30 shadow-2xl">
          <button
            onClick={() => {
              setScreen("lobby");
              haptics.selection();
            }}
            className={`flex flex-col items-center p-1.5 transition-colors ${
              screen === "lobby" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Lobby</span>
          </button>

          <button
            onClick={() => {
              setScreen("leaderboard");
              haptics.selection();
            }}
            className={`flex flex-col items-center p-1.5 transition-colors ${
              screen === "leaderboard" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Trophy className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Leaderboard</span>
          </button>

          <button
            onClick={() => {
              setScreen("profile");
              haptics.selection();
            }}
            className={`flex flex-col items-center p-1.5 transition-colors ${
              screen === "profile" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Profile</span>
          </button>

          <button
            onClick={() => {
              setScreen("help");
              haptics.selection();
            }}
            className={`flex flex-col items-center p-1.5 transition-colors ${
              screen === "help" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <HelpCircle className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Rules</span>
          </button>
        </nav>
      )}
    </div>
  );
};
