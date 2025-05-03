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
    <div className="api-settings-view overflow-y-auto bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900/30">
      {/* Inject custom animation styles */}
      <style dangerouslySetInnerHTML={{ __html: splashAnimations }} />

      <div className="text-center py-12 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-indigo-900/40 border-b border-gray-200 dark:border-gray-700 mb-6 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow animation-delay-1000"></div>
          <div className="absolute bottom-32 left-1/4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
        </div>

        {/* Icon with enhanced glow effect */}
        <div className="relative mx-auto mb-8 w-28 h-28">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-500 opacity-75 blur-lg animate-spin-slow"></div>
          <div className="relative rounded-full p-6 bg-white dark:bg-gray-800 flex items-center justify-center shadow-xl">
            <Icon name={IconName.Box} className="w-14 h-14 text-blue-500 dark:text-blue-400" aria-hidden="true" />
          </div>
        </div>

        {/* Main heading with enhanced gradient */}
        <h1 className="text-4xl font-extrabold mb-4 text-gray-800 dark:text-gray-100 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 inline-block text-transparent bg-clip-text px-4">
          AI Model Connection Hub
        </h1>

        {/* Subtitle with badge */}
        <div className="flex justify-center items-center gap-3 mb-4">
          <span className="px-3 py-1 text-sm rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-medium">
            OpenAI
          </span>
          <span className="px-3 py-1 text-sm rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 font-medium">
            OpenRouter
          </span>
          <span className="px-3 py-1 text-sm rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 font-medium">
            Local LLMs
          </span>
          <span className="px-3 py-1 text-sm rounded-full bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 font-medium">
            Azure AI
          </span>
        </div>

        {/* Enhanced description */}
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4 mb-6 text-lg">
          Connect to your favorite AI models and customize your experience with just a few clicks
        </p>

        {/* Features list */}
        <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto px-4">
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <Icon name={IconName.Check} className="w-5 h-5 mr-2 text-green-500" />
            Multiple model providers
          </div>
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <Icon name={IconName.Check} className="w-5 h-5 mr-2 text-green-500" />
            Secure API key storage
          </div>
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <Icon name={IconName.Check} className="w-5 h-5 mr-2 text-green-500" />
            Custom model selection
          </div>
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <Icon name={IconName.Check} className="w-5 h-5 mr-2 text-green-500" />
            Local LLM support
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="mb-6 bg-white dark:bg-gray-800/40 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 flex items-center">
            <Icon name={IconName.Settings} className="w-5 h-5 mr-3 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              Connect to
              <span className="ml-2 text-blue-500 dark:text-blue-400 font-bold">
                {selectedTool ? selectedTool.name : "your local LLM"}
              </span>
              {selectedTool && selectedTool.tested && (
                <span className="ml-3 inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                  <Icon name={IconName.Check} className="w-3.5 h-3.5 mr-1" /> Tested
                </span>
              )}
            </h2>
          </div>

          {(!selectedTool || (selectedTool && !selectedTool.tested)) && (
            <div className="px-6 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-900/50">
              <p className="flex items-start text-yellow-800 dark:text-yellow-300 text-sm">
                <Icon name={IconName.AlertTriangle} className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> The local LLM tool must be compatible with
                  OpenAI's API. At the moment, this extension <strong>only</strong>{" "}
                  supports OpenAI's API format.
                </span>
              </p>
            </div>
          )}

          <section className="p-4 rounded border border-input">
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-md font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center">
                  <Icon name={IconName.Box} className="w-5 h-5 mr-2 text-blue-500" />
                  Select an LLM provider:
                </label>
                <div className="relative">
                  <select
                    value={selectedTool.name}
                    onChange={handleToolChange}
                    className="block w-full p-3 pl-4 pr-10 text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option
                      value=""
                      disabled
                      className="bg-gray-100 dark:bg-gray-700 font-medium"
                    >
                      Select a tool...
                    </option>
                    {LLM_TEMPLATES.map((tool, index) => (
                      <option
                        key={`tool-${index}`}
                        value={tool.name}
                        className="py-2"
                      >
                        {tool.name} {tool.tested ? "✓" : ""}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                    <Icon name={IconName.ChevronDown} className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {selectedTool && (
                <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
                    <Icon name={IconName.Help} className="w-5 h-5 mr-2 text-blue-500" />
                    Instructions
                  </h2>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
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
                          // remove the ```bash and ``` from the string
                          item = item.replace(/```bash\n/g, "").replace(/\n```/g, "");
                          return (
                            <div className="my-3 rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
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
                              <p key={i} className="mb-2 text-gray-700 dark:text-gray-300">{paragraph}</p>
                            ));
                        }
                      })}
                  </div>
                  {selectedTool.docsUrl && (
                    <a
                      href={selectedTool.docsUrl.href}
                      target="_blank"
                      className="inline-flex items-center mt-4 px-4 py-2 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors duration-200"
                    >
                      <Icon name={IconName.Help} className="w-4 h-4 mr-2" />
                      View Documentation
                    </a>
                  )}
                </div>
              )}
            </div>
          </section>

          <section>
            {selectedTool && selectedTool.apiUrl && (
              <div className="mt-5 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="font-medium text-blue-800 dark:text-blue-300 flex items-center mb-2">
                  <Icon name={IconName.Box} className="w-4 h-4 mr-2" />
                  Suggested API URL
                </h3>
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex-grow">
                    <CodeBlock
                      margins={false}
                      className="rounded border border-blue-200 dark:border-blue-800"
                      code={selectedTool.apiUrl.href}
                      vscode={vscode}
                    />
                  </div>
                  <button
                    type="button"
                    className="flex-shrink-0 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200"
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
                    <Icon name={IconName.Check} className="w-4 h-4 mr-2" />
                    Use this API URL
                  </button>
                </div>
              </div>
            )}

            {selectedTool?.azureApiVersion && (
              <div className="mt-5 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <h3 className="font-medium text-purple-800 dark:text-purple-300 flex items-center mb-2">
                  <Icon name={IconName.Settings} className="w-4 h-4 mr-2" />
                  Suggested Azure API Version
                </h3>
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex-grow">
                    <CodeBlock
                      margins={false}
                      className="rounded border border-purple-200 dark:border-purple-800"
                      code={selectedTool.azureApiVersion}
                      vscode={vscode}
                    />
                  </div>
                  <button
                    type="button"
                    className="flex-shrink-0 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-sm transition-all duration-200"
                    onClick={() => {
                      backendMessenger.sendSetAzureApiVersion(
                        selectedTool.azureApiVersion ?? ""
                      );

                      if (azureApiVersionInputRef.current) {
                        azureApiVersionInputRef.current.value =
                          selectedTool.azureApiVersion ?? "";
                      }

                      setShowVersionSaved(true);

                      setTimeout(() => {
                        setShowVersionSaved(false);
                      }, 2000);
                    }}
                  >
                    <Icon name={IconName.Check} className="w-4 h-4 mr-2" />
                    Use this Version
                  </button>
                </div>
              </div>
            )}
          </section>

          <section>
            {/* API key: user input */}
            {selectedTool?.showApiKeyInput && (
              <>
                <div>
                  <label
                    htmlFor="apiKey"
                    className="block text-md font-medium my-2"
                  >
                    <span className="underline">Current</span> API key{" "}
                    {selectedTool?.apiUrl && (
                      <span className="text-xs">
                        for {new URL(settings.gpt3.apiBaseUrl).hostname}
                      </span>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <div className="flex-grow relative">
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
                        className="w-full px-3 py-2 rounded-sm border text-input text-sm border-input bg-input outline-0"
                        disabled={apiKeyStatus === ApiKeyStatus.Pending}
                      />
                      {apiKeyStatus === ApiKeyStatus.Pending && (
                        <span className="absolute top-2 right-2 transform px-2 py-0.5 text-yellow-500 border border-yellow-500 rounded bg-menu">
                          Testing...
                        </span>
                      )}
                      {apiKeyStatus === ApiKeyStatus.Authenticating && (
                        <span className="absolute top-2 right-2 transform px-2 py-0.5 text-yellow-500 border border-yellow-500 rounded bg-menu">
                          Authenticating...
                        </span>
                      )}
                      {apiKeyStatus === ApiKeyStatus.Valid && (
                        <span className="absolute top-2 right-2 transform px-2 py-0.5 text-green-500 border border-green-500 rounded bg-menu">
                          Valid
                        </span>
                      )}
                      {apiKeyStatus === ApiKeyStatus.Invalid && (
                        <span className="absolute top-2 right-2 transform px-2 py-0.5 text-red-500 border border-red-500 rounded bg-menu">
                          Invalid
                        </span>
                      )}
                      {apiKeyStatus === ApiKeyStatus.Error && (
                        <span className="absolute top-2 right-2 transform px-2 py-0.5 text-red-500 border border-red-500 rounded bg-menu">
                          Error
                        </span>
                      )}
                      {apiKeyStatus === ApiKeyStatus.Unknown && (
                        <span className="absolute top-2 right-2 transform px-2 py-0.5 text-gray-500 border border-gray-500 rounded bg-menu">
                          Unknown
                        </span>
                      )}
                      {apiKeyStatus === ApiKeyStatus.Unset && (
                        <span className="absolute top-2 right-2 transform px-2 py-0.5 text-gray-500 border border-gray-500 rounded bg-menu">
                          Unset
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {apiKeyStatus === ApiKeyStatus.Valid && (
                        <button
                          className="px-3 py-2 text-sm rounded bg-button-secondary text-button-secondary hover:bg-button-secondary-hover hover:text-button-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2"
                          onClick={() => {
                            dispatch(setApiKeyStatus(ApiKeyStatus.Unset));

                            debouncedSetApiKey("");
                          }}
                        >
                          Remove
                        </button>
                      )}
                      {selectedTool.name === "OpenRouter AI" && (
                        <button
                          className="px-3 py-2 text-sm rounded bg-button text-button-secondary hover:bg-button-hover hover:text-button focus:outline-none focus:ring-2 focus:ring-offset-2"
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
                          {apiKeyStatus === ApiKeyStatus.Valid
                            ? "Regenerate"
                            : "Generate New"}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs mt-2">
                    {API_STRINGS.API_KEY_STATUS.API_KEY_NOTE}
                  </p>
                </div>
                {/* API key: error message */}
                {apiKeyStatus === ApiKeyStatus.Invalid &&
                  !!apiUrlInputRef.current?.value.length && (
                    <div className="flex flex-col gap-2 p-4 bg-red-500 text bg-opacity-10 rounded">
                      <h2 className="font-medium">
                        {API_STRINGS.API_KEY_STATUS.INVALID_API_KEY_TITLE}
                      </h2>
                      <p>
                        {API_STRINGS.API_KEY_STATUS.INVALID_API_KEY_DESCRIPTION}
                        <a href="https://status.openai.com/" target="_blank">
                          https://status.openai.com/
                        </a>
                      </p>
                    </div>
                  )}
              </>
            )}
            {/* Show all models */}
            <div className="flex flex-col gap-2 mt-3">
              <div className="flex items-center gap-2">
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
                  className="rounded cursor-pointer bg-input border-input"
                />
                <label htmlFor="showAllModels" className="text-sm cursor-pointer">
                  {API_STRINGS.SHOW_ALL_MODELS}
                </label>
              </div>
              <p>
                {API_STRINGS.SHOW_ALL_MODELS_DESCRIPTION}
              </p>
            </div>
            {/* Manual model input checkbox */}
            {selectedTool?.manualModelInput && (
              <div className="flex flex-col gap-2 mt-3">
                <div className="flex items-center gap-2">
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
                    className="rounded cursor-pointer bg-input border-input"
                  />
                  <label
                    htmlFor="manualModelInput"
                    className="text-sm cursor-pointer"
                  >
                    {API_STRINGS.MANUAL_MODEL_INPUT}
                  </label>
                </div>
                <p>
                  {API_STRINGS.MANUAL_MODEL_INPUT_HINT}
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800/40 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                <Icon name={IconName.Settings} className="w-5 h-5 mr-3 text-blue-500" />
                API Configuration
              </h2>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label htmlFor="apiUrl" className="block text-md font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center">
                  <Icon name={IconName.Box} className="w-4 h-4 mr-2 text-blue-500" />
                  <span className="underline">Current</span> API URL:
                </label>
                <div className="relative">
                  <input
                    id="apiUrl"
                    ref={apiUrlInputRef}
                    type="text"
                    onChange={(e) => debouncedSetApiUrl(e.target.value)}
                    className="block w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder={selectedTool?.apiUrl?.href ?? "https://..."}
                  />
                  {showUrlSaved && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                      <Icon name={IconName.Check} className="w-3 h-3 mr-1" />
                      Saved
                    </div>
                  )}
                </div>
              </div>

              {selectedTool && selectedTool.showAllModelSuggestion && (
                <div className="mt-5 flex items-start bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                  <Icon name={IconName.Lightbulb} className="w-5 h-5 text-indigo-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-indigo-700 dark:text-indigo-300 text-sm">
                    With this API it is <strong>recommended</strong> to check the "Show
                    all models" checkbox below to see all models.
                  </p>
                </div>
              )}

              {selectedTool &&
                !selectedTool.showAllModelSuggestion &&
                !selectedTool.showAzureApiVersionInput && (
                  <div className="mt-5 flex items-start bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                    <Icon name={IconName.Lightbulb} className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-amber-700 dark:text-amber-300 text-sm">
                      It is recommended you do <strong>not</strong> check the "Show all
                      models" checkbox below or a lot of unnecessary models will be
                      shown.
                    </p>
                  </div>
                )}

              {selectedTool &&
                selectedTool.manualModelInput &&
                selectedTool.name !== "Other" && (
                  <div className="mt-5 flex items-start bg-rose-50 dark:bg-rose-900/20 rounded-lg p-4 border border-rose-200 dark:border-rose-800">
                    <Icon name={IconName.Lightbulb} className="w-5 h-5 text-rose-500 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-rose-700 dark:text-rose-300 text-sm">
                      This tool requires <strong>manual model input</strong>. It does
                      not support fetching models from the /models endpoint.
                    </p>
                  </div>
                )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/40 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                <Icon name={IconName.Settings} className="w-5 h-5 mr-3 text-blue-500" />
                API Authentication
              </h2>
            </div>

            <div className="p-6">
              {/* API key: user input */}
              {selectedTool?.showApiKeyInput && (
                <div>
                  <div className="mb-6">
                    <label
                      htmlFor="apiKey"
                      className="block text-md font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center"
                    >
                      <Icon name={IconName.Settings} className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="underline">Current</span> API key
                      {selectedTool?.apiUrl && (
                        <span className="ml-2 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300">
                          {new URL(settings.gpt3.apiBaseUrl).hostname}
                        </span>
                      )}
                    </label>
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
                        className="block w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        disabled={apiKeyStatus === ApiKeyStatus.Pending}
                      />
                      {apiKeyStatus === ApiKeyStatus.Pending && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium animate-pulse">
                          Testing...
                        </div>
                      )}
                      {apiKeyStatus === ApiKeyStatus.Authenticating && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium animate-pulse">
                          Authenticating...
                        </div>
                      )}
                      {apiKeyStatus === ApiKeyStatus.Valid && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                          <Icon name={IconName.Check} className="w-3 h-3 mr-1" />
                          Valid
                        </div>
                      )}
                      {apiKeyStatus === ApiKeyStatus.Invalid && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                          <Icon name={IconName.AlertTriangle} className="w-3 h-3 mr-1" />
                          Invalid
                        </div>
                      )}
                      {apiKeyStatus === ApiKeyStatus.Error && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                          <Icon name={IconName.AlertTriangle} className="w-3 h-3 mr-1" />
                          Error
                        </div>
                      )}
                      {apiKeyStatus === ApiKeyStatus.Unknown && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                          Unknown
                        </div>
                      )}
                      {apiKeyStatus === ApiKeyStatus.Unset && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                          Unset
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800/40 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              <Icon name={IconName.Settings} className="w-5 h-5 mr-3 text-blue-500" />
              Model Configuration
            </h2>
          </div>

          <div className="p-6">
            {/* Show all models */}
            <div className="mb-6 bg-gray-50 dark:bg-gray-800/30 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
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
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="showAllModels" className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    {API_STRINGS.SHOW_ALL_MODELS}
                  </label>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {API_STRINGS.SHOW_ALL_MODELS_DESCRIPTION}
                  </p>
                </div>
              </div>
            </div>

            {/* Manual model input checkbox */}
            {selectedTool?.manualModelInput && (
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
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
                      className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="manualModelInput" className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      {API_STRINGS.MANUAL_MODEL_INPUT}
                    </label>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      {API_STRINGS.MANUAL_MODEL_INPUT_HINT}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedTool?.showModelSelection && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-800/30 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start">
              <div className="flex-1">
                <label
                  htmlFor="modelSelection"
                  className="block text-md font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center"
                >
                  <Icon name={IconName.Settings} className="w-4 h-4 mr-2 text-blue-500" />
                  {API_STRINGS.MODEL_SELECTION.TITLE}
                </label>
                <select
                  id="modelSelection"
                  className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 text-input text-sm bg-white dark:bg-gray-800 outline-0 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
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
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {selectedTool.name === "OpenRouter AI"
                    ? API_STRINGS.MODEL_SELECTION.OPENROUTER_DESCRIPTION
                    : API_STRINGS.MODEL_SELECTION.DESCRIPTION}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
