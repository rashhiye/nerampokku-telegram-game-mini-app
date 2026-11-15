// ==============================================================================
// GAMEVERSE: MAIN APPLICATION CONTROLLER
// File: frontend/src/app/App.tsx
// ==============================================================================

import React, { useState, useEffect } from "react";
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
import { Home, Trophy, User, HelpCircle, Gamepad2 } from "lucide-react";
import { haptics } from "../telegram/haptics";

type AppScreen = "lobby" | "waiting" | "game_uno" | "game_ludo" | "profile" | "leaderboard" | "help";

export const App: React.FC = () => {
  const [context, setContext] = useState(getTelegramLaunchContext());
  const [screen, setScreen] = useState<AppScreen>("lobby");
  const [currentUserIndex, setCurrentUserIndex] = useState(0);

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

  // Demo Sessions in Lobby
  const [sessions, setSessions] = useState<GameSessionInfo[]>([
    {
      id: "demo-uno-1",
      groupId: "-1001234567890",
      groupTitle: "നേരംപോക്ക് Official Club",
      gameType: "uno",
      status: "waiting",
      hostId: "user-1",
      hostName: "Alex Vance",
      minPlayers: 3,
      maxPlayers: 4,
      currentPlayerCount: 2,
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-ludo-1",
      groupId: "-1001234567890",
      groupTitle: "നേരംപോക്ക് Official Club",
      gameType: "ludo",
      status: "waiting",
      hostId: "user-2",
      hostName: "Sarah Connor",
      minPlayers: 4,
      maxPlayers: 4,
      currentPlayerCount: 3,
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-ludo-6p",
      groupId: "-1001234567890",
      groupTitle: "നേരംപോക്ക് Official Club",
      gameType: "ludo",
      status: "waiting",
      hostId: "user-3",
      hostName: "Thomas Anderson",
      minPlayers: 4,
      maxPlayers: 6,
      currentPlayerCount: 4,
      createdAt: new Date().toISOString(),
    },
  ]);

  // Demo Leaderboards
  const unoLeaderboard: LeaderboardEntry[] = [
    { rank: 1, profileId: "p1", name: "Sarah Connor", username: "sarah_p", wins: 28, matchesPlayed: 36, winRate: 77.8 },
    { rank: 2, profileId: "p2", name: "Alex Vance", username: "alex_gamer", wins: 22, matchesPlayed: 30, winRate: 73.3 },
    { rank: 3, profileId: "p3", name: "Thomas Anderson", username: "neo_matrix", wins: 15, matchesPlayed: 25, winRate: 60.0 },
    { rank: 4, profileId: "p4", name: "Elena Rostova", username: "elena_r", wins: 11, matchesPlayed: 20, winRate: 55.0 },
  ];

  const ludoLeaderboard: LeaderboardEntry[] = [
    { rank: 1, profileId: "p2", name: "Alex Vance", username: "alex_gamer", wins: 34, matchesPlayed: 45, winRate: 75.5 },
    { rank: 2, profileId: "p1", name: "Sarah Connor", username: "sarah_p", wins: 25, matchesPlayed: 38, winRate: 65.8 },
    { rank: 3, profileId: "p4", name: "Elena Rostova", username: "elena_r", wins: 19, matchesPlayed: 32, winRate: 59.4 },
    { rank: 4, profileId: "p3", name: "Thomas Anderson", username: "neo_matrix", wins: 14, matchesPlayed: 28, winRate: 50.0 },
  ];

  // Dev user switcher for local multi-player testing
  const switchMockUser = (idx: number) => {
    setCurrentUserIndex(idx);
    const u = MOCK_TELEGRAM_USERS[idx];
    setContext((prev) => ({
      ...prev,
      user: u,
    }));
    haptics.selection();
  };

  // Join match handler
  const handleJoinSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    setCurrentSession(session);
    setMySeatIndex(0);

    // Populate waiting room with players
    const mockPlayers: SessionPlayerInfo[] = [
      {
        id: "mp_0",
        profileId: context.user.id.toString(),
        name: context.user.first_name,
        username: context.user.username,
        avatar: context.user.photo_url,
        seatIndex: 0,
        isHost: true,
        status: "waiting",
      },
      {
        id: "mp_1",
        profileId: "100000002",
        name: "Sarah Connor",
        username: "sarah_p",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60",
        seatIndex: 1,
        isHost: false,
        status: "waiting",
      },
      {
        id: "mp_2",
        profileId: "100000003",
        name: "Thomas Anderson",
        username: "neo_matrix",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=60&h=60",
        seatIndex: 2,
        isHost: false,
        status: "waiting",
      },
    ];

    if (session.maxPlayers >= 4) {
      mockPlayers.push({
        id: "mp_3",
        profileId: "100000004",
        name: "Elena Rostova",
        username: "elena_r",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=60&h=60",
        seatIndex: 3,
        isHost: false,
        status: "waiting",
      });
    }

    if (session.maxPlayers === 6) {
      mockPlayers.push(
        {
          id: "mp_4",
          profileId: "100000005",
          name: "Marcus Vance",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60",
          seatIndex: 4,
          isHost: false,
          status: "waiting",
        },
        {
          id: "mp_5",
          profileId: "100000006",
          name: "Chloe King",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&h=60",
          seatIndex: 5,
          isHost: false,
          status: "waiting",
        }
      );
    }

    setRoomPlayers(mockPlayers);
    setScreen("waiting");
  };

  // Create match handler
  const handleCreateSession = (
    gameType: GameType,
    maxPlayers: number,
    rules: any
  ) => {
    const newSession: GameSessionInfo = {
      id: `session_${Date.now()}`,
      groupId: context.startParam || "-1001234567890",
      groupTitle: "Telegram Group",
      gameType,
      status: "waiting",
      hostId: context.user.id.toString(),
      hostName: context.user.first_name,
      minPlayers: gameType === "ludo" ? 4 : 3,
      maxPlayers,
      currentPlayerCount: 1,
      createdAt: new Date().toISOString(),
    };

    setSessions([newSession, ...sessions]);
    handleJoinSession(newSession.id);
  };

  // Start match handler
  const handleStartMatch = () => {
    if (!currentSession) return;
    haptics.notification("success");

    if (currentSession.gameType === "uno") {
      const initialUno = createUnoGame(roomPlayers.length);
      setUnoState(initialUno);
      setScreen("game_uno");
    } else {
      const pCount = (roomPlayers.length >= 6 ? 6 : 4) as 4 | 6;
      const initialLudo = createLudoGame(pCount);
      setLudoState(initialLudo);
      setScreen("game_ludo");
    }
  };

  // UNO In-Game Actions
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
  };

  const handleUnoCatchUno = () => {
    if (!unoState) return;
    const next = applyUnoAction(unoState, {
      type: "CATCH_UNO",
      reporterSeat: mySeatIndex,
    });
    setUnoState(next);
  };

  const handleUnoDecideChallenge = (challenge: boolean) => {
    if (!unoState) return;
    const next = applyUnoAction(unoState, {
      type: "DECIDE_CHALLENGE",
      challengerSeat: mySeatIndex,
      challenge,
    });
    setUnoState(next);
  };

  // LUDO In-Game Actions
  const handleLudoRollDice = () => {
    if (!ludoState) return;
    try {
      const next = applyLudoAction(ludoState, {
        type: "ROLL_DICE",
        seat: mySeatIndex,
      });
      setLudoState(next);
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
    } catch (err: any) {
      console.warn("Ludo Move Error:", err.message);
    }
  };

  // Chat message send
  const handleSendChatMessage = (content: string) => {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sessionId: currentSession?.id || "default",
      senderId: context.user.id.toString(),
      senderName: context.user.first_name,
      senderAvatar: context.user.photo_url,
      content,
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  // Quick Emoji reaction send
  const handleSendReaction = (emoji: string) => {
    const reactionId = `react_${Date.now()}_${Math.random()}`;
    const newReact: QuickReactionEvent = {
      id: reactionId,
      emoji,
      senderName: context.user.first_name,
    };
    setFloatingReactions((prev) => [...prev, newReact]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reactionId));
    }, 2500);
  };

  const isPlayingGame = screen === "game_uno" || screen === "game_ludo";

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col font-['Outfit',sans-serif]">
      {/* Dev Mode Sandbox Toolbar for Multi-Player Testing */}
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
            currentGroupTitle="നേരംപോക്ക് Official Club"
            sessions={sessions}
            onJoinSession={handleJoinSession}
            onCreateSession={handleCreateSession}
            onRefresh={() => setSessions([...sessions])}
          />
        )}

        {screen === "waiting" && currentSession && (
          <WaitingRoom
            session={currentSession}
            players={roomPlayers}
            currentUserId={context.user.id.toString()}
            isHost={mySeatIndex === 0}
            onStartMatch={handleStartMatch}
            onLeaveRoom={() => setScreen("lobby")}
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
            onPlayCard={handleUnoPlayCard}
            onDrawCard={handleUnoDrawCard}
            onCallUno={handleUnoCallUno}
            onCatchUno={handleUnoCatchUno}
            onDecideChallenge={handleUnoDecideChallenge}
            onRematch={() => handleJoinSession(currentSession!.id)}
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
            onRollDice={handleLudoRollDice}
            onMoveToken={handleLudoMoveToken}
            onPassTurn={() => {}}
            onRematch={() => handleJoinSession(currentSession!.id)}
          />
        )}

        {screen === "profile" && (
          <ProfileView
            user={context.user}
            stats={{
              uno: { played: 30, wins: 22, losses: 8, winRate: 73.3 },
              ludo: { played: 45, wins: 34, losses: 11, winRate: 75.5 },
            }}
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
              <h2 className="text-xl font-black text-white font-malayalam">നേരംപോക്ക് — നിയമങ്ങൾ</h2>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800">GAME RULES</span>
            </div>
            
            <div className="p-4 rounded-3xl bg-[#161B26] border border-slate-800 space-y-2 text-xs text-slate-300">
              <h3 className="font-bold text-amber-400 text-sm">🃏 UNO (3-6 Players)</h3>
              <p>• കളറിലോ നമ്പറിലോ ചിഹ്നത്തിലോ മാച്ച് ചെയ്യുക.</p>
              <p>• ആക്ഷൻ കാർഡുകൾ: Skip, Reverse, Draw Two (+2).</p>
              <p>• Wild കാർഡുകൾ ഏത് കളറിലേക്കും മാറ്റാം. Wild +4 ചലഞ്ച് ചെയ്യാം!</p>
              <p>• കയ്യിൽ 1 കാർഡ് ബാക്കിയാകുമ്പോൾ <strong>"Call UNO!"</strong> അടിക്കുക, അല്ലെങ്കിൽ എതിരാളികൾക്ക് ക്യാച്ച് ചെയ്യാം!</p>
            </div>

            <div className="p-4 rounded-3xl bg-[#161B26] border border-slate-800 space-y-2 text-xs text-slate-300">
              <h3 className="font-bold text-blue-400 text-sm">🎲 LUDO (4 & 6 Players)</h3>
              <p>• തട്ടിൽ നിന്ന് ഇറങ്ങാൻ നിർബന്ധമായും <strong>6</strong> വീഴണം.</p>
              <p>• 6 വീണാൽ വീണ്ടും റോൾ ചെയ്യാം (തുടർച്ചയായി 3 പ്രാവശ്യം 6 വീണാൽ ചാൻസ് പോകും).</p>
              <p>• സേഫ് അല്ലാത്ത കട്ടകളിൽ ഉള്ള എതിരാളിയുടെ കോയിൻ വെട്ടി ബേസിലേക്ക് അയക്കാം!</p>
              <p>• സ്റ്റാർ (Star) ഉള്ള കട്ടകൾ 100% സേഫ് ആണ്.</p>
              <p>• ഹോം സെന്ററിലേക്ക് കൃത്യമായ നമ്പർ വീഴണം!</p>
            </div>
          </div>
        )}
      </main>

      {/* Floating In-Game Real-Time Chat (Available during matches) */}
      {isPlayingGame && (
        <InGameChat
          sessionId={currentSession?.id || "default"}
          currentUserId={context.user.id.toString()}
          currentUserName={context.user.first_name}
          currentUserAvatar={context.user.photo_url}
          messages={chatMessages}
          onSendMessage={handleSendChatMessage}
          onSendReaction={handleSendReaction}
          floatingReactions={floatingReactions}
        />
      )}

      {/* Bottom Global Navigation Bar (Hidden during gameplay to maximize board space) */}
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
            <span className="text-[10px] font-bold font-malayalam">ലോബി</span>
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
            <span className="text-[10px] font-bold font-malayalam">റാങ്ക്</span>
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
            <span className="text-[10px] font-bold font-malayalam">പ്രൊഫൈൽ</span>
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
            <span className="text-[10px] font-bold font-malayalam">നിയമങ്ങൾ</span>
          </button>
        </nav>
      )}
    </div>
  );
};
