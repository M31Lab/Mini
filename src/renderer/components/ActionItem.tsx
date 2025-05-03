import React, { ReactElement } from "react";
import { useAppDispatch } from "../hooks";
import { useMessenger } from "../send-to-backend";
import {
  Action,
  ActionRunState,
  clearActionError,
  setActionState,
} from "../store/action";
import Icon, { IconName } from "./Icon";

interface ActionItemProps {
  vscode: any;
  action: Action;
}

const ActionItem = ({
  vscode,
  action
}: ActionItemProps): ReactElement => {
  const dispatch = useAppDispatch();
  const backendMessenger = useMessenger(vscode);

  const handleClick = (): void => {
    if (action.state === ActionRunState.error) {
      dispatch(clearActionError(action.id));
    }

    if (action.state === ActionRunState.running) {
      dispatch(
        setActionState({ actionId: action.id, state: ActionRunState.idle })
      );

      backendMessenger.sendStopAction(action.id);
    } else if (action.state === ActionRunState.idle) {
      dispatch(
        setActionState({ actionId: action.id, state: ActionRunState.running })
      );

      backendMessenger.sendRunAction(action.id);
    }
  };

  const handleHideError = (): void => {
    dispatch(clearActionError(action.id));
  };

  const isRunning = action.state === ActionRunState.running;
  const buttonClasses = `inline-flex items-center px-2 py-1 text-[11px] font-medium rounded-sm text-gray-600 dark:text-gray-300 bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)] border border-tab-inactive/30 hover:bg-[rgba(0,0,0,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] focus:outline-none transition-colors
    ${isRunning
      ? "border-red-700/30 hover:border-red-700/50 text-red-600 dark:text-red-400"
      : "hover:text-gray-800 dark:hover:text-gray-100"
    }`;

  return (
    <div className="relative flex items-center px-3 py-2 hover:bg-[rgba(0,0,0,0.01)] dark:hover:bg-[rgba(255,255,255,0.01)] transition-colors">
      <div className="min-w-0 flex-1 flex sm:flex-row flex-col gap-2">
        <header className="flex flex-col flex-1">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 my-0">{action.name}</h3>
          <p className="truncate text-[11px] text-gray-500 dark:text-gray-400 my-0">
            {action.description}
          </p>
          {action.error && (
            <div className="py-1 px-2 mt-1.5 rounded-sm bg-[rgba(255,0,0,0.05)] border border-red-700/20">
              <header className="flex justify-between items-center">
                <p className="text-[11px] text-red-600 dark:text-red-400">{action.error}</p>
                <button
                  type="button"
                  className="px-1.5 py-0.5 text-[10px] font-medium rounded-sm text-gray-600 dark:text-gray-300 bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(0,0,0,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] border border-tab-inactive/30 transition-colors"
                  onClick={handleHideError}
                >
                  Hide
                </button>
              </header>
            </div>
          )}
        </header>
        <div className="flex items-start">
          <button
            type="button"
            className={buttonClasses}
            onClick={handleClick}
          >
            {isRunning ? (
              <div className="flex gap-x-1.5 items-center">
                <Icon name={IconName.Refresh} className="animate-spin h-3 w-3 text-red-500 dark:text-red-400" />
                <span>Stop</span>
              </div>
            ) : (
              <div className="flex gap-x-1.5 items-center">
                <span>Run</span>
                <Icon name={IconName.Send} className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionItem;
