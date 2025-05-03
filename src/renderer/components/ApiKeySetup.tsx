import React, { ReactElement, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../send-to-backend";
import { RootState } from "../store";
import { ApiKeyStatus, setApiKeyStatus } from "../store/app";
import Icon, { IconName } from "./Icon";

/**
 * Text strings used in the API key setup UI
 */
const API_STRINGS = {
  PLACEHOLDERS: {
    API_KEY: "sk-...",
    API_URL: "https://openai-proxy.dev/v1",
  },
  HEADING: "OpenAI API Key Setup",
  INSTRUCTIONS: {
    INTRO: "To use this extension, you must have an OpenAI API key. You can follow the instructions below to get one.",
    TITLE: "Instructions:",
    STEP1: "Create an OpenAI account if you haven't at",
    STEP2: "Then, go to",
    STEP3: "Click \"Create API Key\"",
    STEP4: "Copy the key and paste it in the text input below to set it up.",
    STEP5A: "On submit the key is securely stored on your computer using VSCode secret storage. It is never sent to any server. (This extension is open source, so",
    STEP5B: "you can even check for yourself",
    STEP5C: "!)",
  },
  API_KEY_LABEL: "API Key",
  INVALID_API_KEY: {
    TITLE: "Invalid API Key",
    DESCRIPTION: "The API key you entered has failed to get an OK response from OpenAI. Please double check the key was copied in correctly. Also, check that OpenAI is not currently experiencing an API outage. (",
    CLOSING: ")",
  },
  ALT_API_URL: {
    LABEL: "Alternative API URL (Optional)",
    DESCRIPTION: "The url should start with 'https'. The API url should NOT include /chat/completions. OpenAI API proxies should work without issues. OpenAI proxy URLs should end with /v1. Other models like Claude will not work unless they are using the same API as OpenAI. Azure's API is not yet supported.",
  },
  BUTTONS: {
    USING_ALT_API: "I'm using an alternative API",
    SET_API_KEY: "Set API Key",
    SETTING_API_KEY: "Setting API Key...",
  },
  PRICING_INFO: {
    TITLE: "Note: OpenAI API has costs associated with it",
    DESCRIPTION: "If you're not already aware - OpenAI's API does have costs associated with it. However, new accounts do receive a $5 credit to get started. When you ask a question in this extension, it will likely cost a fraction of a cent in API usage.",
    EXAMPLE_PART1: "For example if all of the text in this extension window was from AI, it would've cost approximately",
    EXAMPLE_PART2: "in API usage on GPT-3.5-turbo. Be aware that if you use OpenAI's GPT-4, it is significantly",
    EXAMPLE_PART3: "more expensive than GPT-3.5-turbo, potentially costing around",
    MORE_DETAILS: "View openai.com/pricing for more details",
  },
};

/**
 * Props for the ApiKeySetup component
 */
interface ApiKeySetupProps {
  /** VS Code API instance */
  vscode: any;

  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Component for setting up the OpenAI API key
 *
 * Features:
 * - API key input with secure storage
 * - Alternative API URL configuration
 * - Instructions for obtaining an API key
 * - Error handling for invalid API keys
 * - Pricing information
 *
 * @param props - Component properties
 * @returns React component
 */
const ApiKeySetup = ({ vscode, className }: ApiKeySetupProps): ReactElement => {
  // State for form inputs and UI
  const [apiKey, setApiKey] = useState<string>("");
  const [apiUrl, setApiUrl] = useState<string>("");
  const [showApiUrl, setShowApiUrl] = useState<boolean>(false);

  // Redux state and dispatch
  const dispatch = useAppDispatch();
  const apiKeyStatus = useAppSelector(
    (state: RootState) => state.app?.apiKeyStatus
  );

  // Communication with backend
  const backendMessenger = useMessenger(vscode);

  // Reference to API URL input for validation
  const apiUrlInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles form submission to set API key and URL
   */
  const handleSubmit = (): void => {
    // Update status to show pending state
    dispatch(setApiKeyStatus(ApiKeyStatus.Pending));

    // Send API URL if provided
    if (showApiUrl && apiUrl) {
      backendMessenger.sendChangeApiUrl(apiUrl);
    }

    // Send API key
    backendMessenger.sendChangeApiKey(apiKey);
  };

  /**
   * Handles changes to the API key input
   */
  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setApiKey(event.target.value);
  };

  /**
   * Handles changes to the API URL input
   */
  const handleApiUrlChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setApiUrl(event.target.value);
  };

  /**
   * Checks if an API key error should be displayed
   */
  const isApiKeyError = (): boolean => {
    return (apiKeyStatus === ApiKeyStatus.Invalid &&
      !!apiUrlInputRef.current?.value.length);
  };

  /**
   * Checks if the form is in a pending state
   */
  const isPending = (): boolean => {
    return apiKeyStatus === ApiKeyStatus.Pending;
  };

  /**
   * Renders the instructions section
   */
  const renderInstructions = (): ReactElement => (
    <div
      className="flex flex-col gap-1.5 p-3 bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)] border border-tab-inactive/30 rounded-sm"
      role="region"
      aria-labelledby="instructionsTitle"
    >
      <h2 id="instructionsTitle" className="text-[13px] font-medium flex items-center text-gray-700 dark:text-gray-300">
        <Icon name={IconName.Settings} className="w-3.5 h-3.5 mr-1.5 text-gray-500 dark:text-gray-400" />
        How to Set Up Your OpenAI API Key
      </h2>

      <div className="mt-1 space-y-2">
        <div className="flex items-start">
          <div className="flex-shrink-0 h-4 w-4 flex items-center justify-center rounded-full bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.03)] text-gray-600 dark:text-gray-400 mr-1.5 font-medium text-[10px]">
            1
          </div>
          <div className="text-[11px] text-gray-600 dark:text-gray-400">
            Create an OpenAI account at{" "}
            <a
              href="https://platform.openai.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="OpenAI Platform"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
            >
              platform.openai.com
              <Icon name={IconName.ChevronRight} className="w-2.5 h-2.5 ml-0.5" />
            </a>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 h-4 w-4 flex items-center justify-center rounded-full bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.03)] text-gray-600 dark:text-gray-400 mr-1.5 font-medium text-[10px]">
            2
          </div>
          <div className="text-[11px] text-gray-600 dark:text-gray-400">
            Navigate to API Keys page at{" "}
            <a
              href="https://platform.openai.com/account/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="OpenAI API Keys page"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
            >
              platform.openai.com/account/api-keys
              <Icon name={IconName.ChevronRight} className="w-2.5 h-2.5 ml-0.5" />
            </a>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 h-4 w-4 flex items-center justify-center rounded-full bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.03)] text-gray-600 dark:text-gray-400 mr-1.5 font-medium text-[10px]">
            3
          </div>
          <div className="text-[11px] text-gray-600 dark:text-gray-400">
            Click <span className="inline-flex items-center px-1 py-0.5 mx-0.5 text-[10px] rounded-sm bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)] text-gray-700 dark:text-gray-300 border border-tab-inactive/20">Create new secret key</span> to generate a new API key
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 h-4 w-4 flex items-center justify-center rounded-full bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.03)] text-gray-600 dark:text-gray-400 mr-1.5 font-medium text-[10px]">
            4
          </div>
          <div className="text-[11px] text-gray-600 dark:text-gray-400">
            Copy the key and paste below. Note: Your key will be stored securely using VS Code's Secret Storage.
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Renders the API key input field
   */
  const renderApiKeyInput = (): ReactElement => (
    <div className="flex flex-col">
      <label
        htmlFor="api-key"
        className="mb-1 text-[12px] font-medium text-gray-700 dark:text-gray-300 flex items-center"
      >
        <Icon name={IconName.Box} className="w-3 h-3 mr-1.5 text-gray-500 dark:text-gray-400" />
        API Key
      </label>
      <div className="mt-1 relative rounded-sm shadow-sm">
        <input
          type="password"
          id="api-key"
          name="api-key"
          placeholder={API_STRINGS.PLACEHOLDERS.API_KEY}
          autoComplete="off"
          value={apiKey}
          onChange={handleApiKeyChange}
          required
          aria-describedby="api-key-error"
          className={`block w-full px-2 py-1.5 text-[11px] rounded-sm border border-tab-inactive/40 text-gray-700 dark:text-gray-300 bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)] focus:outline-none focus:border-tab-inactive/60 ${isApiKeyError() ? "border-red-500" : ""
            }`}
        />
      </div>
      {renderApiKeyError()}
    </div>
  );

  /**
   * Renders the API key error message if needed
   */
  const renderApiKeyError = (): ReactElement | null => {
    if (!isApiKeyError()) { return null; }

    return (
      <div
        className="mt-1 flex items-start"
        id="api-key-error"
        role="alert"
      >
        <div className="flex-shrink-0">
          <Icon name={IconName.AlertTriangle} className="h-4 w-4 text-red-500" />
        </div>
        <div className="ml-1">
          <h3 className="text-[11px] font-medium text-red-500">
            {API_STRINGS.INVALID_API_KEY.TITLE}
          </h3>
          <p className="text-[10px] text-gray-600 dark:text-gray-400">
            {API_STRINGS.INVALID_API_KEY.DESCRIPTION}
            <a
              href="https://status.openai.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
            >
              status.openai.com
            </a>
            {API_STRINGS.INVALID_API_KEY.CLOSING}
          </p>
        </div>
      </div>
    );
  };

  /**
   * Renders the alternative API URL input if enabled
   */
  const renderApiUrlInput = (): ReactElement | null => {
    if (!showApiUrl) { return null; }

    return (
      <div className="mt-3">
        <label
          htmlFor="api-url"
          className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 flex items-center"
        >
          <Icon name={IconName.Box} className="w-3 h-3 mr-1.5 text-gray-500 dark:text-gray-400" />
          {API_STRINGS.ALT_API_URL.LABEL}
        </label>
        <div className="mt-1">
          <input
            ref={apiUrlInputRef}
            type="url"
            name="api-url"
            id="api-url"
            placeholder={API_STRINGS.PLACEHOLDERS.API_URL}
            value={apiUrl}
            onChange={handleApiUrlChange}
            className="block w-full px-2 py-1.5 text-[11px] rounded-sm border border-tab-inactive/40 text-gray-700 dark:text-gray-300 bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)] focus:outline-none focus:border-tab-inactive/60"
          />
        </div>
        <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
          {API_STRINGS.ALT_API_URL.DESCRIPTION}
        </p>
      </div>
    );
  };

  /**
   * Renders the action buttons
   */
  const renderActionButtons = (): ReactElement => (
    <div className="flex flex-col space-y-3">
      <div className="flex justify-start">
        <button
          type="button"
          onClick={() => setShowApiUrl(!showApiUrl)}
          className="text-[11px] px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(0,0,0,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] border border-tab-inactive/30 rounded-sm transition-colors"
        >
          {showApiUrl ? "Hide alternative API URL" : API_STRINGS.BUTTONS.USING_ALT_API}
        </button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!apiKey || isPending()}
          className={`flex items-center px-2 py-1 text-[11px] rounded-sm border border-tab-inactive/40 focus:outline-none transition-colors ${!apiKey || isPending()
            ? "opacity-50 cursor-not-allowed bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)] text-gray-500 dark:text-gray-400"
            : "bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)] text-gray-700 dark:text-gray-300"
            }`}
        >
          {isPending() ? (
            <>
              <Icon name={IconName.Refresh} className="animate-spin -ml-0.5 mr-1.5 h-3 w-3" />
              {API_STRINGS.BUTTONS.SETTING_API_KEY}
            </>
          ) : (
            API_STRINGS.BUTTONS.SET_API_KEY
          )}
        </button>
      </div>
    </div>
  );

  /**
   * Renders pricing information
   */
  const renderPricingInfo = (): ReactElement => (
    <div className="mt-4 p-3 bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)] border border-tab-inactive/30 rounded-sm">
      <h3 className="text-[12px] font-medium text-gray-700 dark:text-gray-300 flex items-center">
        <Icon name={IconName.AlertTriangle} className="w-3 h-3 mr-1.5 text-gray-500 dark:text-gray-400" />
        {API_STRINGS.PRICING_INFO.TITLE}
      </h3>
      <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">
        {API_STRINGS.PRICING_INFO.DESCRIPTION}
      </p>
      <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">
        {API_STRINGS.PRICING_INFO.EXAMPLE_PART1} <span className="font-medium text-gray-700 dark:text-gray-300">$0.003</span> {API_STRINGS.PRICING_INFO.EXAMPLE_PART2} <span className="font-medium text-gray-700 dark:text-gray-300">10-20x</span> {API_STRINGS.PRICING_INFO.EXAMPLE_PART3} <span className="font-medium text-gray-700 dark:text-gray-300">$0.06</span>.
      </p>
      <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">
        <a
          href="https://openai.com/pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
        >
          {API_STRINGS.PRICING_INFO.MORE_DETAILS}
          <Icon name={IconName.ChevronRight} className="w-2.5 h-2.5 ml-0.5" />
        </a>
      </p>
    </div>
  );

  /**
   * Main render function
   */
  return (
    <div
      className={`max-w-md mx-auto p-4 ${className}`}
      aria-labelledby="api-setup-heading"
    >
      <h1
        id="api-setup-heading"
        className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4"
      >
        {API_STRINGS.HEADING}
      </h1>

      <div className="space-y-4">
        {renderInstructions()}
        <div className="mt-4">
          {renderApiKeyInput()}
          {renderApiUrlInput()}
        </div>
        <div className="mt-4">
          {renderActionButtons()}
        </div>
        {renderPricingInfo()}
      </div>
    </div>
  );
};

export default ApiKeySetup;
