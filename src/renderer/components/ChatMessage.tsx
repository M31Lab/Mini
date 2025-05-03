import classNames from "classnames";
import DOMPurify from "dompurify";
import React, { ReactElement, useRef } from "react";
import { useModelFriendlyName } from "../helpers";
import { useAppSelector } from "../hooks";
import { useMessenger } from "../send-to-backend";
import { RootState } from "../store";
import { ChatMessage as ChatMessageType, Conversation, Role } from "../types";
import CodeBlock from "./CodeBlock";
import Icon, { IconName } from "./Icon";

/**
 * Text strings used in the chat interface
 */
const CHAT_STRINGS = {
  send: "Send",
  cancel: "Cancel",
  you: "You"
};

/**
 * Interface for message component props
 */
interface MessageComponentProps {
  message: ChatMessageType;
  conversation: Conversation;
  index: number;
  vscode: any;
}

/**
 * Displays error messages with special handling for common errors
 */
const ErrorMessageComponent = ({ message }: { message: ChatMessageType; }): ReactElement => {
  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );

  const isPrematureCloseError = message.rawContent.includes("Premature close") &&
    settings?.gpt3.apiBaseUrl.includes("localhost:5000");

  // Extract error type for better visualization
  const errorType = message.rawContent.includes("Premature close")
    ? "Connection Error"
    : message.rawContent.includes("API key")
      ? "Authentication Error"
      : message.rawContent.includes("rate limit")
        ? "Rate Limit Error"
        : "Error";

  return (
    <div className="rounded-lg overflow-hidden border border-red-300 dark:border-red-700">
      <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-2 font-medium flex items-center gap-2">
        <Icon name={IconName.AlertTriangle} className="w-5 h-5" />
        <span>{errorType}</span>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 text-sm">
        <div className="text-gray-700 dark:text-gray-300">
          {(message.content ?? message.rawContent)
            .split("\n")
            .map((line: string, index: number) => (
              <p className="py-1" key={index}>
                {line}
              </p>
            ))}
        </div>

        {isPrematureCloseError && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-600 text-xs">
            <p className="font-medium mb-1">Troubleshooting Tip:</p>
            <p>
              It looks like you're running{" "}
              <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded">text-generation-webui</code>.
              If you're getting "Premature close" errors, you may need to load a
              model in the webui before using the API.
            </p>
            <p className="mt-2">
              Go to{" "}
              <a
                href="http://127.0.0.1:7860"
                className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
              >
                http://127.0.0.1:7860
              </a>
              {" "}and select a model.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Displays debug information about a message
 */
const DebugMessageComponent = ({ message }: { message: ChatMessageType; }): ReactElement => {
  const createdAtDate = new Date(message?.createdAt ?? "");
  const formattedDate = createdAtDate.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="text-xs text-gray-500">
      <div>Message ID: {message?.id}</div>
      <div>Message Author: {message?.role}</div>
      <div>Message createdAt: {formattedDate}</div>
      <div>Message done: {message?.done ? "true" : "false"}</div>
    </div>
  );
};

/**
 * Provides an editable textarea for modifying a message
 */
const EditMessageComponent = ({
  message,
  editingMessageRef,
}: {
  message: ChatMessageType;
  editingMessageRef: React.RefObject<HTMLTextAreaElement>;
}): ReactElement => {
  const hideName = useAppSelector(
    (state: RootState) => state.app.viewOptions.hideName
  );

  const defaultValue = message.role === Role.user
    ? message.rawContent
    : message.content;

  return (
    <div
      className={classNames("flex flex-col gap-y-2", {
        "max-w-[80%]": hideName,
      })}
    >
      <textarea
        className="w-full h-24 resize-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 font-mono text-sm whitespace-pre-wrap"
        defaultValue={defaultValue}
        ref={editingMessageRef}
        aria-label="Edit message"
        spellCheck="false"
      />
    </div>
  );
};

/**
 * Renders user message content with special handling for code blocks
 */
const UserMessageComponent = ({
  vscode,
  conversation,
  message,
  editingMessageID,
  editingMessageRef,
}: {
  vscode: any;
  conversation: Conversation;
  message: ChatMessageType;
  editingMessageID: string | null;
  editingMessageRef: React.RefObject<HTMLTextAreaElement>;
}): ReactElement => {
  const showMarkdown = useAppSelector(
    (state: RootState) => state.app.viewOptions.showMarkdown
  );
  const alignRight = useAppSelector(
    (state: RootState) => state.app.viewOptions.alignRight
  );

  // If this message is being edited, show the edit component
  if (message.id === editingMessageID) {
    return (
      <EditMessageComponent
        message={message}
        editingMessageRef={editingMessageRef}
      />
    );
  }

  // Split content into text and code blocks
  const contentParts = message.rawContent
    .replace(/\n/g, "<br/>")
    .split(/(<pre><code[^>]*>[\s\S]*?<\/code><\/pre>)/g)
    .filter(Boolean);

  return (
    <div
      className={classNames(
        "message-wrapper",
        message?.done ?? true ? "" : "result-streaming",
        {
          "max-w-[80%]": alignRight,
          "float-right": alignRight,
        }
      )}
    >
      {contentParts.map((item: string, index: number) => {
        // Handle code blocks
        if (item.startsWith("<pre><code") && !showMarkdown) {
          return (
            <CodeBlock
              code={item}
              key={index}
              conversationId={conversation.id}
              vscode={vscode}
            />
          );
        }

        // Handle regular text
        return (
          <div key={index}>
            {item
              .replace(/<br\s*\/?>\n/gi, "<br>") // Remove double newlines
              .split(/(?:\n|<br\s*\/?>)/gi) // Split on newlines and <br> tags
              .map((line: string, lineIndex: number) =>
                showMarkdown ? (
                  <pre key={lineIndex} className="py-1 text-pretty">
                    {line}
                  </pre>
                ) : (
                  <pre key={lineIndex} className="my-0 text-pretty font-sans whitespace-pre-wrap break-words">
                    {line}
                  </pre>
                )
              )}
          </div>
        );
      })}

      {/* Render attached code if present */}
      {message.questionCode && (
        <CodeBlock
          code={message.questionCode}
          conversationId={conversation.id}
          vscode={vscode}
          startCollapsed={message.questionCode.split("\n").length > 3}
          role={Role.user}
        />
      )}
    </div>
  );
};

/**
 * Renders AI assistant message content with special handling for code blocks
 */
const BotMessageComponent = ({
  vscode,
  conversation,
  message,
}: {
  vscode: any;
  conversation: Conversation;
  message: ChatMessageType;
}): ReactElement => {
  const showMarkdown = useAppSelector(
    (state: RootState) => state.app.viewOptions.showMarkdown
  );
  const codeOnly = useAppSelector(
    (state: RootState) => state.app.viewOptions.showCodeOnly
  );
  const alignRight = useAppSelector(
    (state: RootState) => state.app.viewOptions.alignRight
  );

  // Choose content based on view options
  const content = showMarkdown
    ? message.rawContent.replace(/\n/g, "<br/>")
    : message.content;

  // Split content into text and code blocks
  const contentParts = content
    .split(/(<pre><code[^>]*>[\s\S]*?<\/code><\/pre>)/g)
    .filter(Boolean);

  return (
    <div
      className={classNames(
        "message-wrapper",
        message?.done ?? true ? "" : "result-streaming",
        {
          "max-w-[80%]": alignRight,
        }
      )}
    >
      {contentParts.map((item: string, index: number) => {
        // Handle code blocks
        if (item.startsWith("<pre><code") && !showMarkdown) {
          return (
            <CodeBlock
              code={item}
              key={index}
              conversationId={conversation.id}
              vscode={vscode}
            />
          );
        }

        // Handle regular text (if not in code-only mode)
        if (!codeOnly) {
          if (showMarkdown) {
            return (
              <div key={index}>
                {item
                  .replace(/<br\s*\/?>\n/gi, "<br>") // Remove double newlines
                  .split(/(?:\n|<br\s*\/?>)/gi) // Split on newlines and <br> tags
                  .map((line: string, lineIndex: number) => (
                    <pre key={lineIndex} className="py-1 text-pretty">
                      {line}
                    </pre>
                  ))}
              </div>
            );
          } else {
            // Process the item to preserve whitespace in HTML
            const processedItem = item
              .replace(/<br\s*\/?>\n/gi, "<br>") // Remove double newlines
              .split(/(?:\n|<br\s*\/?>)/gi) // Split on newlines and <br> tags
              .map(line => `<pre class="my-0 text-pretty font-sans whitespace-pre-wrap break-words">${DOMPurify.sanitize(line)}</pre>`)
              .join('');

            return (
              <div
                key={index}
                dangerouslySetInnerHTML={{ __html: processedItem }}
              />
            );
          }
        }

        return null;
      })}
    </div>
  );
};

/**
 * Renders the appropriate message body based on the message role
 */
const MessageBodyComponent = ({
  message,
  vscode,
  editingMessageID,
  conversation,
  editingMessageRef,
}: {
  message: ChatMessageType;
  vscode: any;
  editingMessageID: string | null;
  conversation: Conversation;
  editingMessageRef: React.RefObject<HTMLTextAreaElement>;
}): ReactElement => {
  return message.role === Role.user ? (
    <UserMessageComponent
      vscode={vscode}
      conversation={conversation}
      message={message}
      editingMessageID={editingMessageID}
      editingMessageRef={editingMessageRef}
    />
  ) : (
    <BotMessageComponent
      vscode={vscode}
      conversation={conversation}
      message={message}
    />
  );
};

/**
 * Renders the message editing options (edit, send, cancel)
 */
const ChatMessageOptions = ({
  className,
  message,
  conversation,
  index,
  editingMessageID,
  setEditingMessageID,
  editingMessageRef,
  vscode,
}: {
  className?: string;
  message: ChatMessageType;
  conversation: Conversation;
  index: number;
  editingMessageID: string | null;
  setEditingMessageID: (id: string) => void;
  editingMessageRef: React.RefObject<HTMLTextAreaElement>;
  vscode: any;
}): ReactElement => {
  const backendMessenger = useMessenger(vscode);
  const isEditing = editingMessageID === message.id;

  /**
   * Handles sending the edited message
   */
  const handleSendClick = (): void => {
    const newQuestion = editingMessageRef.current?.value ?? "";

    backendMessenger.sendAddFreeTextQuestion({
      conversation,
      question: newQuestion,
      includeEditorSelection: false,
      questionId: message.id,
      messageId: conversation.messages[index + 2]?.id ?? "",
      code: message?.questionCode ?? "",
    });

    setEditingMessageID("");
  };

  return (
    <div className={classNames("flex items-center", className)}>
      {/* Edit mode buttons (send/cancel) */}
      <div
        className={classNames("send-cancel-elements-ext gap-2", {
          hidden: !isEditing
        })}
      >
        <button
          className="send-element-ext p-1 pr-2 flex items-center"
          onClick={handleSendClick}
          aria-label="Send edited message"
        >
          <Icon name={IconName.Send} className="w-3 h-3 mr-1" />
          {CHAT_STRINGS.send}
        </button>
        <button
          className="cancel-element-ext p-1 pr-2 flex items-center"
          onClick={() => setEditingMessageID("")}
          aria-label="Cancel editing"
        >
          <Icon name={IconName.Cancel} className="w-3 h-3 mr-1" />
          {CHAT_STRINGS.cancel}
        </button>
      </div>

      {/* Edit button (pencil icon) */}
      <button
        className={classNames("p-1.5 flex items-center rounded", {
          hidden: isEditing,
        })}
        data-tooltip-id="message-tooltip"
        data-tooltip-content="Edit and resend this prompt"
        onClick={() => setEditingMessageID(message.id)}
        aria-label="Edit message"
      >
        <Icon name={IconName.Pencil} className="w-3 h-3" />
      </button>
    </div>
  );
};

/**
 * Renders the name/avatar for a message
 */
const Name = ({
  message,
  modelFriendlyName,
}: {
  message: ChatMessageType;
  modelFriendlyName?: string;
}): ReactElement => {
  const alignRight = useAppSelector(
    (state: RootState) => state.app.viewOptions.alignRight
  );

  const isUserMessage = message.role === Role.user;
  const displayName = isUserMessage ? CHAT_STRINGS.you : (modelFriendlyName ?? "ChatGPT");
  const iconName = isUserMessage ? "user" : "box";

  // Enhanced avatar styles with gradients and better visual treatment
  const avatarClasses = isUserMessage
    ? "bg-gradient-to-br from-blue-400 to-indigo-500 text-white dark:from-blue-500 dark:to-indigo-600"
    : "bg-gradient-to-br from-purple-400 to-pink-500 text-white dark:from-purple-500 dark:to-pink-600";

  return (
    <h2
      className={classNames("flex-grow flex items-center gap-3", {
        "flex-row-reverse": isUserMessage && alignRight,
      })}
    >
      {/* Avatar with enhanced styling */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-20 group-hover:opacity-40 blur-sm transition-all duration-300"></div>
        <div className={`${avatarClasses} p-2 rounded-full flex items-center justify-center shadow-sm relative z-10`}>
          <Icon name={IconName[iconName as keyof typeof IconName]} className="w-4 h-4" />
        </div>
      </div>

      {/* Name with more styled typography */}
      <div className="flex flex-col">
        <span className={`font-semibold text-sm ${isUserMessage ? "text-blue-700 dark:text-blue-300" : "text-purple-700 dark:text-purple-300"}`}>
          {displayName}
        </span>

        {/* Subtle timestamp */}
        <span className="text-xs text-gray-400">
          {new Date(message?.createdAt ?? "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Enhanced typing indicator when message is not done */}
      {!message.done && !isUserMessage && (
        <div className="flex items-center gap-1 ml-2 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Typing</span>
          <span className="flex gap-1">
            <span className="inline-block w-1.5 h-1.5 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
            <span className="inline-block w-1.5 h-1.5 bg-fuchsia-500 dark:bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
            <span className="inline-block w-1.5 h-1.5 bg-pink-500 dark:bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
          </span>
        </div>
      )}
    </h2>
  );
};

/**
 * Main chat message component that renders a complete message
 */
const ChatMessage: React.FC<MessageComponentProps> = ({
  message,
  conversation,
  index,
  vscode,
}): ReactElement => {
  // State and refs
  const [editingMessageID, setEditingMessageID] = React.useState<string | null>(null);
  const editingMessageRef = useRef<HTMLTextAreaElement>(null);

  // View options from app state
  const debug = useAppSelector((state: RootState) => state.app.debug);
  const hideName = useAppSelector((state: RootState) => state.app.viewOptions.hideName);
  const networkLogs = useAppSelector((state: RootState) => state.app.viewOptions.showNetworkLogs);
  const alignRight = useAppSelector((state: RootState) => state.app.viewOptions.alignRight);

  // App state
  const models = useAppSelector((state: RootState) => state.app.models);
  const settings = useAppSelector((state: RootState) => state.app.extensionSettings);

  // Get friendly name for the model
  const modelFriendlyName = useModelFriendlyName(conversation, models, settings);

  // Determine if this is a user message
  const isUserMessage = message.role === Role.user;

  // Determine background color based on message role
  const bgColorClass = isUserMessage ? "bg-input" : "bg-sidebar";

  return (
    <div
      className={`group/chat-message w-full flex flex-col gap-y-4 self-end question-element-ext relative
        ${isUserMessage
          ? "pl-4 pr-5 py-4 ml-6 md:ml-10 mr-2 md:mr-4 bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 dark:from-blue-900/40 dark:via-blue-900/20 dark:to-indigo-900/30 border-l-4 border-blue-400 dark:border-blue-600"
          : "pl-4 pr-5 py-4 mr-6 md:mr-10 ml-2 md:ml-4 bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-900/40 dark:via-fuchsia-900/20 dark:to-pink-900/30 border-l-4 border-purple-400 dark:border-purple-600"
        }
        rounded-lg shadow-sm my-4 transition-all duration-300
        hover:shadow-md hover:translate-x-0
        ${isUserMessage ? "hover:-translate-x-1" : "hover:translate-x-1"}`}
      key={message.id}
    >
      {/* Position indicator triangles */}
      <div className={`absolute top-4
        ${isUserMessage
          ? "right-full mr-1 border-r-blue-50 dark:border-r-blue-900/40"
          : "left-full ml-1 border-l-purple-50 dark:border-l-purple-900/40"
        }
        border-solid border-8 border-transparent`}>
      </div>

      {/* Header section with name and options */}
      {hideName ? (
        // Minimal header when names are hidden
        isUserMessage && (
          <ChatMessageOptions
            className="absolute top-2 right-2 opacity-0 group-hover/chat-message:opacity-100 group-focus-within/chat-message:opacity-100 transition-opacity duration-200"
            message={message}
            conversation={conversation}
            index={index}
            editingMessageID={editingMessageID}
            setEditingMessageID={setEditingMessageID}
            editingMessageRef={editingMessageRef}
            vscode={vscode}
          />
        )
      ) : (
        // Full header with name and options
        <header
          className={classNames("flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700", {
            "flex-row-reverse": isUserMessage && alignRight,
          })}
        >
          <Name message={message} modelFriendlyName={modelFriendlyName} />

          {isUserMessage && (
            <ChatMessageOptions
              className="opacity-0 group-hover/chat-message:opacity-100 group-focus-within/chat-message:opacity-100 transition-opacity duration-200"
              message={message}
              conversation={conversation}
              index={index}
              editingMessageID={editingMessageID}
              setEditingMessageID={setEditingMessageID}
              editingMessageRef={editingMessageRef}
              vscode={vscode}
            />
          )}
        </header>
      )}

      {/* Message content */}
      {message.isError ? (
        <div className="animate-pulse">
          <ErrorMessageComponent message={message} />
        </div>
      ) : (
        <div className={`${message?.done ? "" : "animate-pulse"}`}>
          <MessageBodyComponent
            message={message}
            conversation={conversation}
            vscode={vscode}
            editingMessageID={editingMessageID}
            editingMessageRef={editingMessageRef}
          />

          {/* Debug information if enabled */}
          {(debug || networkLogs) && (
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <DebugMessageComponent message={message} />
            </div>
          )}
        </div>
      )}

      {/* Timestamp indicator */}
      <div className="absolute bottom-1 right-2 text-[10px] text-gray-400 opacity-0 group-hover/chat-message:opacity-100 transition-opacity duration-200">
        {new Date(message?.createdAt ?? "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};

export default ChatMessage;
