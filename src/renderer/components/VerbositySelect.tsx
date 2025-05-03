import React, { useState, ReactElement } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../send-to-backend";
import { RootState } from "../store";
import { setVerbosity } from "../store/conversation";
import { Conversation, Verbosity } from "../types";
import Icon, { IconName } from "./Icon";

interface VerbositySelectProps {
  vscode: any;
  currentConversation: Conversation;
  className?: string;
  dropdownClassName?: string;
  tooltipId?: string;
  showParentMenu?: React.Dispatch<React.SetStateAction<boolean>>;
}

const VERBOSITY_LABELS: Record<Verbosity, string> = {
  [Verbosity.code]: "Code",
  [Verbosity.concise]: "Concise",
  [Verbosity.normal]: "Normal",
  [Verbosity.full]: "Detailed"
};

const VERBOSITY_DESCRIPTIONS: Record<Verbosity, string> = {
  [Verbosity.code]: "Only reply with code",
  [Verbosity.concise]: "Concise explanations",
  [Verbosity.normal]: "Normal explanations",
  [Verbosity.full]: "Detailed, full explanations"
};

const VerbositySelect = ({
  vscode,
  currentConversation,
  className,
  dropdownClassName,
  tooltipId,
  showParentMenu,
}: VerbositySelectProps): ReactElement => {
  const dispatch = useAppDispatch();
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const backendMessenger = useMessenger(vscode);

  const getHumanFriendlyLabel = (verbosity: Verbosity): string => {
    return VERBOSITY_LABELS[verbosity];
  };

  const getHumanFriendlyDescription = (verbosity: Verbosity): string => {
    return VERBOSITY_DESCRIPTIONS[verbosity];
  };

  const toggleOptions = (): void => {
    setShowOptions(!showOptions);
  };

  const handleVerbositySelection = (option: Verbosity): void => {
    dispatch(
      setVerbosity({
        conversationId: currentConversation.id,
        verbosity: option,
      })
    );

    backendMessenger.sendSetVerbosity(option);
    setShowOptions(false);

    if (showParentMenu) {
      showParentMenu(false);
    }
  };

  return (
    <>
      <div
        className={`${className}`}
        data-tooltip-id={tooltipId ?? "footer-tooltip"}
        data-tooltip-content="Change the verbosity of the AI's responses"
      >
        <button
          className="rounded py-0.5 px-1 flex flex-row items-center hover:bg-button-secondary focus:bg-button-secondary whitespace-nowrap hover:text-button-secondary focus:text-button-secondary"
          onClick={toggleOptions}
        >
          <Icon name={IconName.Chat} className="w-3 h-3 mr-1" />
          {getHumanFriendlyLabel(
            currentConversation?.verbosity ?? Verbosity.normal
          )}
        </button>
        <div
          className={`fixed border text-menu bg-menu border-menu shadow-xl text-xs rounded z-10
          ${showOptions ? "block" : "hidden"}
          ${dropdownClassName ? dropdownClassName : "mb-8 -ml-11"}
        `}
        >
          {Object.values(Verbosity).map((option) => (
            <button
              className="flex gap-2 items-center justify-start p-2 w-full hover:bg-menu-selection"
              key={option}
              onClick={() => handleVerbositySelection(option)}
            >
              {getHumanFriendlyDescription(option)}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default VerbositySelect;
