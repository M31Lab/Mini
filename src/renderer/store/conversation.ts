/// <reference lib="dom" />

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage, Conversation, Model, Verbosity } from "../types";

/**
 * State shape for the conversation slice
 */
export interface ConversationState {
  conversations: {
    [id: string]: Conversation;  // Map of conversation IDs to conversation objects
  };
  currentConversationId: string | undefined;  // ID of the active conversation
  currentConversation: Conversation | undefined;  // Reference to the active conversation
}

/**
 * Base payload containing a conversation ID
 */
export interface ConversationIdPayload {
  conversationId: string;  // ID of the conversation to operate on
}

/**
 * Payload for updating conversation messages
 */
export interface ConversationMessagesPayload extends ConversationIdPayload {
  messages: ChatMessage[];  // New messages to set
}

/**
 * Payload for updating conversation model
 */
export interface ConversationModelPayload extends ConversationIdPayload {
  model: Model;  // AI model to use for the conversation
}

/**
 * Payload for updating conversation title
 */
export interface ConversationTitlePayload extends ConversationIdPayload {
  title: string;  // New title for the conversation
}

/**
 * Payload for marking if title was renamed by AI
 */
export interface AiRenamedTitlePayload extends ConversationIdPayload {
  aiRenamedTitle: boolean;  // Whether the title was renamed by AI
}

/**
 * Data structure for token usage counts
 */
export interface TokenCountData {
  messages: number;    // Tokens used by messages
  userInput: number;   // Tokens used by current user input
  minTotal: number;    // Minimum total tokens used
}

/**
 * Payload for updating token count
 */
export interface ConversationTokenCountPayload extends ConversationIdPayload {
  tokenCount: TokenCountData;  // Token usage data
}

/**
 * Payload for adding or updating a message
 */
export interface MessagePayload extends ConversationIdPayload {
  message: ChatMessage;  // Message to add or update
  messageId?: string;    // Optional ID for the message (used for updates)
}

/**
 * Payload for updating message content
 */
export interface MessageContentPayload extends ConversationIdPayload {
  messageId: string;    // ID of the message to update
  content: string;      // New content for the message
  rawContent?: string;  // Optional raw/unprocessed content
  done?: boolean;       // Whether the message generation is complete
}

/**
 * Payload containing a message ID
 */
export interface MessageIdPayload extends ConversationIdPayload {
  messageId: string;  // ID of the message to operate on
}

/**
 * Payload for updating in-progress state
 */
export interface InProgressPayload extends ConversationIdPayload {
  inProgress: boolean;  // Whether the conversation has a message being generated
}

/**
 * Payload for updating autoscroll setting
 */
export interface AutoscrollPayload extends ConversationIdPayload {
  autoscroll: boolean;  // Whether to automatically scroll to new messages
}

/**
 * Payload for updating verbosity setting
 */
export interface VerbosityPayload extends ConversationIdPayload {
  verbosity: Verbosity;  // Verbosity level for the conversation
}

/**
 * Payload for updating user input
 */
export interface UserInputPayload extends ConversationIdPayload {
  userInput: string;  // Current user input text
}

/**
 * Generates a unique ID for a new conversation
 */
const generateInitialConversationId = (): string => `Chat-${Date.now()}`;

/**
 * Creates a new conversation with default values
 */
const createInitialConversation = (id: string): Conversation => ({
  id,
  title: "Chat",
  aiRenamedTitle: false,
  messages: [],
  createdAt: Date.now(),
  inProgress: false,
  model: undefined,
  autoscroll: true,
  verbosity: undefined,
  tools: {},
});

// Create initial conversation for the initial state
const initialConversationID = generateInitialConversationId();
const initialConversation = createInitialConversation(initialConversationID);

/**
 * Initial state for the conversation slice
 */
const initialState: ConversationState = {
  conversations: {
    [initialConversationID]: initialConversation
  },
  currentConversationId: initialConversationID,
  currentConversation: initialConversation,
};

/**
 * Redux slice for managing conversations
 */
