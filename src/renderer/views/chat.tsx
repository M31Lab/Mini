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
    <div className="text-gray-500 text-[9px] font-mono p-1.5">
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
      <div className={`flex flex-col ${settings?.minimalUI ? "pb-16" : "pb-20"}`}>
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
    <div className="w-full overflow-y-auto flex-grow relative bg-white dark:bg-gray-900">
      {/* Debug information if enabled */}
      {debug && <DebugComponent conversation={conversation} />}

      {/* Main content container */}
      <div className="relative z-10 mx-auto px-2">
        {/* Introduction splash when no messages */}
        <IntroductionSplash
          className={conversation.messages?.length > 0 ? "hidden" : ""}
          vscode={vscode}
        />

        {/* Message list */}
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
