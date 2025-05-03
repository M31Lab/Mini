import React, { useCallback, useEffect, useState } from "react";
import CodeBlock from "../components/CodeBlock";
import { Icon, IconName } from "../components/Icon";
import { useDebounce } from "../helpers";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../send-to-backend";
import { RootState } from "../store";
import {
  ApiKeyStatus,
  setApiKeyStatus,
  setExtensionSettings,
} from "../store/app";
import { DEFAULT_EXTENSION_SETTINGS, Model } from "../types";

// Add custom animations for the splash page
const splashAnimations = `
  @keyframes pulse-slow {
    0% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
    100% { opacity: 0.6; transform: scale(1); }
  }
  @keyframes spin-slow {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .animate-pulse-slow {
    animation: pulse-slow 4s ease-in-out infinite;
  }
  .animate-spin-slow {
    animation: spin-slow 10s linear infinite;
  }
  .animation-delay-1000 {
    animation-delay: 1s;
  }
  .animation-delay-2000 {
    animation-delay: 2s;
  }
`;

const API_KEY_PLACEHOLDER = "sk-...";
interface LlmTemplate {
  name: string;
  instructions: string;
  apiUrl?: URL;
  azureApiVersion?: string;
  docsUrl?: URL;
  showApiKeyInput?: boolean;
  showAllModelSuggestion?: boolean;
  manualModelInput?: boolean;
  showAzureApiVersionInput?: boolean;
  showModelSelection?: boolean;
  tested?: boolean;
}
const LLM_TEMPLATES: LlmTemplate[] = [
  {
    name: "Official OpenAI API",
    instructions:
      "Ensure you have an API key set to use the official OpenAI API.",
    apiUrl: new URL(DEFAULT_EXTENSION_SETTINGS.gpt3.apiBaseUrl),
    docsUrl: new URL(
      "https://platform.openai.com/docs/api-reference/authentication"
    ),
    showApiKeyInput: true,
    showAllModelSuggestion: false,
    tested: true,
  },
  {
    name: "Proxy of OpenAI API (openai-proxy.dev)",
    instructions:
      "This is a proxy of the official OpenAI API. It's for anyone in a geographical location where openai.com is blocked. It's hosted by the author of this extension using Cloudflare Workers.",
    apiUrl: new URL("https://openai-proxy.dev/v1"),
    docsUrl: new URL(
      "https://github.com/M31Lab/Mini#proxy-and-local-llms"
    ),
    showApiKeyInput: true,
    showAllModelSuggestion: false,
    tested: true,
  },
  {
    name: "Azure OpenAI API",
    instructions:
      "1. Create an Azure account.\n2. Create a deployment in Azure OpenAI Studio > Deployments.\n3. Enter the endpoint URL with the deployment ID.\nRemember to place `my-service-name` and `my-deployment-id` with your own values.",
    apiUrl: new URL(
      "https://my-service-name.openai.azure.com/deployments/my-deployment-id"
    ),
    azureApiVersion: "2024-02-01",
    docsUrl: new URL(
      "https://learn.microsoft.com/en-us/azure/ai-services/openai/overview"
    ),
    showApiKeyInput: true,
    showAllModelSuggestion: false,
    showAzureApiVersionInput: true,
    tested: true,
  },
  {
    name: "OpenRouter AI",
    instructions:
      "To use OpenRouter AI, you must have an account at https://openrouter.ai and provide your API key. You can select from a wide range of models available on OpenRouter.",
    apiUrl: new URL("https://openrouter.ai/api/v1"),
    docsUrl: new URL("https://openrouter.ai/docs"),
    showApiKeyInput: true,
    showAllModelSuggestion: true,
    showModelSelection: true,
    tested: true,
  },
  {
    name: "text-generation-webui",
    instructions:
      "1. To start text-generation-webui in API-only mode, open your terminal and run: \n\n```bash\npython server.py --api\n```2. Important - You must open the text-generation-webui at http://localhost:7860 and load a model.",
    apiUrl: new URL("http://localhost:5000/v1"),
    docsUrl: new URL(
      "https://github.com/oobabooga/text-generation-webui/wiki/12-%E2%80%90-OpenAI-API"
    ),
    showAllModelSuggestion: true,
    tested: true,
  },
  {
    name: "LocalAI",
    instructions:
      "Just start LocalAI like normal, it should automatically host an OpenAI-compatible API at localhost:8080",
    apiUrl: new URL("http://localhost:8080/v1"),
    docsUrl: new URL("https://localai.io/features/openai-functions/"),
    showAllModelSuggestion: true,
    tested: true,
  },
  {
    name: "ollama",
    instructions:
      "ollama automatically runs its API in the background after install. If it's not running, you can start it with `ollama serve` in your terminal.\nOnly installed models will be shown.\nThis extension does not support installing new models (yet).",
    apiUrl: new URL("http://localhost:11434/v1"),
    docsUrl: new URL(
      "https://github.com/ollama/ollama/blob/main/docs/openai.md"
    ),
    showAllModelSuggestion: true,
    tested: true,
  },
  {
    name: "Modelz LLM",
    instructions:
      "Just run Modelz LLM, for example: \n\n```bash\nmodelz-llm -m bigscience/bloomz-560m --device cpu\n```And the API will be at localhost:8000/v1",
    apiUrl: new URL("http://localhost:8000/v1"),
    docsUrl: new URL("https://github.com/tensorchord/modelz-llm#quick-start"),
    showAllModelSuggestion: true,
    tested: false,
  },
  {
    name: "GPT4All",
    instructions:
      "If you launch the GPT4ALL docker container, the API will be at localhost:4891/v1. The authors indicate that this API may no longer be maintained.",
    apiUrl: new URL("http://localhost:4891/v1"),
    docsUrl: new URL(
      "https://github.com/nomic-ai/gpt4all/tree/cef74c2be20f5b697055d5b8b506861c7b997fab/gpt4all-api"
    ),
    showAllModelSuggestion: true,
    tested: false,
  },
  {
    name: "Other",
    instructions:
      "If you're tool is compatible with OpenAI's API, you can use it here. Set the API URL in the input below. It should starts with 'https' and should (probably) end with '/v1' (without quotes). If the API key is needed, set that too.",
    showApiKeyInput: true,
    showAllModelSuggestion: true,
    manualModelInput: true,
    tested: false,
  },
];

