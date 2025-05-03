/// <reference lib="dom" />

import vscode from 'vscode';
import { ApiProvider } from "./openai-api-provider";
import { ApiKeyStatus, ViewOptionsState } from "./renderer/store/app";
import { ChatMessage, Conversation, ExtensionSettings, Model } from "./renderer/types";
import {
  ActionCompleteMessage,
  ActionErrorMessage,
  AddErrorMessage,
  AddMessageMessage,
  BaseFrontendMessage,
  FrontendMessageType,
  MessagesUpdatedMessage,
  ModelsUpdateMessage,
  SetConversationModelMessage,
  SettingsUpdateMessage,
  ShowInProgressMessage,
  StreamMessageMessage,
  UpdateApiKeyStatusMessage,
  UpdateMessageMessage,
  UpdateTokenCountMessage,
  ViewOptionsUpdateMessage
} from "./renderer/types-messages";

/**
 * Handles communication from the extension backend to the webview frontend
 * Implements a message queue to ensure no messages are lost when the webview isn't ready
 */
export default class Messenger {
  private webView?: vscode.WebviewView | null;
  private messageQueue: BaseFrontendMessage[] = [];
  private api: ApiProvider | null = null;

  /**
   * Sets the webview reference for sending messages
   * 
   * @param webView - The VS Code webview to communicate with
   */
  setWebView(webView: vscode.WebviewView): void {
    this.webView = webView;
    this.flushMessageQueue();
  }

  /**
   * Sets the API provider for model-related operations
   * 
   * @param api - The API provider instance
   */
  setApiProvider(api: ApiProvider): void {
    this.api = api;
  }

  /**
   * Sends any queued messages to the webview
   */
  private flushMessageQueue(): void {
    if (!this.webView) {
      return;
    }

    while (this.messageQueue.length > 0) {
      const queuedMessage = this.messageQueue.shift();
      if (queuedMessage) {
        this.webView.webview.postMessage(queuedMessage);
      }
    }
  }

  /**
   * Sends a message to the webview, queuing it if the webview isn't ready
   * 
   * @param message - The message to send to the frontend
   */
  sendMessage(message: BaseFrontendMessage): void {
    if (this.webView) {
      // First send any queued messages
      this.flushMessageQueue();

      // Then send the current message
      this.webView.webview.postMessage(message);
    } else {
      // Queue the message for later delivery
      this.messageQueue.push(message);
    }
  }

  /**
   * Sends the list of available models to the frontend
   * 
   * @param models - Optional list of models to send (fetches from API if not provided)
   */
  async sendModels(models: Model[] = []): Promise<void> {
    if (!this.api) {
      console.error("[M31 Mini] Unable to send models, API provider is not set.");
      return;
    }

    try {
      // If no models provided, fetch them from the API
      if (!models.length) {
        models = await this.api.getModelList() ?? [];
      }

      this.sendMessage({
        type: FrontendMessageType.modelsUpdate,
        models,
      } as ModelsUpdateMessage);
    } catch (error) {
      console.error("[M31 Mini] Error sending models:", error);
    }
  }

  /**
   * Updates the model associated with a conversation
   * 
   * @param model - The model to associate with the conversation
   * @param conversation - The conversation to update
   */
  setConversationModel(model: Model, conversation: Conversation): void {
    this.sendMessage({
      type: FrontendMessageType.setConversationModel,
      model,
      conversationId: conversation.id
    } as SetConversationModelMessage);
  }

  /**
   * Sends updated extension settings to the frontend
   * 
   * @param config - The updated configuration
   */
  sendUpdatedSettings(config: vscode.WorkspaceConfiguration): void {
    this.sendMessage({
      type: FrontendMessageType.settingsUpdate,
      config: config as unknown as ExtensionSettings,
    } as SettingsUpdateMessage);
  }

  /**
   * Sends settings update to the frontend
   * 
   * @param config - The updated configuration
   */
  sendSettingsUpdate(config: vscode.WorkspaceConfiguration): void {
    this.sendUpdatedSettings(config);
  }

  /**
   * Sends the API key status to the frontend
   * 
   * @param status - The current API key status
   */
  sendApiKeyStatus(status: ApiKeyStatus): void {
    this.sendMessage({
      type: FrontendMessageType.updateApiKeyStatus,
      status,
    } as UpdateApiKeyStatusMessage);
  }

