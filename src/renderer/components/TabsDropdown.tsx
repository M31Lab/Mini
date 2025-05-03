import React, { ReactElement, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../hooks";
import { Conversation } from "../types";
import Icon, { IconName } from "./Icon";

interface TabsDropdownProps {
  conversationList: Conversation[];
  createNewConversation: () => void;
  className?: string;
}

const TabsDropdown = ({
  conversationList,
  createNewConversation,
  className,
}: TabsDropdownProps): ReactElement => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
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
    (selectedConversation: Conversation): void => {
      if (selectedConversation) {
        navigate(`/chat/${encodeURI(selectedConversation.id)}`);
        setShowOptions(false);
      }
    },
    [navigate]
  );

  return (
    <div className={`relative ${className}`} ref={parentRef}>
      <button
        className="h-full flex items-center px-1.5 py-0.5 text-[10px] cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-[rgba(0,0,0,0.01)] dark:hover:bg-[rgba(255,255,255,0.01)] focus:outline-none transition-colors"
        onClick={handleToggleOptions}
        ref={selectRef}
        title="Browse chats"
      >
        <Icon name={IconName.More} className="w-3 h-3" />
      </button>
      {showOptions && (
        <div
          className="absolute z-10 w-48 bg-white dark:bg-gray-900 border border-tab-inactive/30 rounded-sm shadow-sm max-h-60 overflow-auto right-0 mt-1"
          role="menu"
        >
          <div className="py-1 text-[11px] text-gray-700 dark:text-gray-300 font-medium px-2 border-b border-tab-inactive/20">
            Chats
          </div>
          {conversationList.map((conversation, index) => (
            <button
              key={index}
              role="menuitem"
              onClick={() => handleSelectChange(conversation)}
              ref={selectedTabRef}
              className="w-full text-start py-1 px-2 text-[11px] hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] focus:bg-[rgba(0,0,0,0.02)] dark:focus:bg-[rgba(255,255,255,0.02)] cursor-pointer appearance-none text-gray-600 dark:text-gray-400 transition-colors"
            >
              {conversation.title}
            </button>
          ))}
          <div className="border-t border-tab-inactive/20 pt-1 mt-1">
            <button
              className="w-full text-start py-1 px-2 text-[11px] hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] cursor-pointer appearance-none text-gray-600 dark:text-gray-400 transition-colors flex items-center gap-1"
              onClick={createNewConversation}
            >
              <Icon name={IconName.Plus} className="w-2.5 h-2.5" />
              New chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabsDropdown;
