import { create } from "zustand";
import { persist } from "zustand/middleware";

const uuid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);


// ─── Types ─────────────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export interface SourcePill {
  label: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isLoading?: boolean;
  sources?: SourcePill[];
  candidateId?: string;
}

export interface Conversation {
  id: string;
  candidateId: string;
  candidateName: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

interface ChatStoreState {
  conversations: Conversation[];
  activeConversationId: string | null;

  // Accessors
  activeConversation: () => Conversation | undefined;

  // Mutators
  createConversation: (candidateId: string, candidateName: string) => string;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addMessage: (conversationId: string, msg: Omit<ChatMessage, "id" | "timestamp">) => string;
  updateMessage: (conversationId: string, messageId: string, patch: Partial<ChatMessage>) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  clearConversation: (conversationId: string) => void;
  clearConversationKeepFirst: (conversationId: string) => void;
}

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,

      activeConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId);
      },

      createConversation: (candidateId, candidateName) => {
        const id = uuid();
        const now = Date.now();
        const newConv: Conversation = {
          id,
          candidateId,
          candidateName,
          messages: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          conversations: [newConv, ...state.conversations].slice(0, 20), // cap at 20
          activeConversationId: id,
        }));
        return id;
      },

      selectConversation: (id) => set({ activeConversationId: id }),

      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId:
            state.activeConversationId === id
              ? state.conversations.find((c) => c.id !== id)?.id ?? null
              : state.activeConversationId,
        })),

      addMessage: (conversationId, msg) => {
        const id = uuid();
        const message: ChatMessage = { ...msg, id, timestamp: Date.now() };
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, message], updatedAt: Date.now() }
              : c
          ),
        }));
        return id;
      },

      updateMessage: (conversationId, messageId, patch) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, ...patch } : m
                  ),
                  updatedAt: Date.now(),
                }
              : c
          ),
        })),

      removeMessage: (conversationId, messageId) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.filter((m) => m.id !== messageId),
                  updatedAt: Date.now(),
                }
              : c
          ),
        })),

      clearConversation: (conversationId) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [], updatedAt: Date.now() }
              : c
          ),
        })),

      clearConversationKeepFirst: (conversationId) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: c.messages.slice(0, 1), updatedAt: Date.now() }
              : c
          ),
        })),
    }),
    {
      name: "recruiter-copilot-chats",
      // Only persist conversations (not ephemeral loading states)
      partialize: (state) => ({
        conversations: state.conversations.map((c) => ({
          ...c,
          messages: c.messages.filter((m) => !m.isLoading),
        })),
        activeConversationId: state.activeConversationId,
      }),
    }
  )
);

export default useChatStore;
