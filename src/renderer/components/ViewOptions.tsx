import classNames from "classnames";
import React, { ReactElement } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { toggleViewOption, ViewOptionsState } from "../store/app";
import Icon, { IconName } from "./Icon";

interface ViewOptionsToggleProps {
  className?: string;
}

interface ViewOption {
  label: string;
  key: keyof ViewOptionsState;
}

const currentViewOptions: ViewOption[] = [
  { label: "Hide Name", key: "hideName" },
  { label: "Code Only", key: "showCodeOnly" },
  { label: "Show Markdown", key: "showMarkdown" },
  { label: "Align Right", key: "alignRight" },
  { label: "Compact UI", key: "showCompact" },
  // Not yet implemented
  // { label: "Network Logs", key: "showNetworkLogs" },
];

const userUIOptions: ViewOption[] = [
  { label: "Model Select", key: "showModelSelect" },
  { label: "Verbosity", key: "showVerbosity" },
  { label: "Editor Selection", key: "showEditorSelection" },
  { label: "Clear Button", key: "showClear" },
  { label: "Token Count", key: "showTokenCount" },
];

const ViewOptionsToggle = ({
  className,
}: ViewOptionsToggleProps): ReactElement => {
  const dispatch = useAppDispatch();
  const viewOptionStates = useAppSelector((state) => state.app.viewOptions);

  const handleOptionToggle = (key: keyof ViewOptionsState): void => {
    dispatch(toggleViewOption(key));
  };

  const renderOptionButton = (option: ViewOption): ReactElement => (
    <li key={option.key}>
      <button
        className="w-full flex gap-1 items-center py-0.5 px-1 text-[11px] whitespace-nowrap text-gray-600 dark:text-gray-300 hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] rounded-sm transition-colors"
        onClick={() => handleOptionToggle(option.key)}
      >
        <Icon
          name={viewOptionStates[option.key] ? IconName.Check : IconName.Close}
          className={`w-2.5 h-2.5 ${viewOptionStates[option.key] ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
        />
        {option.label}
      </button>
    </li>
  );

  const preventPropagation = (e: React.MouseEvent): void => {
    e.stopPropagation();
  };

  return (
    <div
      className={classNames(
        "ViewOptionsToggle",
        "z-20 p-1.5 bg-white dark:bg-gray-900 rounded-sm border border-tab-inactive/30 shadow-sm text-[11px]",
        className
      )}
      onClick={preventPropagation}
    >
      <div className="flex gap-3">
        <ul className="flex-1 flex flex-col gap-0.5">
          {currentViewOptions.map(renderOptionButton)}
        </ul>
        <ul className="flex-1 flex flex-col gap-0.5">
          {userUIOptions.map(renderOptionButton)}
        </ul>
      </div>
    </div>
  );
};

export default ViewOptionsToggle;
