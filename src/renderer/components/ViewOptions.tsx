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
        className="w-full flex gap-1 items-center py-0.5 px-1 text-xs whitespace-nowrap hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] rounded-sm"
        onClick={() => handleOptionToggle(option.key)}
      >
        <Icon
          name={viewOptionStates[option.key] ? IconName.Check : IconName.Close}
          className="w-3 h-3"
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
        "z-20 p-1 bg-menu rounded-sm border border-tab-inactive/30 shadow-sm",
        className
      )}
      onClick={preventPropagation}
    >
      <div className="flex gap-2">
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
