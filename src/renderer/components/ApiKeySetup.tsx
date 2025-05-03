import React, { ReactElement, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
    EXAMPLE_PART1: "For example if all of the text in this extension window was from ai, it would've cost",
    EXAMPLE_PART2: "in API usage on GPT-3.5-turbo. Beware if you use OpenAI's, GPT-4, it is",
    EXAMPLE_PART3: "more expensive than GPT-3.5-turbo at",
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
    <div>
      <h2 className="text-lg mb-1">
        {API_STRINGS.INSTRUCTIONS.TITLE}
      </h2>
      <ol className="list-decimal list-inside">
        <li>
          {API_STRINGS.INSTRUCTIONS.STEP1}{" "}
          <a
            href="https://platform.openai.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="OpenAI Platform"
          >
            https://platform.openai.com
          </a>
        </li>
        <li>
          {API_STRINGS.INSTRUCTIONS.STEP2}{" "}
          <a
            href="https://platform.openai.com/account/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="OpenAI API Keys page"
          >
            https://platform.openai.com/account/api-keys
          </a>
        </li>
        <li>
          {API_STRINGS.INSTRUCTIONS.STEP3}
        </li>
        <li>
          {API_STRINGS.INSTRUCTIONS.STEP4}
        </li>
        <li>
          {API_STRINGS.INSTRUCTIONS.STEP5A}{" "}
          <a
            href="https://github.com/M31Lab/Mini"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
          >
            {API_STRINGS.INSTRUCTIONS.STEP5B}
          </a>
          {API_STRINGS.INSTRUCTIONS.STEP5C}
        </li>
      </ol>
    </div>
  );

  /**
   * Renders the API key input field
   */
  const renderApiKeyInput = (): ReactElement => (
    <div>
      <label htmlFor="apiKey" className="block font-bold mb-2">
        {API_STRINGS.API_KEY_LABEL}
      </label>
      <div className="flex gap-x-4">
        <input
          type="password"
          id="apiKey"
          value={apiKey}
          onChange={handleApiKeyChange}
          placeholder={API_STRINGS.PLACEHOLDERS.API_KEY}
          className="flex-grow px-3 py-2 rounded-sm border text-input text-sm border-input bg-input outline-0"
          disabled={isPending()}
          aria-required="true"
          aria-describedby="apiKeyError"
          autoComplete="off"
        />
      </div>
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
        className="flex flex-col gap-2 p-4 bg-red-500 text bg-opacity-10 rounded"
        role="alert"
      >
        <h2 className="font-medium">
          {API_STRINGS.INVALID_API_KEY.TITLE}
        </h2>
        <p>
          {API_STRINGS.INVALID_API_KEY.DESCRIPTION}
          <a
            href="https://status.openai.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="OpenAI Status page"
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
      <div>
        <label htmlFor="apiUrl" className="block font-bold mb-2">
          {API_STRINGS.ALT_API_URL.LABEL}
        </label>
        <p id="apiUrlDescription" className="text-xs mb-2">
          {API_STRINGS.ALT_API_URL.DESCRIPTION}
        </p>
        <div className="flex gap-x-4">
          <input
            type="text"
            ref={apiUrlInputRef}
            id="apiUrl"
            value={apiUrl}
            onChange={handleApiUrlChange}
            placeholder={API_STRINGS.PLACEHOLDERS.API_URL}
            className="flex-grow px-3 py-2 rounded-sm border text-input text-sm border-input bg-input outline-0"
            disabled={isPending()}
            aria-describedby="apiUrlDescription"
            autoComplete="url"
          />
        </div>
      </div>
    );
  };

  /**
   * Renders the action buttons
   */
  const renderActionButtons = (): ReactElement => (
    <div className="flex gap-x-4 justify-end">
      {!showApiUrl && (
        <Link
          to="/api"
          className="rounded px-4 py-2 flex flex-row items-center text-button-secondary bg-button-secondary hover:bg-button-secondary-hover focus:bg-button-secondary-hover hover:text-button-secondary-hover focus:text-button-secondary-hover"
          aria-label="Configure alternative API"
          onClick={() => setShowApiUrl(true)}
        >
          {API_STRINGS.BUTTONS.USING_ALT_API}
        </Link>
      )}
      <button
        onClick={handleSubmit}
        className="ask-button rounded px-4 py-2 flex flex-row items-center bg-button hover:bg-button-hover focus:bg-button-hover"
        disabled={isPending()}
        aria-busy={isPending()}
      >
        {isPending() ? (
          <span className="flex items-center gap-2">
            <span>{API_STRINGS.BUTTONS.SETTING_API_KEY}</span>
            <Icon name={IconName.Wave} className="w-4 h-4 ml-2" />
          </span>
        ) : (
          <span>{API_STRINGS.BUTTONS.SET_API_KEY}</span>
        )}
      </button>
    </div>
  );

  /**
   * Renders the pricing information section
   */
  const renderPricingInfo = (): ReactElement => (
    <div
      className="flex flex-col gap-2 p-4 bg-purple-500 text bg-opacity-10 rounded"
      role="region"
      aria-labelledby="pricingInfoTitle"
    >
      <h2 id="pricingInfoTitle" className="font-medium">
        {API_STRINGS.PRICING_INFO.TITLE}
      </h2>
      <p>
        {API_STRINGS.PRICING_INFO.DESCRIPTION}
      </p>
      <p>
        {API_STRINGS.PRICING_INFO.EXAMPLE_PART1}{" "}
        <span className="font-code">$0.00054</span>{" "}
        {API_STRINGS.PRICING_INFO.EXAMPLE_PART2}{" "}
        <span className="font-code underline">30x</span>{" "}
        {API_STRINGS.PRICING_INFO.EXAMPLE_PART3}{" "}
        <span className="font-code">$0.01848</span>.
      </p>
      <a
        href="https://openai.com/pricing"
        className="underline"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="OpenAI pricing page"
      >
        {API_STRINGS.PRICING_INFO.MORE_DETAILS}
      </a>
    </div>
  );

  return (
    <div
      className={`flex flex-col justify-start gap-3.5 h-full items-center px-6 pt-6 pb-24 w-full relative login-screen overflow-auto ${className}`}
      role="form"
      aria-labelledby="apiSetupHeading"
    >
      <Icon
        name={IconName.Help}
        className="w-16 h-16"
        aria-hidden="true"
      />
      <div className="w-full max-w-lg flex flex-col gap-3.5 text-xs">
        <div className="flex items-center gap-4">
          <Icon
            name={IconName.Box}
            className="w-24 h-24 p-2"
            aria-hidden="true"
          />
          <div className="flex-grow flex flex-col justify-start">
            <h1 id="apiSetupHeading" className="text-xl mb-2">
              {API_STRINGS.HEADING}
            </h1>
            <p className="font-semibold">
              {API_STRINGS.INSTRUCTIONS.INTRO}
            </p>
          </div>
        </div>
        {renderInstructions()}
        {renderApiKeyInput()}
        {renderApiKeyError()}
        {renderApiUrlInput()}
        {renderActionButtons()}
        {renderPricingInfo()}
      </div>
    </div>
  );
};

export default ApiKeySetup;