export const conversationSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    /**
     * Adds a new conversation to the state
     */
    addConversation: (state, action: PayloadAction<Conversation>) => {
      state.conversations[action.payload.id] = action.payload;
    },

    /**
     * Removes a conversation from the state
     */
    removeConversation: (state, action: PayloadAction<string>) => {
      delete state.conversations[action.payload];
    },

    /**
     * Updates an entire conversation object
     */
    updateConversation: (state, action: PayloadAction<Conversation>) => {
      const { id } = action.payload;
      if (state.conversations[id]) {
        state.conversations[id] = action.payload;

        // Update current conversation reference if needed
        if (id === state.currentConversationId) {
          state.currentConversation = action.payload;
        }
      }
    },

    /**
     * Updates all messages in a conversation
     */
    updateConversationMessages: (
      state,
      action: PayloadAction<ConversationMessagesPayload>
    ) => {
      const { conversationId, messages } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].messages = messages;

        // Update current conversation reference if needed
        if (conversationId === state.currentConversationId && state.currentConversation) {
          state.currentConversation.messages = messages;
        }
      }
    },

    /**
     * Updates the AI model for a conversation
     */
    updateConversationModel: (
      state,
      action: PayloadAction<ConversationModelPayload>
    ) => {
      const { conversationId, model } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].model = model;
      }
    },

    /**
     * Updates the title of a conversation
     */
    updateConversationTitle: (
      state,
      action: PayloadAction<ConversationTitlePayload>
    ) => {
      const { conversationId, title } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].title = title;
      }
    },

    /**
     * Marks whether the title was renamed by AI
     */
    aiRenamedTitle: (
      state,
      action: PayloadAction<AiRenamedTitlePayload>
    ) => {
      const { conversationId, aiRenamedTitle } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].aiRenamedTitle = aiRenamedTitle;
      }
    },

    /**
     * Updates token count information for a conversation
     */
    updateConversationTokenCount: (
      state,
      action: PayloadAction<ConversationTokenCountPayload>
    ) => {
      const { conversationId, tokenCount } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].tokenCount = tokenCount;
      }
    },

    /**
     * Adds a new message or updates an existing one
     */
    addMessage: (
      state,
      action: PayloadAction<MessagePayload>
    ) => {
      const { conversationId, message } = action.payload;

      if (state.conversations[conversationId]) {
        const messageIndex = state.conversations[conversationId].messages.findIndex(
          (value: ChatMessage) => value.id === message.id
        );

        // Add new message or update existing one
        if (messageIndex === -1) {
          state.conversations[conversationId].messages.push(message);
        } else {
          state.conversations[conversationId].messages[messageIndex] = message;
        }

        // Update current conversation reference if needed
        if (conversationId === state.currentConversationId && state.currentConversation) {
          state.currentConversation.messages = state.conversations[conversationId].messages;
        }
      } else {
        console.error('[M31 Mini] addMessage - Conversation not found', conversationId);
      }
    },

    /**
     * Updates an existing message
     */
    updateMessage: (
      state,
      action: PayloadAction<MessagePayload>
    ) => {
      const { conversationId, message, messageId } = action.payload;
      const conversation = state.conversations[conversationId];

      if (conversation) {
        const messageIndex = conversation.messages.findIndex(
          (value: ChatMessage) => value.id === (messageId ?? message.id)
        );

        if (messageIndex !== -1) {
          conversation.messages.splice(messageIndex, 1, message);
        }

        // Update current conversation reference if needed
        if (conversationId === state.currentConversationId && state.currentConversation) {
          state.currentConversation.messages = conversation.messages;
        }
      }
    },

    /**
     * Updates the content of an existing message
     */
    updateMessageContent: (
      state,
      action: PayloadAction<MessageContentPayload>
    ) => {
      const { conversationId, messageId, content, rawContent, done } = action.payload;
      const conversation = state.conversations[conversationId];

      if (conversation) {
        const messageIndex = conversation.messages.findIndex(
          (value: ChatMessage) => value.id === messageId
        );

        if (messageIndex !== -1) {
          // Update message content
          conversation.messages[messageIndex].content = content;

          // Update raw content if provided
          if (rawContent) {
            conversation.messages[messageIndex].rawContent = rawContent;
          }

          // Update timestamp and completion status
          conversation.messages[messageIndex].updatedAt = Date.now();
          conversation.messages[messageIndex].done = done ?? false;

          // Update conversation progress state if done status provided
          if (done !== undefined) {
            conversation.inProgress = !done;
          }

          // Update current conversation reference if needed
          if (conversationId === state.currentConversationId && state.currentConversation) {
            state.currentConversation.messages = conversation.messages;
          }
        }
      }
    },

    /**
     * Clears all messages from a conversation
     */
    clearMessages: (
      state,
      action: PayloadAction<ConversationIdPayload>
    ) => {
      const { conversationId } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].messages = [];

        // Update current conversation reference if needed
        if (conversationId === state.currentConversationId && state.currentConversation) {
          state.currentConversation.messages = [];
        }
      }
    },

    /**
     * Removes a specific message from a conversation
     */
    removeMessage: (
      state,
      action: PayloadAction<MessageIdPayload>
    ) => {
      const { conversationId, messageId } = action.payload;
      const conversation = state.conversations[conversationId];

      if (conversation) {
        const messageIndex = conversation.messages.findIndex(
          (m: ChatMessage) => m.id === messageId
        );

        if (messageIndex !== -1) {
          conversation.messages.splice(messageIndex, 1);

          // Update current conversation reference if needed
          if (conversationId === state.currentConversationId && state.currentConversation) {
            state.currentConversation.messages = conversation.messages;
          }
        }
      }
    },

    /**
     * Sets the current active conversation
     */
    setCurrentConversationId: (
      state,
      action: PayloadAction<ConversationIdPayload>
    ) => {
      state.currentConversationId = action.payload.conversationId;
      state.currentConversation = state.conversations[action.payload.conversationId];
    },

    /**
     * Updates the in-progress state of a conversation
     */
    setInProgress: (
      state,
      action: PayloadAction<InProgressPayload>
    ) => {
      const { conversationId, inProgress } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].inProgress = inProgress;
      }
    },

    /**
     * Updates the autoscroll setting of a conversation
     */
    setAutoscroll: (
      state,
      action: PayloadAction<AutoscrollPayload>
    ) => {
      const { conversationId, autoscroll } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].autoscroll = autoscroll;
      }
    },

    /**
     * Updates the verbosity setting of a conversation
     */
    setVerbosity: (
      state,
      action: PayloadAction<VerbosityPayload>
    ) => {
      const { conversationId, verbosity } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].verbosity = verbosity;
      }
    },

    /**
     * Sets the AI model for a conversation
     */
    setModel: (
      state,
      action: PayloadAction<ConversationModelPayload>
    ) => {
      const { conversationId, model } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].model = model;
      }
    },

    /**
     * Updates the current user input for a conversation
     */
    updateUserInput: (
      state,
      action: PayloadAction<UserInputPayload>
    ) => {
      const { conversationId, userInput } = action.payload;

      if (state.conversations[conversationId]) {
        state.conversations[conversationId].userInput = userInput;

        // Update current conversation reference if needed
        if (conversationId === state.currentConversationId && state.currentConversation) {
          state.currentConversation.userInput = userInput;
        }
      }
    },
  },
});

// Export action creators
export const {
  addConversation,
  removeConversation,
  updateConversation,
  updateConversationMessages,
  updateConversationModel,
  updateConversationTitle,
  aiRenamedTitle,
  updateConversationTokenCount,
  addMessage,
  updateMessage,
  updateMessageContent,
  clearMessages,
  removeMessage,
  setCurrentConversationId,
  setInProgress,
  setAutoscroll,
  setVerbosity,
  setModel,
  updateUserInput,
} = conversationSlice.actions;

// Export the reducer
export default conversationSlice.reducer;