type ApiSettingsProps = {
  vscode: any;
};

const API_STRINGS = {
  SHOW_ALL_MODELS: "Show all models (not just OpenAI models)",
  SHOW_ALL_MODELS_DESCRIPTION: "If checked, every single model available on the API will be shown. This setting is recommended for APIs that serve models different from OpenAI's Official API. However, note that some models listed may not work with this extension.",
  MANUAL_MODEL_INPUT: "Manual Model Input",
  MANUAL_MODEL_INPUT_HINT: "If checked, you can manually input the model ID in the model selection dropdown. This is useful for APIs that do not provide a list of models, such as ollama.",
  TEST_CONNECTION: "Test Connection",
  API_KEY_STATUS: {
    UNSET: "No API key set. Please add one below.",
    VALID: "API key is valid!",
    INVALID: "Invalid API key. Please update below.",
    PENDING: "Checking API key...",
    AUTHENTICATING: "Authenticating...",
    ERROR: "Error checking API key. Please update below.",
    API_KEY_NOTE: "This extension will remember which API key is used for each API URL. Note that some API's, like OpenRouter, will return models even with the wrong API key, so the 'Valid' status may not be accurate.",
    INVALID_API_KEY_TITLE: "Invalid API Key",
    INVALID_API_KEY_DESCRIPTION: "The API key you entered has failed to get an OK response from OpenAI. Please double check the key was copied in correctly. Also, check that OpenAI is not currently experiencing an API outage. ("
  },
  MODEL_SELECTION: {
    TITLE: "Select Model",
    DESCRIPTION: "Select a model from the available options. The list will be populated once you've entered a valid API key.",
    OPENROUTER_DESCRIPTION: "OpenRouter provides access to a wide range of models from different providers. Select the model that best suits your needs.",
  }
};

