import classNames from "classnames";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import { addConversation, removeConversation } from "../store/conversation";
import { Conversation, Verbosity } from "../types";
import Icon, { IconName } from "./Icon";
import TabsDropdown from "./TabsDropdown";

// Subcomponent for the "Close" button
function TabCloseButton({
  path,
  onClick,
}: {
  path: string;
  onClick: Function;
}) {
  const location = useLocation();

  return (
    <button
      className={classNames(
        "ml-1 p-0.5 group-hover:opacity-100 group-focus-within:opacity-100 focus:outline-none hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] rounded-sm transition-colors",
        location.pathname === path ? "opacity-100" : "opacity-0"
      )}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
    >
      <Icon name={IconName.Close} className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" />
      <span className="sr-only">Close tab</span>
    </button>
  );
}

// Subcomponent for the "Link" tab
function TabLink({
  tab,
  conversationList,
  currentConversation,
  createNewConversation,
}: {
  tab: { name: string; id: string; href: string; };
  conversationList: Conversation[];
  currentConversation: Conversation;
  createNewConversation: any;
}) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isActive = location.pathname === `/chat/${encodeURI(tab.id)}`;

  return (
    <li key={tab.id}>
      <Link
        className={classNames(
          "h-full flex items-center group whitespace-nowrap text-[10px] focus:outline-none",
          isActive
            ? "bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)]"
            : "bg-transparent hover:bg-[rgba(0,0,0,0.01)] dark:hover:bg-[rgba(255,255,255,0.01)]",
          "transition-colors"
        )}
        to={tab.href}
        aria-current={isActive ? "page" : undefined}
      >
        <span
          className={classNames(
            "flex items-center gap-x-1 py-1 pl-2 pr-1",
            isActive
              ? "text-gray-700 dark:text-gray-300"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
            isActive ? "border-l-[2px] border-l-gray-400/40 pl-[7px]" : "border-l-[2px] border-l-transparent"
          )}
        >
          <span className="pt-0.5">{tab.name}</span>
          <TabCloseButton
            path={`/chat/${encodeURI(tab.id)}`}
            onClick={() => {
              // navigate to the first tab
              // if there's no more chats, create a new one
              if (conversationList.length === 1) {
                createNewConversation();
              } else if (currentConversation.title === tab.name) {
                navigate(
                  `/chat/${encodeURI(
                    conversationList[0].id === tab.id
                      ? conversationList[1].id
                      : conversationList[0].id
                  )}`
                );
              }

              // remove the tab from the list
              dispatch(removeConversation(tab.id));
            }}
          />
        </span>
      </Link>
    </li>
  );
}

export default function Tabs({
  conversationList,
  currentConversationId,
}: {
  conversationList: Conversation[];
  currentConversationId: string;
}) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );
  const location = useLocation();
  const [tabs, setTabs] = useState(
    [] as {
      name: string;
      id: string;
      href: string;
    }[]
  );
  const [currentConversation, setCurrentConversation] = useState(
    {} as Conversation
  );
  const selectRef = React.useRef<HTMLSelectElement>(null);
  const tabListRef = React.useRef<HTMLUListElement>(null);
  const [showLocalLlmTab, setShowLocalLlmTab] = useState(false);
  const [showActionsTab, setShowActionsTab] = useState(false);

  useEffect(() => {
    if (location.pathname === "/api") {
      setShowLocalLlmTab(true);
    } else if (location.pathname === "/actions") {
      setShowActionsTab(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (conversationList && conversationList.find) {
      setCurrentConversation(
        conversationList.find(
          (conversation) => conversation.id === currentConversationId
        ) ?? conversationList[0]
      );
    } else {
      console.warn(
        "[M31 Mini] conversationList is null",
        JSON.stringify(conversationList)
      );
    }
  }, [currentConversationId, conversationList]);

  useEffect(() => {
    // update the select element
    if (selectRef?.current) {
      selectRef.current.value = currentConversation.title ?? "Chat";
    }
  }, [currentConversation]);

  useEffect(() => {
    if (conversationList && conversationList.map) {
      setTabs([
        // { name: "Prompts", href: "/prompts" id: "prompts" },
        // { name: "Actions", href: "/actions" id: "actions" },
        ...conversationList.map((conversation) => ({
          name: conversation.title ?? "Chat",
          id: conversation.id,
          href: `/chat/${encodeURI(conversation.id)}`,
        })),
      ]);
    } else {
      console.warn(
        "[M31 Mini] conversationList is null",
        JSON.stringify(conversationList)
      );
    }
  }, [conversationList]);

  const createNewConversation = () => {
    let title = "Chat";
    let i = 2;
    while (
      conversationList.find((conversation) => conversation.title === title)
    ) {
      title = `Chat ${i}`;
      i++;
    }

    const newConversation: Conversation = {
      id: `${title}-${Date.now()}`,
      title,
      messages: [],
      inProgress: false,
      createdAt: Date.now(),
      model: currentConversation.model,
      verbosity: settings?.verbosity ?? currentConversation.verbosity ?? Verbosity.normal,
      autoscroll: true,
      tools: {},
    };

    // add the new conversation to the store
    dispatch(addConversation(newConversation));

    // navigate to the new conversation
    navigate(`/chat/${encodeURI(newConversation.id)}`);
  };

  const isTabsOverflowingX = () => {
    if (!tabListRef?.current) { return false; }

    return tabListRef.current.scrollWidth > tabListRef.current.clientWidth;
  };

  return (
    <div className="flex flex-col h-9">
      <div className="flex items-center justify-between border-b border-tab-inactive/30 h-full">
        <div className="flex h-full overflow-x-auto no-scrollbar z-10 relative">
          <ul
            className="flex border-r border-tab-inactive/30 text-[11px] font-thin h-full"
            ref={tabListRef}
          >
            {tabs.map((tab) => (
              <TabLink
                key={tab.id}
                tab={tab}
                conversationList={conversationList}
                currentConversation={currentConversation}
                createNewConversation={createNewConversation}
              />
            ))}
            <li className="flex items-center">
              <button
                className="h-full flex items-center p-1 text-gray-500 dark:text-gray-400 hover:bg-[rgba(0,0,0,0.01)] dark:hover:bg-[rgba(255,255,255,0.01)] hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                onClick={createNewConversation}
                title="New Chat"
              >
                <Icon name={IconName.Plus} className="w-3 h-3" />
                <span className="sr-only">New Chat</span>
              </button>
            </li>
          </ul>
        </div>
        <div className="flex items-center h-full">
          <TabsDropdown
            conversationList={conversationList}
            createNewConversation={createNewConversation}
          />
          <Link
            to="/api"
            aria-current={location.pathname === "/api" ? "page" : undefined}
            className={classNames(
              "flex h-full items-center gap-1 py-1 px-2 text-[11px] whitespace-nowrap",
              location.pathname === "/api"
                ? "text-gray-700 dark:text-gray-300 bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)]"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-[rgba(0,0,0,0.01)] dark:hover:bg-[rgba(255,255,255,0.01)]",
              "transition-colors"
            )}
          >
            <span>API</span>
          </Link>
          <Link
            to="/actions"
            aria-current={location.pathname === "/actions" ? "page" : undefined}
            className={classNames(
              "flex h-full items-center gap-1 py-1 px-2 text-[11px] whitespace-nowrap border-l border-tab-inactive/30",
              location.pathname === "/actions"
                ? "text-gray-700 dark:text-gray-300 bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)]"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-[rgba(0,0,0,0.01)] dark:hover:bg-[rgba(255,255,255,0.01)]",
              "transition-colors"
            )}
          >
            <span>Actions</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
