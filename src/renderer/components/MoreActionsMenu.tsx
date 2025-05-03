import classNames from "classnames";
import { Settings } from "lucide-react";
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
      "fixed z-20 right-4 p-1.5 bg-white dark:bg-gray-900 rounded-sm border border-tab-inactive/30 overflow-hidden max-w-[calc(100vw-2em)] shadow-sm text-[11px]",
      className,
      {
        hidden: !showMoreActions,
      }
    );
  };

  const getDebugButtonClasses = (): string => {
    return classNames(
      "DebugButton",
      "rounded-sm flex gap-1 items-center justify-start py-0.5 px-1 w-full text-[11px] transition-colors",
      debug
        ? "bg-red-500/10 text-red-600 dark:text-red-400"
        : "hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] text-gray-600 dark:text-gray-300"
    );
  };

  return (
    <>
      <div
        id="more-actions-menu"
        className={getMenuClasses()}
      >
        <ul className="flex flex-col gap-0.5">
          <li>
            <a
              className="flex gap-1 items-center py-0.5 px-1 whitespace-nowrap text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
              data-tooltip-id="more-actions-tooltip"
              data-tooltip-content={MENU_STRINGS.FEEDBACK_TOOLTIP}
              href="https://github.com/M31Lab/Mini/issues/new/choose"
              target="_blank"
            >
              <Icon name={IconName.Help} className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              {MENU_STRINGS.FEEDBACK}
            </a>
          </li>
          <li>
            <Link
              className="rounded-sm flex gap-1 items-center justify-start py-0.5 px-1 w-full text-[11px] text-gray-600 dark:text-gray-300 hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors"
              to="/api"
              onClick={handleApiLinkClick}
              data-tooltip-id="local-api-tooltip"
              data-tooltip-content={MENU_STRINGS.CHANGE_LLM_TOOLTIP}
            >
              <Icon name={IconName.Box} className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              {MENU_STRINGS.CHANGE_LLM}
            </Link>
          </li>
          <li>
            <Link
              className="rounded-sm flex gap-1 items-center justify-start py-0.5 px-1 w-full text-[11px] text-gray-600 dark:text-gray-300 hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors"
              to="/actions"
              onClick={handleActionsLinkClick}
            >
              <Icon name={IconName.Zap} className="w-3 h-3 text-gray-500 dark:text-gray-400" />
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
                <Icon name={IconName.Box} className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                {MENU_STRINGS.DEBUG}
              </button>
            </li>
          )}
          <li>
            <button
              className="rounded-sm flex gap-1 items-center justify-start py-0.5 px-1 w-full text-[11px] text-gray-600 dark:text-gray-300 hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors"
              onClick={handleOpenSettings}
              data-tooltip-id="more-actions-tooltip"
              data-tooltip-content={MENU_STRINGS.SETTINGS_TOOLTIP}
            >
              <Icon name={IconName.Settings} className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              {MENU_STRINGS.SETTINGS}
            </button>
          </li>
          <li>
            <button
              className="rounded-sm flex gap-1 items-center justify-start py-0.5 px-1 w-full text-[11px] text-gray-600 dark:text-gray-300 hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors"
              data-tooltip-id="more-actions-tooltip"
              data-tooltip-content={MENU_STRINGS.MARKDOWN_TOOLTIP}
              onClick={handleExportMarkdown}
            >
              <Icon name={IconName.Download} className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              {MENU_STRINGS.MARKDOWN}
            </button>
          </li>
          <li>
            <button
              className="group w-full"
              onClick={handleViewOptionsToggle}
            >
              <span className="w-full py-0.5 px-1 rounded-sm flex gap-1 items-center justify-start text-[11px] text-gray-600 dark:text-gray-300 group-hover:bg-[rgba(0,0,0,0.02)] dark:group-hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                <Settings className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                {MENU_STRINGS.VIEW}
              </span>
              {showViewOptions && (
                <ViewOptions className="fixed right-32 bottom-7" />
              )}
            </button>
          </li>
          <li>
            <ModelSelect
              currentConversation={currentConversation}
              conversationList={conversationList}
              vscode={vscode}
              showParentMenu={setShowMoreActions}
              dropdownClassName="top-0 right-36"
            />
          </li>
          <li>
            <VerbositySelect
              currentConversation={currentConversation}
              vscode={vscode}
              showParentMenu={setShowMoreActions}
              dropdownClassName="top-0 right-24"
              className="mt-1 mb-0 mx-0"
            />
          </li>
        </ul>
      </div>
      {showMoreActions && (
        <Tooltip id="more-actions-tooltip" />
      )}
    </>
  );
};

export default MoreActionsMenu;
