import classNames from "classnames";
import React, { ReactElement, useEffect, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import { useMessenger } from "../send-to-backend";
import { Role } from "../types";
import CodeBlockActionsButton from "./CodeBlockActionsButton";

/**
 * Text strings used in the code block UI
 */
const CODEBLOCK_STRINGS = {
  copyTooltip: "Copy to clipboard",
  copy: "Copy",
  copied: "Copied",
  insertTooltip: "Insert into the current file",
  insert: "Insert",
  inserted: "Inserted",
  newTooltip: "Create a new file with the below code",
  new: "New",
  created: "Created",
  expand: "Expand",
  collapse: "Collapse"
};

/**
 * Props for the CodeBlock component
 */
interface CodeBlockProps {
  /** The HTML code block content */
  code: string;

  /** Optional additional CSS classes */
  className?: string;

  /** ID of the current conversation */
  conversationId?: string;

  /** VS Code API instance */
  vscode: any;

  /** Whether the code block should start collapsed */
  startCollapsed?: boolean;

  /** Role of the message containing this code block */
  role?: Role;

  /** Whether to add margin to the code block */
  margins?: boolean;
}

/**
 * Component for displaying code blocks with syntax highlighting and actions
 *
 * Features:
 * - Syntax highlighting
 * - Copy to clipboard
 * - Insert into current file
 * - Create new file
 * - Expand/collapse for large code blocks
 *
 * @param props - Component properties
 * @returns React component
 */
const CodeBlock = ({
  conversationId,
  code,
  className = "",
  vscode,
  startCollapsed = false,
  role,
  margins = true,
}: CodeBlockProps): ReactElement => {
  // State for code content and UI
  const [codeTextContent, setCodeTextContent] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [expanded, setExpanded] = useState<boolean>(!startCollapsed);

  // Reference to the code element for extracting text content
  const codeRef = useRef<HTMLPreElement>(null);

  // Messenger for communicating with the backend
  const backendMessenger = useMessenger(vscode);

  /**
   * Extract the code text content and language when the code prop changes
   */
  useEffect(() => {
    // Get the text content from the code element
    let textContent = codeRef.current?.innerText || "";

    // Remove trailing newline if present
    if (textContent.endsWith("\n")) {
      textContent = textContent.slice(0, -1);
    }

    setCodeTextContent(textContent);

    // Extract language from the code class
    const detectedLanguage = code.match(/language-(\w+)/)?.[1] || "";
    setLanguage(detectedLanguage);
  }, [code]);

  /**
   * Handles copying code to clipboard
   */
  const handleCopy = (): void => {
    navigator.clipboard.writeText(codeTextContent);
  };

  /**
   * Handles inserting code into the current file
   */
  const handleInsert = (): void => {
    if (conversationId) {
      backendMessenger.sendEditCode(codeTextContent);
    }
  };

  /**
   * Handles creating a new file with the code
   */
  const handleCreateNew = (): void => {
    // Normalize language name for file creation
    const normalizedLanguage = language
      .replace("js", "javascript")
      .replace("py", "python")
      .replace("sh", "bash")
      .replace("ts", "typescript");

    backendMessenger.sendOpenNew(codeTextContent, normalizedLanguage);
  };

  /**
   * Toggles the expanded state of the code block
   */
  const toggleExpanded = (): void => {
    setExpanded(!expanded);
  };

  // Compute class names for the code block container
  const containerClasses = classNames(
    "c-codeblock group/codeblock bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.03)] relative rounded-sm border border-tab-inactive/30",
    className,
    {
      "my-2": margins,
    }
  );

  // Compute class names for the code element
  const codeClasses = classNames("block px-3 py-1.5 font-code text-code text-sm", {
    "h-14 collapsed-code-block overflow-hidden": !expanded,
    "overflow-x-auto": expanded,
    "bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)]": role === Role.user,
  });

  // Clean HTML content for the code element
  const cleanedCodeHtml = code
    .replace(/<pre><code[^>]*>/, "")
    .replace(/<\/code><\/pre>/, "");

  return (
    <pre className={containerClasses}>
      {/* Language indicator */}
      {language && (
        <div className="absolute -top-4 right-2 text-[9px] text-tab-inactive-unfocused">
          {language}
        </div>
      )}

      {/* Action buttons when expanded */}
      {expanded && (
        <div className="sticky h-0 z-10 top-0 pr-1 border-t border-tab-inactive/10">
          <div className="pt-0.5 flex flex-wrap items-center justify-end gap-1 transition-opacity duration-75 opacity-0 pointer-events-none group-hover/codeblock:opacity-100 group-focus-within/codeblock:opacity-100">
            {/* Copy button */}
            <CodeBlockActionsButton
              vscode={vscode}
              codeTextContent={codeTextContent}
              iconName="clipboard"
              tooltipContent={CODEBLOCK_STRINGS.copyTooltip}
              buttonText={CODEBLOCK_STRINGS.copy}
              buttonSuccessText={CODEBLOCK_STRINGS.copied}
              onClick={handleCopy}
            />

            {/* Insert and New file buttons (only shown in conversation context) */}
            {conversationId && (
              <>
                <CodeBlockActionsButton
                  vscode={vscode}
                  codeTextContent={codeTextContent}
                  iconName="pencil"
                  tooltipContent={CODEBLOCK_STRINGS.insertTooltip}
                  buttonText={CODEBLOCK_STRINGS.insert}
                  buttonSuccessText={CODEBLOCK_STRINGS.inserted}
                  onClick={handleInsert}
                />
                <CodeBlockActionsButton
                  vscode={vscode}
                  codeTextContent={codeTextContent}
                  iconName="plus"
                  tooltipContent={CODEBLOCK_STRINGS.newTooltip}
                  buttonText={CODEBLOCK_STRINGS.new}
                  buttonSuccessText={CODEBLOCK_STRINGS.created}
                  onClick={handleCreateNew}
                />
              </>
            )}

            {/* Tooltip for action buttons */}
            <Tooltip
              id="code-actions-tooltip"
              place="bottom"
              delayShow={1500}
            />
          </div>
        </div>
      )}

      {/* Expand button when collapsed */}
      {!expanded && (
        <div className="pointer-events-none opacity-0 group-hover/codeblock:opacity-100 absolute inset-0 p-1 flex items-end justify-center">
          <div className="pointer-events-auto">
            <button
              className="flex gap-x-1 px-2 py-0.5 text-[9px] rounded-sm bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.05)] text-gray-600 dark:text-gray-300 hover:bg-[rgba(0,0,0,0.1)] dark:hover:bg-[rgba(255,255,255,0.1)] whitespace-nowrap"
              onClick={toggleExpanded}
              aria-label={CODEBLOCK_STRINGS.expand}
            >
              {CODEBLOCK_STRINGS.expand}
            </button>
          </div>
        </div>
      )}

      {/* Collapse button when expanded (only for blocks that started collapsed) */}
      {startCollapsed && expanded && (
        <div className="pointer-events-none opacity-0 group-hover/codeblock:opacity-100 absolute inset-0 p-1 flex items-end justify-center">
          <div className="pointer-events-auto">
            <button
              className="flex gap-x-1 px-2 py-0.5 text-[9px] rounded-sm bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.05)] text-gray-600 dark:text-gray-300 hover:bg-[rgba(0,0,0,0.1)] dark:hover:bg-[rgba(255,255,255,0.1)] whitespace-nowrap"
              onClick={toggleExpanded}
              aria-label={CODEBLOCK_STRINGS.collapse}
            >
              {CODEBLOCK_STRINGS.collapse}
            </button>
          </div>
        </div>
      )}

      {/* Code content */}
      <code
        className={codeClasses}
        ref={codeRef}
        dangerouslySetInnerHTML={{ __html: cleanedCodeHtml }}
      />
    </pre>
  );
};

export default CodeBlock;