export default function ApiSettings({ vscode }: ApiSettingsProps): React.ReactElement {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );
  const apiKeyStatus = useAppSelector(
    (state: RootState) => state.app.apiKeyStatus
  );
  const [selectedTool, setSelectedTool] = useState<LlmTemplate>(
    LLM_TEMPLATES.find((tool) => tool.name === "Other") ??
    LLM_TEMPLATES[LLM_TEMPLATES.length - 1]
  );
  const [showUrlSaved, setShowUrlSaved] = useState(false);
  const [showVersionSaved, setShowVersionSaved] = useState(false);
  const apiUrlInputRef = React.createRef<HTMLInputElement>();
  const azureApiVersionInputRef = React.createRef<HTMLInputElement>();
  const [lastApiKeyTest, setLastApiKeyTest] = useState<string | null>(null);
  const backendMessenger = useMessenger(vscode);
  const [models, setModels] = useState<Model[]>([]);

  const handleApiKeyUpdate = useCallback((apiKey: string) => {
    if (apiKey === lastApiKeyTest) {
      return;
    }

    dispatch(setApiKeyStatus(ApiKeyStatus.Pending));
    backendMessenger.sendChangeApiKey(apiKey);
    setLastApiKeyTest(apiKey);
  }, []);

  const debouncedSetApiKey = useDebounce(handleApiKeyUpdate, 2000);

  const handleApiUrlUpdate = useCallback((apiUrl: string) => {
    backendMessenger.sendChangeApiUrl(apiUrl);
    setShowUrlSaved(true);
    setTimeout(() => {
      setShowUrlSaved(false);
    }, 2000);
  }, []);

  const debouncedSetApiUrl = useDebounce(handleApiUrlUpdate, 1000);

  // If the API URL changes, update the selected tool
  useEffect(() => {
    const apiOrigin = new URL(settings.gpt3.apiBaseUrl).origin;
    let matchingTool = LLM_TEMPLATES.find(
      (tool) => tool.apiUrl && tool.apiUrl.origin === apiOrigin
    );

    // Azure uses unique subdomains for each deployment, so we need to check the hostname
    if (!matchingTool && apiOrigin.includes("openai.azure.com")) {
      matchingTool = LLM_TEMPLATES.find(
        (tool) => tool.name === "Azure OpenAI API"
      );
    }

    if (matchingTool) {
      setSelectedTool(matchingTool);
    }
  }, [settings.gpt3.apiBaseUrl]);

  // If the API url changes, update the text input
  useEffect(() => {
    if (apiUrlInputRef.current) {
      apiUrlInputRef.current.value = settings.gpt3.apiBaseUrl;
    }
  }, [settings.gpt3.apiBaseUrl]);

  // If the Azure API Version changes, update the text input
  useEffect(() => {
    if (azureApiVersionInputRef.current) {
      azureApiVersionInputRef.current.value = settings.azureApiVersion;
    }
  }, [settings.azureApiVersion]);

  const handleToolChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedTool(
        LLM_TEMPLATES.find((tool) => tool.name === event.target.value) ??
        LLM_TEMPLATES[LLM_TEMPLATES.length - 1]
      );
    },
    []
  );

  useEffect(() => {
    // On mount, set the API URL input to the current API URL
    if (apiUrlInputRef.current) {
      apiUrlInputRef.current.value = settings.gpt3.apiBaseUrl;
    }
    // On mount, set the Azure API version input to the current Azure API version
    if (azureApiVersionInputRef.current) {
      azureApiVersionInputRef.current.value = settings.azureApiVersion;
    }
  }, []);

  useEffect(() => {
    if (selectedTool?.name === "OpenRouter AI" && apiKeyStatus === ApiKeyStatus.Valid) {
      backendMessenger.sendGetModels();
    }
  }, [selectedTool?.name, apiKeyStatus]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === "models") {
        setModels(message.models);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className="api-settings-view overflow-y-auto bg-background text-foreground">
      {/* Inject custom animation styles */}
      <style dangerouslySetInnerHTML={{ __html: splashAnimations }} />

      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-full">
              <Icon name={IconName.Box} className="w-8 h-8 text-neutral-700 dark:text-neutral-300" aria-hidden="true" />
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-medium text-center mb-1">Model Connection</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-center text-sm mb-2">
          Connect to OpenAI, Azure, or local LLMs
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-8">
        {/* Provider Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">
              Select Model Provider
            </label>
          </div>
          <div className="relative">
            <select
              value={selectedTool.name}
              onChange={handleToolChange}
              className="block w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md bg-background text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {LLM_TEMPLATES.map((tool, index) => (
                <option
                  key={`tool-${index}`}
                  value={tool.name}
                >
                  {tool.name} {tool.tested ? "✓" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Provider Instructions */}
        {selectedTool && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium">Setup Instructions</h2>
            <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md p-4 text-sm">
              {selectedTool.instructions
                .split(/(```bash\n[\s\S]*?\n```)/)
                .reduce((acc: any[], item: any) => {
                  if (item) {
                    acc.push(item);
                  }
                  return acc;
                }, [])
                .map((item: string, index: React.Key | null | undefined) => {
                  if (item.startsWith("```bash")) {
                    item = item.replace(/```bash\n/g, "").replace(/\n```/g, "");
                    return (
                      <div className="my-2 rounded-md overflow-hidden border border-neutral-300 dark:border-neutral-700">
                        <CodeBlock
                          margins={false}
                          className="w-full"
                          code={item}
                          key={`code-${index}`}
                          vscode={vscode}
                        />
                      </div>
                    );
                  } else {
                    return item
                      .split("\n")
                      .map((paragraph, i) => (
                        <p key={i} className="mb-2 text-neutral-700 dark:text-neutral-300">{paragraph}</p>
                      ));
                  }
                })}
              {selectedTool.docsUrl && (
                <a
                  href={selectedTool.docsUrl.href}
                  target="_blank"
                  className="inline-flex items-center mt-2 text-xs text-primary hover:underline"
                >
                  <Icon name={IconName.Help} className="w-3 h-3 mr-1" />
                  View Documentation
                </a>
              )}
            </div>
          </div>
        )}

        {/* API URL Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="apiUrl" className="block text-sm font-medium">
              API URL
            </label>
          </div>
          <div className="relative">
            <input
              id="apiUrl"
              ref={apiUrlInputRef}
              type="text"
              onChange={(e) => debouncedSetApiUrl(e.target.value)}
              className="block w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md bg-background text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={selectedTool?.apiUrl?.href ?? "https://..."}
            />
            {showUrlSaved && (
              <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center text-success text-xs">
                <Icon name={IconName.Check} className="w-3 h-3 mr-1" />
                Saved
              </div>
            )}
          </div>
          {selectedTool && selectedTool.apiUrl && (
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none"
              onClick={() => {
                backendMessenger.sendChangeApiUrl(
                  selectedTool.apiUrl?.href ?? ""
                );

                if (apiUrlInputRef.current) {
                  apiUrlInputRef.current.value =
                    selectedTool.apiUrl?.href ?? "";
                }

                setShowUrlSaved(true);
                setTimeout(() => {
                  setShowUrlSaved(false);
                }, 2000);
              }}
            >
              <Icon name={IconName.Check} className="w-3 h-3 mr-1.5" />
              Use suggested URL
            </button>
          )}
        </div>

        {/* API Key Section */}
        {selectedTool?.showApiKeyInput && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="apiKey" className="block text-sm font-medium">
                API Key
                {selectedTool?.apiUrl && (
                  <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                    for {new URL(settings.gpt3.apiBaseUrl).hostname}
                  </span>
                )}
              </label>
            </div>
            <div className="relative">
              <input
                type="password"
                id="apiKey"
                onChange={(event) => debouncedSetApiKey(event.target.value)}
                onPaste={(event) =>
                  handleApiKeyUpdate(
                    event.clipboardData.getData("text/plain")
                  )
                }
                placeholder={API_KEY_PLACEHOLDER}
                className="block w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md bg-background text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={apiKeyStatus === ApiKeyStatus.Pending}
              />
              {apiKeyStatus === ApiKeyStatus.Pending && (
                <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center text-warning text-xs animate-pulse">
                  Testing...
                </div>
              )}
              {apiKeyStatus === ApiKeyStatus.Authenticating && (
                <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center text-warning text-xs animate-pulse">
                  Authenticating...
                </div>
              )}
              {apiKeyStatus === ApiKeyStatus.Valid && (
                <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center text-success text-xs">
                  <Icon name={IconName.Check} className="w-3 h-3 mr-1" />
                  Valid
                </div>
              )}
              {apiKeyStatus === ApiKeyStatus.Invalid && (
                <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center text-danger text-xs">
                  <Icon name={IconName.AlertTriangle} className="w-3 h-3 mr-1" />
                  Invalid
                </div>
              )}
              {apiKeyStatus === ApiKeyStatus.Error && (
                <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center text-danger text-xs">
                  <Icon name={IconName.AlertTriangle} className="w-3 h-3 mr-1" />
                  Error
                </div>
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {API_STRINGS.API_KEY_STATUS.API_KEY_NOTE}
            </p>

            <div className="flex space-x-2">
              {apiKeyStatus === ApiKeyStatus.Valid && (
                <button
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none"
                  onClick={() => {
                    dispatch(setApiKeyStatus(ApiKeyStatus.Unset));
                    debouncedSetApiKey("");
                  }}
                >
                  <Icon name={IconName.Close} className="w-3 h-3 mr-1.5" />
                  Remove
                </button>
              )}
              {selectedTool.name === "OpenRouter AI" && (
                <button
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none"
                  onClick={() => {
                    // If the current api base url is not OpenRouter, then set it to OpenRouter
                    if (
                      settings.gpt3.apiBaseUrl !==
                      "https://openrouter.ai/api/v1"
                    ) {
                      backendMessenger.sendChangeApiUrl(
                        "https://openrouter.ai/api/v1"
                      );
                    }

                    dispatch(setApiKeyStatus(ApiKeyStatus.Authenticating));

                    // hacky - wait for 500ms to ensure the API URL is set before generating the API key
                    setTimeout(() => {
                      backendMessenger.sendGenerateOpenRouterApiKey();
                    }, 500);
                  }}
                >
                  <Icon name={IconName.Refresh} className="w-3 h-3 mr-1.5" />
                  {apiKeyStatus === ApiKeyStatus.Valid
                    ? "Regenerate"
                    : "Generate New"}
                </button>
              )}
            </div>

            {/* API key: error message */}
            {apiKeyStatus === ApiKeyStatus.Invalid &&
              !!apiUrlInputRef.current?.value.length && (
                <div className="mt-2 p-3 text-sm bg-danger/10 text-danger rounded-md">
                  <h3 className="font-medium mb-1">
                    {API_STRINGS.API_KEY_STATUS.INVALID_API_KEY_TITLE}
                  </h3>
                  <p>
                    {API_STRINGS.API_KEY_STATUS.INVALID_API_KEY_DESCRIPTION}
                    <a href="https://status.openai.com/" target="_blank" className="text-primary hover:underline">
                      https://status.openai.com/
                    </a>
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Azure API Version Input */}
        {selectedTool?.showAzureApiVersionInput && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="azureApiVersion" className="block text-sm font-medium">
                Azure API Version
              </label>
            </div>
            <div className="relative">
              <input
                id="azureApiVersion"
                ref={azureApiVersionInputRef}
                type="text"
                onChange={(e) => {
                  backendMessenger.sendSetAzureApiVersion(e.target.value);
                  setShowVersionSaved(true);
                  setTimeout(() => setShowVersionSaved(false), 2000);
                }}
                className="block w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md bg-background text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="API Version (e.g. 2024-02-01)"
              />
              {showVersionSaved && (
                <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center text-success text-xs">
                  <Icon name={IconName.Check} className="w-3 h-3 mr-1" />
                  Saved
                </div>
              )}
            </div>
          </div>
        )}

        {/* Model Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Model Options</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  type="checkbox"
                  id="showAllModels"
                  checked={settings.showAllModels}
                  onChange={(e) => {
                    dispatch(
                      setExtensionSettings({
                        newSettings: {
                          ...settings,
                          showAllModels: e.target.checked,
                        },
                      })
                    );

                    backendMessenger.sendSetShowAllModels(e.target.checked);
                  }}
                  className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700 text-primary focus:ring-primary"
                />
              </div>
              <div className="ml-2">
                <label htmlFor="showAllModels" className="text-sm font-medium cursor-pointer">
                  {API_STRINGS.SHOW_ALL_MODELS}
                </label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Show all available models, not just OpenAI models.
                </p>
              </div>
            </div>

            {selectedTool?.manualModelInput && (
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    type="checkbox"
                    id="manualModelInput"
                    checked={settings.manualModelInput}
                    onChange={(e) => {
                      dispatch(
                        setExtensionSettings({
                          newSettings: {
                            ...settings,
                            manualModelInput: e.target.checked,
                          },
                        })
                      );

                      backendMessenger.sendSetManualModelInput(e.target.checked);
                    }}
                    className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700 text-primary focus:ring-primary"
                  />
                </div>
                <div className="ml-2">
                  <label htmlFor="manualModelInput" className="text-sm font-medium cursor-pointer">
                    {API_STRINGS.MANUAL_MODEL_INPUT}
                  </label>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Manually input model names instead of selecting from a list.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Model Selection */}
        {selectedTool?.showModelSelection && models.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="modelSelection" className="block text-sm font-medium">
                Select Model
              </label>
            </div>
            <select
              id="modelSelection"
              className="block w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md bg-background text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={settings.gpt3.model}
              onChange={(e) => {
                dispatch(setExtensionSettings({
                  newSettings: {
                    ...settings,
                    gpt3: {
                      ...settings.gpt3,
                      model: e.target.value
                    }
                  }
                }));
              }}
            >
              <option value="">Select a model...</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {selectedTool.name === "OpenRouter AI"
                ? API_STRINGS.MODEL_SELECTION.OPENROUTER_DESCRIPTION
                : API_STRINGS.MODEL_SELECTION.DESCRIPTION}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
