import React, { ReactElement, useState } from "react";
import Icon, { IconName } from "./Icon";

/**
 * Props for the CodeBlockActionsButton component
 */
interface CodeBlockActionsButtonProps {
  /** VS Code API instance */
  vscode: any;

  /** The text content of the code block */
  codeTextContent: string;

  /** Optional icon name to display in the button */
  iconName?: string;

  /** Text to display in the tooltip */
  tooltipContent: string;

  /** Function to call when the button is clicked */
  onClick: () => void;

  /** Text to display on the button in normal state */
  buttonText: string;

  /** Text to display on the button after successful action */
  buttonSuccessText: string;
}

/**
 * Button component for code block actions like copy, insert, etc.
 * Shows a success state after the action is performed.
 * 
 * @param props - Component properties
 * @returns React component
 */
const CodeBlockActionsButton = ({
  vscode,
  codeTextContent,
  iconName,
  tooltipContent,
  onClick,
  buttonText,
  buttonSuccessText,
}: CodeBlockActionsButtonProps): ReactElement => {
  // Track whether to show success state
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  /**
   * Handles button click, performs the action, and shows success state
   */
  const handleClick = (): void => {
    try {
      // Execute the provided action
      onClick();

      // Show success state
      setShowSuccess(true);

      // Reset to normal state after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error executing code block action:", error);
    }
  };

  // Determine button classes based on current state
  const buttonClasses = `
    code-element-ext 
    px-1 py-0.5 
    flex gap-x-1 
    justify-center 
    items-center 
    rounded 
    border 
    pointer-events-auto
    bg-menu 
    hover:bg-menu-selection
    ${showSuccess ? "text-green-500 border-green-500" : ""}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      data-tooltip-id="code-actions-tooltip"
      data-tooltip-content={tooltipContent}
      className={buttonClasses}
      onClick={handleClick}
      aria-label={showSuccess ? buttonSuccessText : buttonText}
    >
      {showSuccess ? (
        <>
          <Icon name={IconName.Check} className="w-4 h-4" />
          <span className="mt-0.5 mr-0.5">{buttonSuccessText}</span>
        </>
      ) : (
        <>
          {iconName && <Icon name={IconName[iconName as keyof typeof IconName]} className="w-4 h-4" />}
          <span className="mt-0.5 mr-0.5">{buttonText}</span>
        </>
      )}
    </button>
  );
};

export default CodeBlockActionsButton;
