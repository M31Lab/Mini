import React, { useEffect } from "react";
import { Tooltip } from "react-tooltip";
import ChatMessageComponent from "../components/ChatMessage";
import IntroductionSplash from "../components/IntroductionSplash";
import QuestionInputField from "../components/QuestionInputField";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import { setAutoscroll } from "../store/conversation";
import { ChatMessage, Conversation, Role } from "../types";

const CHAT_STRINGS = {
  CONVERSATION_ID: "Conversation ID: ",
  CONVERSATION_TITLE: "Conversation Title: ",
  CONVERSATION_DATETIME: "Conversation Datetime: ",
  CONVERSATION_MODEL: "Conversation Model: ",
  CONVERSATION_PROGRESS: "Conversation inProgress: "
};

type DebugComponentProps = {
  conversation: Conversation;
};

const DebugComponent = ({ conversation }: DebugComponentProps): React.ReactElement => {
  const formattedDateTime = new Date(conversation?.createdAt ?? "").toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="text-gray-500 text-[10px] font-mono">
      {CHAT_STRINGS.CONVERSATION_ID} {conversation?.id}
      <br />
      {CHAT_STRINGS.CONVERSATION_TITLE} {conversation?.title}
      <br />
      {CHAT_STRINGS.CONVERSATION_DATETIME} {formattedDateTime}
      <br />
      {CHAT_STRINGS.CONVERSATION_MODEL} {conversation.model?.id}
      <br />
      {CHAT_STRINGS.CONVERSATION_PROGRESS} {conversation?.inProgress ? "true" : "false"}
    </div>
  );
};

type MessageListProps = {
  conversation: Conversation;
  conversationListRef: React.RefObject<HTMLDivElement>;
  vscode: any;
};

const MessageList = ({
  conversation,
  conversationListRef,
  vscode,
}: MessageListProps): React.ReactElement => {
  const debug = useAppSelector((state: RootState) => state.app.debug);
  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );

  const isMessageVisible = (message: ChatMessage): boolean => {
    return debug || (message.role !== Role.system && Boolean(message.content));
  };

  const renderMessages = (): React.ReactElement[] => {
    return conversation.messages
      .filter(isMessageVisible)
      .map((message: ChatMessage, index: number) => (
        <ChatMessageComponent
          key={message.id}
          message={message}
          conversation={conversation}
          vscode={vscode}
          index={index}
        />
      ));
  };

  return (
    <div ref={conversationListRef}>
      <div className={`flex flex-col ${settings?.minimalUI ? "pb-20" : "pb-24"}`}>
        {renderMessages()}
        <Tooltip id="message-tooltip" />
      </div>
    </div>
  );
};

type ChatProps = {
  conversation: Conversation;
  conversationList: Conversation[];
  vscode: any;
};

export default function Chat({
  conversation,
  conversationList,
  vscode,
}: ChatProps): React.ReactElement {
  const dispatch = useAppDispatch();
  const debug = useAppSelector((state: RootState) => state.app.debug);
  const conversationListRef = React.useRef<HTMLDivElement>(null);

  const configureMarkedOptions = (): void => {
    const markedInstance = (window as any)?.marked;
    const highlightInstance = (window as any).hljs;

    if (markedInstance) {
      markedInstance.setOptions({
        renderer: new markedInstance.Renderer(),
        highlight: (code: string, _lang: string): string =>
          highlightInstance.highlightAuto(code).value,
        langPrefix: "hljs language-",
        pedantic: false,
        gfm: true,
        breaks: true,
        sanitize: false,
        smartypants: false,
        xhtml: false,
      });
    }
  };

  const scrollToBottom = (): void => {
    if (conversation.autoscroll && conversationListRef.current) {
      conversationListRef.current.scrollTo({
        top: conversationListRef.current.scrollHeight,
        behavior: "auto",
      });
    }
  };

  const handleScroll = (): void => {
    if (conversationListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = conversationListRef.current;
      const isAtBottom = scrollTop >= scrollHeight - clientHeight;
      const shouldToggleAutoscroll =
        (scrollTop < scrollHeight - clientHeight && conversation.autoscroll) ||
        (!conversation.autoscroll && isAtBottom);

      if (shouldToggleAutoscroll) {
        dispatch(
          setAutoscroll({
            conversationId: conversation.id,
            autoscroll: isAtBottom,
          })
        );
      }
    }
  };

  const attachScrollListener = (): void => {
    if (conversationListRef.current && !conversationListRef.current.onscroll) {
      conversationListRef.current.addEventListener("scroll", handleScroll, {
        passive: true,
      });
    }
  };

  useEffect(configureMarkedOptions, []);
  useEffect(scrollToBottom, [conversation.messages]);
  useEffect(attachScrollListener, [conversationListRef.current]);

  return (
    <div className="w-full overflow-y-auto flex-grow relative bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Background pattern - subtle geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute top-0 left-0 w-full h-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
              <pattern id="circle-pattern" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            <rect width="100%" height="100%" fill="url(#circle-pattern)" />
          </svg>
        </div>
      </div>

      {/* Debug information if enabled */}
      {debug && <DebugComponent conversation={conversation} />}

      {/* Main content container with improved spacing */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        {/* Introduction splash when no messages */}
        <IntroductionSplash
          className={conversation.messages?.length > 0 ? "hidden" : ""}
          vscode={vscode}
        />

        {/* Message list with improved layout */}
        <MessageList
          conversation={conversation}
          conversationListRef={conversationListRef}
          vscode={vscode}
        />

        {/* Question input at the bottom */}
        <QuestionInputField
          conversation={conversation}
          vscode={vscode}
          conversationList={conversationList}
        />
      </div>
    </div>
  );
}
