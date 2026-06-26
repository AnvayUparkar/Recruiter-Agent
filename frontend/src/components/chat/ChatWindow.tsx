import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, User as UserIcon, Bot, MoreVertical, Paperclip } from "lucide-react";
import { useSocket } from "../../hooks/useSocket";
import { useAuthStore } from "../../store/authStore";
import clsx from "clsx";
import { apiClient } from "../../api/client";
import { ENDPOINTS } from "../../api/endpoints";

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  seen: boolean;
}

interface ChatWindowProps {
  conversationId: string;
  receiverId: string;
  receiverName: string;
  receiverRole: string;
}

export function ChatWindow({ conversationId, receiverId, receiverName, receiverRole }: ChatWindowProps) {
  const { user } = useAuthStore();
  const { socket, isConnected, emit } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingAIPrompt, setIsGeneratingAIPrompt] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch initial messages
  useEffect(() => {
    async function fetchMessages() {
      try {
        const response = await apiClient.get<{messages: Message[]}>(`${ENDPOINTS.CHAT_MESSAGES}/${conversationId}`);
        if (response.data && response.data.messages) {
          setMessages(response.data.messages);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    }
    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    if (!socket) return;

    socket.on("message_received", (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message]);
        // Emit seen
        emit("seen", { messageId: message._id, senderId: message.senderId });
      }
    });

    socket.on("typing_start", (data: any) => {
      if (data.senderId === receiverId) setIsTyping(true);
    });

    socket.on("typing_stop", (data: any) => {
      if (data.senderId === receiverId) setIsTyping(false);
    });

    return () => {
      socket.off("message_received");
      socket.off("typing_start");
      socket.off("typing_stop");
    };
  }, [socket, conversationId, receiverId, emit]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim() || !user) return;

    const newMessage = {
      _id: Date.now().toString(), // Temp ID
      conversationId,
      senderId: user.id,
      receiverId,
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
      seen: false
    };

    // Optimistic update
    setMessages(prev => [...prev, newMessage as Message]);
    setInputText("");
    
    emit("typing_stop", { senderId: user.id, receiverId });

    try {
      await apiClient.post(ENDPOINTS.CHAT_SEND, {
        conversationId,
        receiverId,
        text: inputText.trim()
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    if (user) {
      emit("typing_start", { senderId: user.id, receiverId });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        emit("typing_stop", { senderId: user.id, receiverId });
      }, 2000);
    }
  };

  const generateAIOpening = () => {
    setIsGeneratingAIPrompt(true);
    // Mock AI generation delay
    setTimeout(() => {
      setInputText(`Hi ${receiverName.split(' ')[0]}, I saw your impressive background and would love to chat about a role that matches your skills! Let me know if you're open to connecting.`);
      setIsGeneratingAIPrompt(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
              <UserIcon size={20} />
            </div>
            {isConnected && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{receiverName}</h3>
            <p className="text-xs text-slate-500">{receiverRole}</p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Bot size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === user?.id;
            
            return (
              <motion.div
                key={msg._id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  "flex w-full",
                  isMe ? "justify-end" : "justify-start"
                )}
              >
                <div 
                  className={clsx(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
                    isMe 
                      ? "bg-blue-600 text-white rounded-br-sm" 
                      : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-bl-sm"
                  )}
                >
                  <p className="text-[15px] leading-relaxed">{msg.text}</p>
                  <div className={clsx(
                    "text-[10px] mt-1 text-right",
                    isMe ? "text-blue-200" : "text-slate-400"
                  )}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe && msg.seen && " • Seen"}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full justify-start"
          >
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          {user?.role === "recruiter" && messages.length === 0 && (
            <button 
              onClick={generateAIOpening}
              disabled={isGeneratingAIPrompt}
              className="px-3 py-2 flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-100 dark:bg-violet-500/20 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-500/30 rounded-xl transition-colors whitespace-nowrap"
            >
              <Bot size={16} className={isGeneratingAIPrompt ? "animate-pulse" : ""} />
              {isGeneratingAIPrompt ? "Generating..." : "AI Opening"}
            </button>
          )}
          <button className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-4 py-2.5 text-[15px] focus:ring-2 focus:ring-blue-500/50 dark:text-white"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl transition-all shadow-sm"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
