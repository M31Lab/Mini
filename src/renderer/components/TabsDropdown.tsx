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
        className="flex-grow w-full flex items-center px-2 py-1 border-b border-menu text-xs cursor-pointer hover:bg-menu-selection focus:outline-none focus:ring-tab-active"
        onClick={handleToggleOptions}
        ref={selectRef}
      >
        <span className="pl-1 flex-grow user-select-none text-start">
          {currentTabName}
        </span>
        <Icon name={IconName.CaretDown} className="w-6 h-6 p-1" />
        <button
          type="button"
          className="block p-1 hover:text-white focus:outline-none hover:bg-opacity-40 hover:bg-button-secondary focus:bg-button-secondary rounded"
          onClick={handleCloseTab}
        >
          <Icon name={IconName.Close} className="w-4 h-4" />
        </button>
      </button>
      {showOptions && (
        <div
          className="absolute z-10 w-full bg-menu shadow-lg border border-menu max-h-60 overflow-auto top-8 left-0"
          role="menu"
        >
          {tabs.map((tab, index) => (
            <button
              key={index}
              role="menuitem"
              aria-selected={currentConversation.title === tab.name}
              onClick={() => handleSelectChange(tab)}
              ref={selectedTabRef}
              className={`w-full text-start py-2 px-2 text-xs bg-menu hover:bg-menu-selection focus:bg-menu-selection focus:underline cursor-pointer appearance-none ${
                currentConversation.title === tab.name
                  ? "bg-menu-selection font-semibold"
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
