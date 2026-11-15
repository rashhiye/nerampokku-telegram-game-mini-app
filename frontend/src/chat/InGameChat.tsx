// ==============================================================================
// IN-GAME REAL-TIME CHAT DRAWER & QUICK REACTIONS
// File: frontend/src/chat/InGameChat.tsx
// ==============================================================================

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, QuickReactionEvent } from "./types";
import { MessageSquare, Send, X, Volume2, VolumeX, Smile } from "lucide-react";
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

const EMOJI_TRAY = ["🔥", "👍", "😂", "😱", "🎉", "💔", "👀", "🤡"];

export const InGameChat: React.FC<InGameChatProps> = ({
  currentUserId,
  messages,
  onSendMessage,
  onSendReaction,
  floatingReactions = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [lastSentTime, setLastSentTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
    } else if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderId !== currentUserId) {
        setUnreadCount((prev) => prev + 1);
        if (!isMuted) {
          sounds.playCard();
          haptics.impact("light");
        }
      }
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    // Anti-spam cooldown (1.5 seconds)
    const now = Date.now();
    if (now - lastSentTime < 1500) {
      haptics.notification("warning");
      return;
    }

    setLastSentTime(now);
    onSendMessage(text);
    setInputText("");
    haptics.impact("light");
  };

  const handleQuickReaction = (emoji: string) => {
    haptics.selection();
    onSendReaction(emoji);
  };

  return (
    <>
      {/* 1. Floating Screen Reaction Particles */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-24 right-10 text-4xl animate-bounce-short transition-all duration-1000"
            style={{
              animation: "floatUp 2.5s ease-out forwards",
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* 2. Floating Chat Toggle Pill Button (Bottom Right) */}
      <div className="fixed bottom-4 right-4 z-30 flex items-center space-x-2">
        {/* Quick Reaction Bar */}
        <div className="flex items-center space-x-1 bg-slate-900/85 backdrop-blur-md px-2 py-1.5 rounded-full border border-slate-700/80 shadow-xl">
          {EMOJI_TRAY.slice(0, 4).map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleQuickReaction(emoji)}
              className="text-lg hover:scale-125 active:scale-95 transition-transform px-1"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Chat Drawer Toggle Button with Unread Badge */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            haptics.impact("medium");
          }}
          className="relative bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-2xl transition-transform active:scale-90 border-2 border-indigo-400/50"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. Slide-Over Chat Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-80 bg-[#161B26]/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col justify-between animate-slide-left">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h3 className="font-extrabold text-white text-sm">Match Chat</h3>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                <Smile className="w-8 h-8 mb-2 opacity-50" />
                <p>No messages in this match yet.</p>
                <p>Say hi or cheer your teammates!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center space-x-1.5 mb-0.5">
                      {!isMe && (
                        <img
                          src={
                            msg.senderAvatar ||
                            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40"
                          }
                          alt={msg.senderName}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                      )}
                      <span className="text-[10px] font-bold text-slate-400">
                        {isMe ? "You" : msg.senderName}
                      </span>
                      <span className="text-[9px] text-slate-600 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs break-words shadow ${
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

          {/* Quick Reaction Bar Inside Drawer */}
          <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            {EMOJI_TRAY.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleQuickReaction(emoji)}
                className="text-lg hover:scale-125 active:scale-95 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type in-game message..."
              maxLength={280}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-indigo-600 disabled:opacity-50 hover:bg-indigo-500 text-white p-2 rounded-xl transition-all shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
