import React, { ReactElement, useCallback, useRef, useState } from "react";
import { useAppDispatch } from "../hooks";
import { removeConversation } from "../store/conversation";
import { Conversation } from "../types";
import Icon, { IconName } from "./Icon";

interface Tab {
  name: string;
  href: string;
}

interface TabsDropdownProps {
  tabs: Tab[];
  currentConversation: Conversation;
  navigate: (href: string) => void;
  conversationList: Conversation[];
  createNewConversation: () => void;
  className?: string;
}

const TabsDropdown = ({
  tabs,
  currentConversation,
  navigate,
  conversationList,
  createNewConversation,
  className,
}: TabsDropdownProps): ReactElement => {
  const dispatch = useAppDispatch();
  const selectedTabRef = useRef<HTMLButtonElement>(null);
  const selectRef = useRef<HTMLButtonElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const [showOptions, setShowOptions] = useState<boolean>(false);

  const handleToggleOptions = useCallback((): void => {
    setShowOptions((prevShowOptions) => !prevShowOptions);

    setTimeout(() => {
      if (selectedTabRef.current) {
        selectedTabRef.current.focus();
      }
    }, 200);
  }, []);

  const handleSelectChange = useCallback(
    (selectedTab: Tab): void => {
      if (selectedTab) {
        navigate(selectedTab.href);
        setShowOptions(false);
      }
    },
    [navigate]
  );

  const handleCloseTab = (e: React.MouseEvent): void => {
    e.stopPropagation();

    if (conversationList.length === 1) {
      createNewConversation();
    } else {
      const nextTabId = conversationList[0].id === currentConversation.id
        ? conversationList[1].id
        : conversationList[0].id;

      navigate(`/chat/${encodeURI(nextTabId)}`);
    }

    dispatch(removeConversation(currentConversation.id));
  };

  const currentTabName = tabs.find(
    (tab) => currentConversation.title === tab.name
  )?.name;

  return (
    <div className={`relative ${className}`} ref={parentRef}>
      <button
        className="flex-grow w-full flex items-center px-2 py-1 border-b border-tab-inactive/30 text-[9px] cursor-pointer hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] focus:outline-none"
        onClick={handleToggleOptions}
        ref={selectRef}
      >
        <span className="pl-1 flex-grow user-select-none text-start text-gray-700 dark:text-gray-300">
          {currentTabName}
        </span>
        <Icon name={IconName.CaretDown} className="w-4 h-4 p-1 text-gray-500" />
        <button
          type="button"
          className="block p-0.5 hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] focus:outline-none rounded-sm text-gray-500"
          onClick={handleCloseTab}
        >
          <Icon name={IconName.Close} className="w-3 h-3" />
        </button>
      </button>
      {showOptions && (
        <div
          className="absolute z-10 w-full bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] border border-tab-inactive/30 max-h-60 overflow-auto top-7 left-0"
          role="menu"
        >
          {tabs.map((tab, index) => (
            <button
              key={index}
              role="menuitem"
              aria-selected={currentConversation.title === tab.name}
              onClick={() => handleSelectChange(tab)}
              ref={selectedTabRef}
              className={`w-full text-start py-1.5 px-2 text-[9px] hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] focus:bg-[rgba(0,0,0,0.05)] dark:focus:bg-[rgba(255,255,255,0.05)] cursor-pointer appearance-none text-gray-700 dark:text-gray-300 ${currentConversation.title === tab.name
                ? "bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.03)] font-medium"
                : ""
                }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TabsDropdown;
