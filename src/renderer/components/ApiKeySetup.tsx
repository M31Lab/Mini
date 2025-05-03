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
      className="flex flex-col gap-2 p-6 bg-blue-500/5 border border-blue-200 dark:border-blue-900 rounded-lg shadow-sm"
      role="region"
      aria-labelledby="instructionsTitle"
    >
      <h2 id="instructionsTitle" className="font-medium flex items-center text-blue-800 dark:text-blue-300">
        <Icon name={IconName.Settings} className="w-5 h-5 mr-2 text-blue-500" />
        How to Set Up Your OpenAI API Key
      </h2>

      <div className="mt-2 space-y-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 mr-3 font-medium text-sm">
            1
          </div>
          <div className="text-gray-700 dark:text-gray-300">
            Create an OpenAI account at{" "}
            <a
              href="https://platform.openai.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="OpenAI Platform"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              platform.openai.com
              <Icon name={IconName.ChevronRight} className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 mr-3 font-medium text-sm">
            2
          </div>
          <div className="text-gray-700 dark:text-gray-300">
            Navigate to API Keys page at{" "}
            <a
              href="https://platform.openai.com/account/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="OpenAI API Keys page"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              platform.openai.com/account/api-keys
              <Icon name={IconName.ChevronRight} className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 mr-3 font-medium text-sm">
            3
          </div>
          <div className="text-gray-700 dark:text-gray-300">
            Click <span className="inline-flex items-center px-2 py-1 mx-1 text-sm font-medium rounded-md bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">Create new secret key</span> to generate a new API key
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 mr-3 font-medium text-sm">
            4
          </div>
          <div className="text-gray-700 dark:text-gray-300">
            Copy your new key and paste it in the input field below
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 mr-3 font-medium text-sm">
            5
          </div>
          <div className="text-gray-700 dark:text-gray-300">
            Your key is securely stored using VSCode's secret storage and never sent to any server.{" "}
            <a
              href="https://github.com/M31Lab/Mini"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              View the source code
              <Icon name={IconName.ChevronRight} className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
        <Icon name={IconName.AlertTriangle} className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
        <p className="text-amber-700 dark:text-amber-300 text-sm">
          Remember to keep your API key secure. Never share it publicly or commit it to version control.
        </p>
      </div>
    </div>
  );

  /**
   * Renders the API key input field
   */
  const renderApiKeyInput = (): ReactElement => (
    <div className="bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] border border-tab-inactive/30 rounded-sm p-4">
      <label htmlFor="apiKey" className="block font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center">
        <Icon name={IconName.Settings} className="w-4 h-4 mr-2 text-gray-500" />
        {API_STRINGS.API_KEY_LABEL}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon name={IconName.Settings} className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="password"
          id="apiKey"
          value={apiKey}
          onChange={handleApiKeyChange}
          placeholder={API_STRINGS.PLACEHOLDERS.API_KEY}
          className="w-full pl-10 pr-10 py-2 rounded-sm border border-tab-inactive/40 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 outline-0 focus:border-tab-active transition-colors text-sm"
          disabled={isPending()}
          aria-required="true"
          aria-describedby="apiKeyError"
          autoComplete="off"
        />
        {apiKeyStatus === ApiKeyStatus.Valid && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="text-green-500 p-1">
              <Icon name={IconName.Check} className="w-3 h-3" />
            </div>
          </div>
        )}
        {apiKeyStatus === ApiKeyStatus.Invalid && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="text-red-500 p-1">
              <Icon name={IconName.Cancel} className="w-3 h-3" />
            </div>
          </div>
        )}
        {apiKeyStatus === ApiKeyStatus.Pending && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="text-gray-500 p-1">
              <Icon name={IconName.Refresh} className="w-3 h-3 animate-spin" />
            </div>
          </div>
        )}
      </div>
      {isApiKeyError() && renderApiKeyError()}
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Enter your OpenAI API key above. The key starts with "sk-".
      </p>
    </div>
  );

  /**
   * Renders the API key error message if applicable
   */
  const renderApiKeyError = (): ReactElement | null => {
    if (!isApiKeyError()) { return null; }

    return (
      <div
        id="apiKeyError"
        className="flex flex-col gap-2 p-3 mt-3 bg-[rgba(255,0,0,0.05)] border border-tab-inactive/40 rounded-sm text-red-700 dark:text-red-300"
        role="alert"
      >
        <h2 className="font-medium flex items-center text-sm">
          <Icon name={IconName.AlertTriangle} className="w-4 h-4 mr-2" />
          {API_STRINGS.INVALID_API_KEY.TITLE}
        </h2>
        <p className="text-xs">
          {API_STRINGS.INVALID_API_KEY.DESCRIPTION}
          <a
            href="https://status.openai.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="OpenAI Status page"
            className="text-red-700 dark:text-red-300 underline font-medium"
          >
            https://status.openai.com/
          </a>
          {API_STRINGS.INVALID_API_KEY.CLOSING}
        </p>
      </div>
    );
  };

  /**
   * Renders the alternative API URL input if enabled
   */
  const renderApiUrlInput = (): ReactElement | null => {
    if (!showApiUrl) { return null; }

    return (
      <div className="bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] rounded-sm border border-tab-inactive/30 p-4 mt-4">
        <label htmlFor="apiUrl" className="block font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center">
          <Icon name={IconName.Help} className="w-4 h-4 mr-2 text-gray-500" />
          {API_STRINGS.ALT_API_URL.LABEL}
        </label>
        <p id="apiUrlDescription" className="text-xs mb-2 text-gray-600 dark:text-gray-400">
          {API_STRINGS.ALT_API_URL.DESCRIPTION}
        </p>
        <input
          type="text"
          ref={apiUrlInputRef}
          id="apiUrl"
          value={apiUrl}
          onChange={handleApiUrlChange}
          placeholder={API_STRINGS.PLACEHOLDERS.API_URL}
          className="w-full px-3 py-2 rounded-sm border border-tab-inactive/40 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 outline-0 focus:border-tab-active transition-colors text-sm"
          disabled={isPending()}
          aria-describedby="apiUrlDescription"
          autoComplete="url"
        />
      </div>
    );
  };

  /**
   * Renders the action buttons
   */
  const renderActionButtons = (): ReactElement => (
    <div className="flex flex-col md:flex-row gap-2 mt-4">
      <button
        type="button"
        className="bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)] px-4 py-2 border border-tab-inactive/30 rounded-sm text-xs font-medium flex-1 flex justify-center items-center transition-colors"
        onClick={() => setShowApiUrl(!showApiUrl)}
      >
        <Icon name={IconName.Box} className="w-3.5 h-3.5 mr-2 text-gray-500 dark:text-gray-400" />
        {API_STRINGS.BUTTONS.USING_ALT_API}
      </button>
      <button
        type="button"
        disabled={isPending() || !apiKey}
        className="bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(0,0,0,0.08)] dark:hover:bg-[rgba(255,255,255,0.08)] disabled:opacity-50 disabled:hover:bg-[rgba(0,0,0,0.05)] dark:disabled:hover:bg-[rgba(255,255,255,0.05)] px-4 py-2 rounded-sm text-xs font-medium text-gray-700 dark:text-gray-300 flex-1 flex justify-center items-center transition-colors"
        onClick={handleSubmit}
      >
        {isPending() ? (
          <>
            <div className="mr-2 h-3 w-3 rounded-full border-2 border-gray-500 dark:border-gray-400 border-t-transparent animate-spin"></div>
            {API_STRINGS.BUTTONS.SETTING_API_KEY}
          </>
        ) : (
          <>
            <Icon name={IconName.Settings} className="w-3.5 h-3.5 mr-2" />
            {API_STRINGS.BUTTONS.SET_API_KEY}
          </>
        )}
      </button>
    </div>
  );

  /**
   * Renders the pricing information section
   */
  const renderPricingInfo = (): ReactElement => (
    <div
      className="flex flex-col gap-3 p-4 mt-6 bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] border border-tab-inactive/30 rounded-sm"
      role="region"
      aria-labelledby="pricingInfoTitle"
    >
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0 p-1 rounded-sm bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.03)] text-gray-600 dark:text-gray-400">
          <Icon name={IconName.Zap} className="w-3.5 h-3.5" />
        </div>
        <h2 id="pricingInfoTitle" className="font-medium text-sm text-gray-700 dark:text-gray-300">
          {API_STRINGS.PRICING_INFO.TITLE}
        </h2>
      </div>

      <div className="text-gray-600 dark:text-gray-400 space-y-2 text-xs">
        <p>{API_STRINGS.PRICING_INFO.DESCRIPTION}</p>

        <div className="bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)] p-3 rounded-sm border border-tab-inactive/20">
          <p className="flex flex-wrap items-center gap-1">
            <span>{API_STRINGS.PRICING_INFO.EXAMPLE_PART1}</span>
            <span className="inline-flex items-center px-1 py-0.5 text-xs font-mono rounded-sm bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.03)] text-gray-700 dark:text-gray-300">$0.00054</span>
            <span>{API_STRINGS.PRICING_INFO.EXAMPLE_PART2}</span>
            <span className="inline-flex items-center px-1 py-0.5 text-xs rounded-sm bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.03)] text-gray-700 dark:text-gray-300 font-mono">30x</span>
            <span>{API_STRINGS.PRICING_INFO.EXAMPLE_PART3}</span>
            <span className="inline-flex items-center px-1 py-0.5 text-xs font-mono rounded-sm bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.03)] text-gray-700 dark:text-gray-300">$0.01848</span>.
          </p>
        </div>
      </div>

      <a
        href="https://openai.com/pricing"
        className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center mt-1 text-xs"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="OpenAI pricing page"
      >
        <Icon name={IconName.Box} className="w-3 h-3 mr-1" />
        {API_STRINGS.PRICING_INFO.MORE_DETAILS}
      </a>
    </div>
  );

  return (
    <div
      className={`flex flex-col justify-start gap-4 h-full items-center px-4 pt-6 pb-16 w-full relative login-screen overflow-auto ${className}`}
      role="form"
      aria-labelledby="apiSetupHeading"
    >
      <div className="w-full max-w-2xl flex flex-col gap-4">
        <div className="text-center mb-2">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="p-4 bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] rounded-sm flex items-center justify-center">
                <Icon name={IconName.Box} className="w-12 h-12 text-gray-600 dark:text-gray-400" aria-hidden="true" />
              </div>
            </div>
          </div>
          <h1 id="apiSetupHeading" className="text-xl font-medium mb-2 text-gray-800 dark:text-gray-200">
            {API_STRINGS.HEADING}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            {API_STRINGS.INSTRUCTIONS.INTRO}
          </p>
        </div>

        {renderInstructions()}
        {renderApiKeyInput()}
        {renderApiUrlInput()}
        {renderActionButtons()}
        {renderPricingInfo()}
      </div>
    </div>
  );
};

export default ApiKeySetup;
