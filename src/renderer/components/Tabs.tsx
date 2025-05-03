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
        "ml-1 p-0.5 group-hover:opacity-100 group-focus-within:opacity-100 focus:outline-none hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] rounded-sm",
        location.pathname === path ? "opacity-100" : "opacity-0"
      )}
      onClick={(e) => {
        e.preventDefault();

        onClick(e);
      }}
    >
      <Icon name={IconName.Close} className="w-3 h-3" />
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

  return (
    <li key={tab.id}>
      <Link
        className={classNames(
          "h-full flex items-center group whitespace-nowrap text-[9px] focus:outline-none focus:underline",
          location.pathname === `/chat/${encodeURI(tab.id)}`
            ? "bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.03)] focus-within:bg-[rgba(0,0,0,0.03)] dark:focus-within:bg-[rgba(255,255,255,0.03)]"
            : "bg-transparent hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] focus-within:bg-[rgba(0,0,0,0.02)] dark:focus-within:bg-[rgba(255,255,255,0.02)]"
        )}
        to={tab.href}
        aria-current={
          location.pathname === `/chat/${encodeURI(tab.id)}`
            ? "page"
            : undefined
        }
      >
        <span
          className={classNames(
            "flex items-center gap-x-1 py-1 pl-2 pr-1",
            location.pathname === `/chat/${encodeURI(tab.id)}`
              ? "text-gray-800 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-200 focus-within:text-gray-800 dark:focus-within:text-gray-200"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus-within:text-gray-600 dark:focus-within:text-gray-300"
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

    const newConversation = {
      id: `${title}-${Date.now()}`,
      title,
      messages: [],
      inProgress: false,
      createdAt: Date.now(),
      model: currentConversation.model,
      autoscroll: true,
      verbosity:
        settings?.verbosity ??
        currentConversation?.verbosity ??
        Verbosity.normal,
      tools: {},
    } as Conversation;

    dispatch(addConversation(newConversation));

    // switch to the new conversation
    navigate(`/chat/${encodeURI(newConversation.id)}`);

    // scroll all the way to the right on delay to allow the tab to render
    setTimeout(() => {
      if (tabListRef.current) {
        tabListRef.current.scrollLeft = tabListRef.current.scrollWidth;
      }
    }, 100);
  };

  return (
    <>
      {/* Tab layout specifically for a skinny UI (switches to dropdown) or when the tab count exceeds 5 */}
      <div className={`${tabs.length > 5 ? "" : "2xs:hidden"}`}>
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <div className="flex flex-row divide-x divide-tab-inactive/20 border-b border-tab-inactive/30">
          <TabsDropdown
            tabs={tabs}
            currentConversation={currentConversation}
            conversationList={conversationList}
            navigate={navigate}
            createNewConversation={createNewConversation}
            className="flex-grow"
          />
          {/* button for new chat */}
          <button
            className="flex gap-x-1 items-center bg-transparent text-gray-600 dark:text-gray-300 hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] whitespace-nowrap p-1 pr-2 text-[9px]"
            onClick={createNewConversation}
          >
            <Icon name={IconName.Plus} className="w-3 h-3" />
            New
          </button>
        </div>
      </div>
      {/* Wider tab layout */}
      <div className={`${tabs.length > 5 ? "hidden" : "hidden 2xs:block"}`}>
        <nav className="flex justify-between border-b border-tab-inactive/30">
          <ul
            ref={tabListRef}
            className="flex overflow-x-auto divide-x divide-tab-inactive/20"
            aria-label="Tabs"
          >
            {/* /api */}
            <li>
              <Link
                className={classNames(
                  "h-full flex items-center gap-x-1 py-1 pl-2 pr-1 group whitespace-nowrap text-[9px] focus:outline-none",
                  location.pathname === "/api"
                    ? "bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.03)] text-gray-800 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-200 focus-within:text-gray-800 dark:focus-within:text-gray-200 focus-within:bg-[rgba(0,0,0,0.03)] dark:focus-within:bg-[rgba(255,255,255,0.03)]"
                    : "bg-transparent hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] hover:text-gray-600 dark:hover:text-gray-300 text-gray-500 dark:text-gray-400 focus-within:text-gray-600 dark:focus-within:text-gray-300 focus-within:bg-[rgba(0,0,0,0.02)] dark:focus-within:bg-[rgba(255,255,255,0.02)]",
                  {
                    hidden: !showLocalLlmTab,
                  }
                )}
                to="/api"
                aria-current={location.pathname === "/api" ? "page" : undefined}
              >
                <span className="pt-0.5">
                  ⚙️ LLM Settings
                </span>
                <TabCloseButton
                  path="/api"
                  onClick={() => {
                    // If there's no conversations, create a new one
                    if (conversationList.length === 0) {
                      createNewConversation();
                    }

                    // Navigate to the first conversation
                    navigate(`/chat/${encodeURI(conversationList[0].id)}`);

                    // Hide the tab
                    setShowLocalLlmTab(false);
                  }}
                />
              </Link>
            </li>
            {/* /actions */}
            <li>
              <Link
                className={classNames(
                  "h-full flex items-center gap-x-1 py-1 pl-2 pr-1 group whitespace-nowrap text-[9px] focus:outline-none",
                  location.pathname === "/actions"
                    ? "bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.03)] text-gray-800 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-200 focus-within:text-gray-800 dark:focus-within:text-gray-200 focus-within:bg-[rgba(0,0,0,0.03)] dark:focus-within:bg-[rgba(255,255,255,0.03)]"
                    : "bg-transparent hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] hover:text-gray-600 dark:hover:text-gray-300 text-gray-500 dark:text-gray-400 focus-within:text-gray-600 dark:focus-within:text-gray-300 focus-within:bg-[rgba(0,0,0,0.02)] dark:focus-within:bg-[rgba(255,255,255,0.02)]",
                  {
                    hidden: !showActionsTab,
                  }
                )}
                to="/actions"
                aria-current={
                  location.pathname === "/actions" ? "page" : undefined
                }
              >
                <span className="pt-0.5">🛠️ Actions</span>
                <TabCloseButton
                  path="/actions"
                  onClick={() => {
                    // If there's no conversations, create a new one
                    if (conversationList.length === 0) {
                      createNewConversation();
                    }

                    // Navigate to the first conversation
                    navigate(`/chat/${encodeURI(conversationList[0].id)}`);

                    // Hide the tab
                    setShowActionsTab(false);
                  }}
                />
              </Link>
            </li>
            {/* Chats */}
            {tabs &&
              tabs.map((tab) => (
                <TabLink
                  key={tab.id}
                  tab={tab}
                  conversationList={conversationList}
                  currentConversation={currentConversation}
                  createNewConversation={createNewConversation}
                />
              ))}
            {/* create new chat button */}
            <li className="flex items-center sticky right-0">
              <button
                className="flex gap-x-1 bg-transparent text-gray-600 dark:text-gray-300 whitespace-nowrap py-1 pl-2 pr-2 text-[9px] hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] focus:outline-none"
                onClick={createNewConversation}
              >
                <Icon name={IconName.Plus} className="w-3 h-3" />
                New
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
