import { Settings } from "lucide-react";
import classNames from "classnames";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../send-to-backend";
import { RootState } from "../store";
import { setDebug } from "../store/app";
import { Conversation } from "../types";
import Icon, { IconName } from "./Icon";
import ModelSelect from "./ModelSelect";
import VerbositySelect from "./VerbositySelect";
import ViewOptions from "./ViewOptions";

const MENU_STRINGS = {
  FEEDBACK: "Feedback",
  FEEDBACK_TOOLTIP: "Report a bug or suggest a feature in GitHub",
  CHANGE_LLM: "Change LLM",
  CHANGE_LLM_TOOLTIP: "Open the local API tab",
  ACTIONS: "Actions",
  DEBUG: "Debug",
  DEBUG_TOOLTIP: "Toggle debug mode",
  SETTINGS: "Settings",
  SETTINGS_TOOLTIP: "Open extension settings",
  MARKDOWN: "Markdown",
  MARKDOWN_TOOLTIP: "Export the conversation to a markdown file",
  VIEW: "View"
};

type MoreActionsMenuProps = {
  currentConversation: Conversation;
  conversationList: Conversation[];
  vscode: any;
  showMoreActions: boolean;
  setShowMoreActions: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
};

const MoreActionsMenu = ({
  currentConversation,
  conversationList,
  vscode,
  showMoreActions,
  setShowMoreActions,
  className,
}: MoreActionsMenuProps): React.ReactElement => {
  const dispatch = useAppDispatch();
  const debug = useAppSelector((state: RootState) => state.app.debug);
  const navigate = useNavigate();
  const backendMessenger = useMessenger(vscode);
  const [showViewOptions, setShowViewOptions] = useState<boolean>(false);

  useEffect((): void => {
    if (showMoreActions) {
      setShowViewOptions(false);
    }
  }, [showMoreActions]);

  const handleApiLinkClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
    if (location.pathname === "/api") {
      e.preventDefault();
      navigate(`/chat/${encodeURI(currentConversation.id)}`);
    }
    setShowMoreActions(false);
  };

  const handleActionsLinkClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
    if (location.pathname === "/actions") {
      e.preventDefault();
      navigate(`/chat/${encodeURI(currentConversation.id)}`);
    }
  };

  const handleDebugToggle = (): void => {
    dispatch(setDebug(!debug));
  };

  const handleOpenSettings = (): void => {
    backendMessenger.sendOpenSettings();
    setShowMoreActions(false);
  };

  const handleExportMarkdown = (): void => {
    backendMessenger.sendExportToMarkdown(currentConversation);
    setShowMoreActions(false);
  };

  const handleViewOptionsToggle = (): void => {
    setShowViewOptions(!showViewOptions);
  };

  const getMenuClasses = (): string => {
    return classNames(
      "MoreActionsMenu",
      "fixed z-20 right-4 p-2 bg-menu rounded border border-menu overflow-hidden max-w-[calc(100vw-2em)]",
      className,
      {
        hidden: !showMoreActions,
      }
    );
  };

  const getDebugButtonClasses = (): string => {
    return classNames(
      "DebugButton",
      "rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full",
      debug
        ? "bg-red-900 text-white"
        : "hover:bg-button-secondary focus:bg-button-secondary hover:text-button-secondary focus:text-button-secondary"
    );
  };

  return (
    <>
      <div
        id="more-actions-menu"
        className={getMenuClasses()}
      >
        <ul className="flex flex-col gap-1">
          <li>
            <a
              className="flex gap-1 items-center py-0.5 px-1 whitespace-nowrap hover:underline focus-within:underline"
              data-tooltip-id="more-actions-tooltip"
              data-tooltip-content={MENU_STRINGS.FEEDBACK_TOOLTIP}
              href="https://github.com/M31Lab/Mini/issues/new/choose"
              target="_blank"
            >
              <Icon name={IconName.Help} className="w-3 h-3" />
              {MENU_STRINGS.FEEDBACK}
            </a>
          </li>
          <li>
            <Link
              className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full hover:bg-button-secondary focus:bg-button-secondary hover:text-button-secondary focus:text-button-secondary"
              to="/api"
              onClick={handleApiLinkClick}
              data-tooltip-id="local-api-tooltip"
              data-tooltip-content={MENU_STRINGS.CHANGE_LLM_TOOLTIP}
            >
              <Icon name={IconName.Box} className="w-3 h-3" />
              {MENU_STRINGS.CHANGE_LLM}
            </Link>
          </li>
          <li>
            <Link
              className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full hover:bg-button-secondary focus:bg-button-secondary hover:text-button-secondary focus:text-button-secondary"
              to="/actions"
              onClick={handleActionsLinkClick}
            >
              <Icon name={IconName.Zap} className="w-3 h-3" />
              {MENU_STRINGS.ACTIONS}
            </Link>
          </li>
          {process.env.NODE_ENV === "development" && (
            <li>
              <button
                className={getDebugButtonClasses()}
                data-tooltip-id="more-actions-tooltip"
                data-tooltip-content={MENU_STRINGS.DEBUG_TOOLTIP}
                onClick={handleDebugToggle}
              >
                <Icon name={IconName.Box} className="w-3 h-3" />
                {MENU_STRINGS.DEBUG}
              </button>
            </li>
          )}
          <li>
            <button
              className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full hover:bg-button-secondary focus:bg-button-secondary hover:text-button-secondary focus:text-button-secondary"
              onClick={handleOpenSettings}
              data-tooltip-id="more-actions-tooltip"
              data-tooltip-content={MENU_STRINGS.SETTINGS_TOOLTIP}
            >
              <Icon name={IconName.Settings} className="w-3 h-3" />
              {MENU_STRINGS.SETTINGS}
            </button>
          </li>
          <li>
            <button
              className="rounded flex gap-1 items-center justify-start py-0.5 px-1 w-full hover:bg-button-secondary focus:bg-button-secondary hover:text-button-secondary focus:text-button-secondary"
              data-tooltip-id="more-actions-tooltip"
              data-tooltip-content={MENU_STRINGS.MARKDOWN_TOOLTIP}
              onClick={handleExportMarkdown}
            >
              <Icon name={IconName.Download} className="w-3 h-3" />
              {MENU_STRINGS.MARKDOWN}
            </button>
          </li>
          <li>
            <button
              className="group w-full"
              onClick={handleViewOptionsToggle}
            >
              <span className="w-full py-0.5 px-1 rounded flex gap-1 items-center justify-start group-hover:bg-button-secondary group-focus:bg-button-secondary group-hover:text-button-secondary group-focus:text-button-secondary">
                <Settings className="w-3 h-3" />
                {MENU_STRINGS.VIEW}
              </span>
              {showViewOptions && (
                <ViewOptions className="fixed right-32 bottom-7" />
              )}
            </button>
          </li>
          <li className="block xs:hidden">
            <ModelSelect
              currentConversation={currentConversation}
              vscode={vscode}
              conversationList={conversationList}
              dropdownClassName="right-32 bottom-8 max-w-[calc(100vw-9rem)] z-20"
              tooltipId="more-actions-tooltip"
              showParentMenu={setShowMoreActions}
            />
          </li>
          <li className="block xs:hidden">
            <VerbositySelect
              currentConversation={currentConversation}
              vscode={vscode}
              dropdownClassName="right-32 bottom-8 max-w-[calc(100vw-9rem)] z-20"
              tooltipId="more-actions-tooltip"
              showParentMenu={setShowMoreActions}
            />
          </li>
        </ul>
      </div>
      <Tooltip
        id="more-actions-tooltip"
        className="z-10"
        place="left"
        delayShow={800}
      />
    </>
  );
};

export default MoreActionsMenu;