  /**
   * Sends updated view options to the frontend
   * 
   * @param viewOptions - The updated view options
   */
  sendViewOptionsUpdate(viewOptions: ViewOptionsState | Record<string, never>): void {
    const defaultViewOptions: ViewOptionsState = {
      hideName: false,
      showCodeOnly: false,
      showMarkdown: false,
      alignRight: false,
      showCompact: false,
      showNetworkLogs: false,
      showEditorSelection: true,
      showClear: true,
      showVerbosity: true,
      showModelSelect: true,
      showTokenCount: true
    };

    const safeViewOptions = Object.keys(viewOptions).length === 0
      ? defaultViewOptions
      : viewOptions as ViewOptionsState;

    this.sendMessage({
      type: FrontendMessageType.viewOptionsUpdate,
      viewOptions: safeViewOptions,
    } as ViewOptionsUpdateMessage);
  }

  /**
   * Updates the list of messages for a conversation
   * 
   * @param messages - The updated list of messages
   * @param conversationId - The ID of the conversation to update
   */
  sendMessagesUpdated(messages: ChatMessage[], conversationId: string): void {
    this.sendMessage({
      type: FrontendMessageType.messagesUpdated,
      chatMessages: messages,
      conversationId,
    } as MessagesUpdatedMessage);
  }

  /**
   * Updates the in-progress status for a conversation
   * 
   * @param inProgress - Whether the conversation is in progress
   * @param conversationId - The ID of the conversation to update
   */
  sendShowInProgress(inProgress: boolean, conversationId: string): void {
    this.sendMessage({
      type: FrontendMessageType.showInProgress,
      inProgress,
      conversationId,
    } as ShowInProgressMessage);
  }

  /**
   * Updates a specific message in a conversation
   * 
   * @param message - The updated message
   * @param conversationId - The ID of the conversation containing the message
   */
  sendUpdateMessage(message: ChatMessage, conversationId: string): void {
    this.sendMessage({
      type: FrontendMessageType.updateMessage,
      chatMessage: message,
      conversationId,
    } as UpdateMessageMessage);
  }

  /**
   * Adds a new message to a conversation
   * 
   * @param chatMessage - The message to add
   * @param conversationId - The ID of the conversation to add the message to
   */
  sendAddMessage(chatMessage: ChatMessage, conversationId: string): void {
    this.sendMessage({
      type: FrontendMessageType.addMessage,
      chatMessage,
      conversationId,
    } as AddMessageMessage);
  }

  /**
   * Sends a streaming message update to the frontend
   * 
   * @param conversationId - The ID of the conversation
   * @param messageId - The ID of the message being streamed
   * @param content - The formatted content
   * @param rawContent - The raw content
   */
  sendStreamMessage(
    conversationId: string,
    messageId: string,
    content: string,
    rawContent: string
  ): void {
    this.sendMessage({
      type: FrontendMessageType.streamMessage,
      conversationId,
      chatMessageId: messageId,
      content,
      rawContent,
    } as StreamMessageMessage);
  }

  /**
   * Sends an error message to the frontend
   * 
   * @param id - The ID for the error message
   * @param conversationId - The ID of the conversation
   * @param value - The error message text
   */
  sendAddError(id: string, conversationId: string, value: string): void {
    this.sendMessage({
      type: FrontendMessageType.addError,
      id,
      conversationId,
      value,
    } as AddErrorMessage);
  }

  /**
   * Notifies the frontend that an action has completed successfully
   * 
   * @param actionId - The ID of the completed action
   * @param actionResult - The result of the action
   */
  sendActionComplete(actionId: string, actionResult: unknown): void {
    this.sendMessage({
      type: FrontendMessageType.actionComplete,
      actionId,
      actionResult
    } as ActionCompleteMessage);
  }

  /**
   * Notifies the frontend that an action has failed
   * 
   * @param actionId - The ID of the failed action
   * @param error - The error that occurred
   */
  sendActionError(actionId: string, error: Error): void {
    this.sendMessage({
      type: FrontendMessageType.actionError,
      actionId,
      error: error?.message ?? "Unknown error"
    } as ActionErrorMessage);
  }

  /**
   * Sends token count information to the frontend
   * 
   * @param convTokens - The number of tokens in the conversation
   * @param userInputTokens - The number of tokens in the user input
   * @param conversationId - The ID of the conversation
   */
  sendTokenCount(
    convTokens: number,
    userInputTokens: number,
    conversationId: string
  ): void {
    this.sendMessage({
      type: FrontendMessageType.tokenCount,
      tokenCount: {
        messages: convTokens,
        userInput: userInputTokens,
        minTotal: convTokens + userInputTokens,
      },
      conversationId,
    } as UpdateTokenCountMessage);
  }
}
