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
    <div className="bg-indigo-500/5 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-900 rounded-lg p-6 shadow-sm">
      <label htmlFor="apiKey" className="block font-medium mb-3 text-indigo-800 dark:text-indigo-300 flex items-center">
        <Icon name={IconName.Settings} className="w-5 h-5 mr-2 text-indigo-500" />
        {API_STRINGS.API_KEY_LABEL}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon name={IconName.Settings} className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="password"
          id="apiKey"
          value={apiKey}
          onChange={handleApiKeyChange}
          placeholder={API_STRINGS.PLACEHOLDERS.API_KEY}
          className="w-full pl-10 pr-10 py-3 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 outline-0 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 shadow-sm"
          disabled={isPending()}
          aria-required="true"
          aria-describedby="apiKeyError"
          autoComplete="off"
        />
        {apiKeyStatus === ApiKeyStatus.Valid && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="text-green-500 bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
              <Icon name={IconName.Check} className="w-4 h-4" />
            </div>
          </div>
        )}
        {apiKeyStatus === ApiKeyStatus.Invalid && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="text-red-500 bg-red-100 dark:bg-red-900/30 p-1 rounded-full">
              <Icon name={IconName.Cancel} className="w-4 h-4" />
            </div>
          </div>
        )}
        {apiKeyStatus === ApiKeyStatus.Pending && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="text-amber-500 bg-amber-100 dark:bg-amber-900/30 p-1 rounded-full animate-pulse">
              <Icon name={IconName.Refresh} className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
      {isApiKeyError() && renderApiKeyError()}
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
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
        className="flex flex-col gap-2 p-4 mt-4 bg-red-500/10 border border-red-300 dark:border-red-800 rounded-md text-red-700 dark:text-red-300"
        role="alert"
      >
        <h2 className="font-medium flex items-center">
          <Icon name={IconName.AlertTriangle} className="w-5 h-5 mr-2" />
          {API_STRINGS.INVALID_API_KEY.TITLE}
        </h2>
        <p>
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
      <div className="bg-white dark:bg-gray-800/40 rounded-lg p-6 shadow-sm mt-6">
        <label htmlFor="apiUrl" className="block font-bold mb-2 text-gray-800 dark:text-gray-200 flex items-center">
          <Icon name={IconName.Help} className="w-5 h-5 mr-2 text-blue-500" />
          {API_STRINGS.ALT_API_URL.LABEL}
        </label>
        <p id="apiUrlDescription" className="text-xs mb-3 text-gray-600 dark:text-gray-400">
          {API_STRINGS.ALT_API_URL.DESCRIPTION}
        </p>
        <input
          type="text"
          ref={apiUrlInputRef}
          id="apiUrl"
          value={apiUrl}
          onChange={handleApiUrlChange}
          placeholder={API_STRINGS.PLACEHOLDERS.API_URL}
          className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 text-input text-sm bg-white dark:bg-gray-800 outline-0 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
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
    <div className="flex flex-col md:flex-row gap-3 mt-6">
      <button
        type="button"
        className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 px-5 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium flex-1 flex justify-center items-center transition-colors duration-200 shadow-sm"
        onClick={() => setShowApiUrl(!showApiUrl)}
      >
        <Icon name={IconName.Box} className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
        {API_STRINGS.BUTTONS.USING_ALT_API}
      </button>
      <button
        type="button"
        disabled={isPending() || !apiKey}
        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:hover:from-blue-500 disabled:hover:to-indigo-600 px-5 py-3 rounded-md text-sm font-medium text-white flex-1 flex justify-center items-center transition-all duration-200 shadow-md"
        onClick={handleSubmit}
      >
        {isPending() ? (
          <>
            <div className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
            {API_STRINGS.BUTTONS.SETTING_API_KEY}
          </>
        ) : (
          <>
            <Icon name={IconName.Settings} className="w-4 h-4 mr-2" />
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
      className="flex flex-col gap-4 p-6 mt-8 bg-purple-500/5 border border-purple-200 dark:border-purple-900 rounded-lg shadow-sm"
      role="region"
      aria-labelledby="pricingInfoTitle"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 p-2 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
          <Icon name={IconName.Zap} className="w-5 h-5" />
        </div>
        <h2 id="pricingInfoTitle" className="font-medium text-lg text-purple-800 dark:text-purple-300">
          {API_STRINGS.PRICING_INFO.TITLE}
        </h2>
      </div>

      <div className="text-gray-700 dark:text-gray-300 space-y-3">
        <p>{API_STRINGS.PRICING_INFO.DESCRIPTION}</p>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
          <p className="flex flex-wrap items-center gap-1">
            <span>{API_STRINGS.PRICING_INFO.EXAMPLE_PART1}</span>
            <span className="inline-flex items-center px-2 py-1 text-sm font-mono font-medium rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">$0.00054</span>
            <span>{API_STRINGS.PRICING_INFO.EXAMPLE_PART2}</span>
            <span className="inline-flex items-center px-2 py-1 text-sm font-medium rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 font-mono">30x</span>
            <span>{API_STRINGS.PRICING_INFO.EXAMPLE_PART3}</span>
            <span className="inline-flex items-center px-2 py-1 text-sm font-mono font-medium rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">$0.01848</span>.
          </p>
        </div>
      </div>

      <a
        href="https://openai.com/pricing"
        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center mt-1 text-sm font-medium"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="OpenAI pricing page"
      >
        <Icon name={IconName.Box} className="w-4 h-4 mr-2" />
        {API_STRINGS.PRICING_INFO.MORE_DETAILS}
      </a>
    </div>
  );

  return (
    <div
      className={`flex flex-col justify-start gap-6 h-full items-center px-6 pt-8 pb-24 w-full relative login-screen overflow-auto bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900/30 ${className}`}
      role="form"
      aria-labelledby="apiSetupHeading"
    >
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div className="text-center mb-4">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-75 group-hover:opacity-100 blur-lg transition-all duration-500"></div>
              <div className="relative rounded-full p-6 bg-white dark:bg-gray-800 flex items-center justify-center">
                <Icon name={IconName.Box} className="w-16 h-16 text-blue-500" aria-hidden="true" />
              </div>
            </div>
          </div>
          <h1 id="apiSetupHeading" className="text-3xl font-bold mb-3 text-gray-800 dark:text-gray-100 bg-gradient-to-r from-blue-500 to-purple-600 inline-block text-transparent bg-clip-text">
            {API_STRINGS.HEADING}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
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
