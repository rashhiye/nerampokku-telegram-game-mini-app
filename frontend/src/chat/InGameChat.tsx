// ==============================================================================
// IN-GAME COMPACT CHAT & QUICK REACTIONS (NON-BLOCKING)
// File: frontend/src/chat/InGameChat.tsx
// ==============================================================================

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, QuickReactionEvent } from "./types";
import { MessageSquare, Send, X, Smile, ChevronUp, ChevronDown } from "lucide-react";
import { sounds } from "../telegram/audio";
import { haptics } from "../telegram/haptics";

interface InGameChatProps {
  sessionId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onSendReaction: (emoji: string) => void;
  floatingReactions?: QuickReactionEvent[];
}

const EMOJI_TRAY = ["🔥", "👍", "😂", "😱", "🎉", "👀"];
const QUICK_PHRASES = ["UNO! 🔥", "Good luck! 🍀", "Nice move! 👏", "Hurry up! ⏳", "Haha 😂", "GG! 🏆"];

export const InGameChat: React.FC<InGameChatProps> = ({
  currentUserId,
  messages,
  onSendMessage,
  onSendReaction,
  floatingReactions = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [inputText, setInputText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSentTime, setLastSentTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showHistory) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderId !== currentUserId) {
        setUnreadCount((prev) => prev + 1);
        sounds.playCard();
        haptics.impact("light");
      }
    }
  }, [messages, showHistory]);

  const handleSendText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Anti-spam cooldown (1s)
    const now = Date.now();
    if (now - lastSentTime < 1000) {
      haptics.notification("warning");
      return;
    }

    setLastSentTime(now);
    onSendMessage(trimmed);
    setInputText("");
    haptics.impact("medium");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendText(inputText);
  };

  return (
    <>
      {/* 1. Floating Screen Reaction Particles */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-28 right-8 text-4xl animate-bounce-short transition-all duration-1000"
            style={{
              animation: "floatUp 2.5s ease-out forwards",
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* 2. Floating Quick Emoji & Chat Toggle Buttons (Bottom-Right Floating Dock) */}
      {!isOpen && (
        <div className="fixed bottom-3 right-3 z-30 flex items-center space-x-1.5 select-none">
          {/* Quick Reaction Bar */}
          <div className="flex items-center space-x-1 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-full border border-slate-700/80 shadow-2xl">
            {EMOJI_TRAY.slice(0, 4).map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  haptics.selection();
                  onSendReaction(emoji);
                }}
                className="text-lg hover:scale-125 active:scale-95 transition-transform px-1"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Toggle Chat Bar Button */}
          <button
            onClick={() => {
              setIsOpen(true);
              haptics.impact("medium");
            }}
            className="relative bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white p-2.5 rounded-full shadow-2xl transition-transform active:scale-90 border-2 border-indigo-400/60"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-slate-950 animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 3. Non-Blocking Floating Chat Drawer (Bottom 25% max, board stays fully visible!) */}
      {isOpen && (
        <div className="fixed bottom-0 inset-x-0 z-40 max-w-lg mx-auto bg-slate-950/95 backdrop-blur-xl border-t border-indigo-500/40 rounded-t-3xl shadow-2xl p-2.5 space-y-2 select-none animate-slide-up">
          {/* Top Bar with History Toggle & Close Button */}
          <div className="flex items-center justify-between px-2 pt-0.5">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center space-x-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"
            >
              <span>Match Chat</span>
              {showHistory ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              {messages.length > 0 && (
                <span className="text-[10px] text-slate-500">({messages.length})</span>
              )}
            </button>

            <div className="flex items-center space-x-2">
              {/* Emojis row inside bar */}
              <div className="flex space-x-1">
                {EMOJI_TRAY.map((em) => (
                  <button
                    key={em}
                    onClick={() => {
                      haptics.selection();
                      onSendReaction(em);
                    }}
                    className="text-base hover:scale-125 active:scale-90 transition-transform"
                  >
                    {em}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowHistory(false);
                  haptics.impact("light");
                }}
                className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-800/80"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Collapsible Message History (Max 140px, semi-transparent) */}
          {showHistory && (
            <div className="max-h-36 overflow-y-auto px-2 py-1 space-y-1.5 scrollbar-thin border-y border-slate-800/80 bg-slate-900/50 rounded-xl">
              {messages.length === 0 ? (
                <div className="py-3 text-center text-slate-500 text-xs">
                  No messages yet. Send a quick chat or phrase!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col text-xs ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center space-x-1 mb-0.5">
                        <span className="text-[9px] font-bold text-slate-400">
                          {isMe ? "You" : msg.senderName}
                        </span>
                      </div>
                      <div
                        className={`px-2.5 py-1 rounded-xl text-xs max-w-[85%] break-words ${
                          isMe
                            ? "bg-indigo-600 text-white rounded-br-none"
                            : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Quick Chat Preset Phrases (1-tap sends speech bubble!) */}
          <div className="flex space-x-1.5 overflow-x-auto py-1 scrollbar-none">
            {QUICK_PHRASES.map((phrase) => (
              <button
                key={phrase}
                onClick={() => handleSendText(phrase)}
                className="px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-indigo-950/80 border border-slate-700/80 text-slate-200 hover:text-white text-[11px] font-extrabold whitespace-nowrap active:scale-95 transition-transform shadow"
              >
                {phrase}
              </button>
            ))}
          </div>

          {/* Custom Text Input */}
          <form onSubmit={handleFormSubmit} className="flex items-center space-x-1.5 pt-0.5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message (pops up on your avatar)..."
              maxLength={120}
              className="flex-1 bg-slate-900 border border-slate-700/90 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-indigo-600 disabled:opacity-40 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow flex items-center space-x-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
