/// <reference lib="dom" />

import { AzureOpenAIProvider, AzureOpenAIProviderSettings, createAzure } from '@ai-sdk/azure';
import { OpenAIProvider, OpenAIProviderSettings, createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { Tiktoken, TiktokenModel, encodingForModel } from "js-tiktoken";
import ky from "ky";
import { z } from 'zod';
import { isReasoningModel } from "./helpers";
import { getModelCompletionLimit, getModelContextLimit } from "./renderer/helpers";
import { ChatMessage, Conversation, Model, Role } from "./renderer/types";

/**
 * OpenAI API Provider
 * 
 * This module handles communication with OpenAI's API and compatible services
 * including Azure OpenAI and Ollama. It manages API configuration, token counting,
 * and handles both streaming and non-streaming completions.
 */

// Default model to use when none is specified
const FALLBACK_MODEL_ID = 'gpt-4-turbo';

// Default context window size if model info is unavailable
const DEFAULT_CONTEXT_WINDOW = 4096;

// Validation schemas for API settings
const azureSettingsSchema = z.object({
  apiKey: z.string().default(''),
  resourceName: z.string().default(''),
}).strict();

const openaiSettingsSchema = z.object({
  apiKey: z.string().default(''),
  baseURL: z.string().default('https://api.openai.com/v1'),
  organization: z.string().optional(),
  project: z.string().optional(),
  headers: z.record(z.string()).optional(),
  compatibility: z.enum(['strict', 'compatible']).default('compatible'),
  fetch: z.function().optional(),
});

// Common error messages
const ERROR_MESSAGES = {
  API_NOT_INITIALIZED: '[M31 Mini] OpenAI API not initialized',
  MISSING_API_KEY: 'Missing API key',
  MODEL_ENDPOINT_NOT_FOUND: 'Model endpoint not found',
  AZURE_NO_DEPLOYMENT_ID: '[M31 Mini] Attempting to set up Azure OpenAI API without a deployment ID. This will likely fail.',
  AZURE_DEPLOYMENT_NOT_FOUND: '[M31 Mini] Azure OpenAI API deployment ID not found in URL:',
  AZURE_NO_ORG_ID: '[M31 Mini] Organization updated, ignored. Azure API does not use an organization ID',
  OLLAMA_SUCCESS: '[M31 Mini] Successfully fetched models from Ollama API',
  OLLAMA_FAILURE: '[M31 Mini] Failed to fetch models from Ollama API',
  OPENAI_FAILURE: '[M31 Mini] Failed to fetch models from OpenAI API'
};

export class ApiProvider {
  private _openai: OpenAIProvider | AzureOpenAIProvider | undefined;
  private _temperature: number;
  private _topP: number;
  private _modelList: Model[] = [];
  private pendingModelFetch: Promise<void> | undefined = undefined;

  public config: OpenAIProviderSettings | AzureOpenAIProviderSettings = {};
  public isAzure = false;
  public deploymentName: string | undefined;

  /**
   * Creates a new API provider instance
   * 
   * @param apiKey - The API key for authentication
   * @param options - Configuration options including organization, API URL, and generation parameters
   */
  constructor(
    apiKey: string,
    {
      organization,
      apiBaseUrl = 'https://api.openai.com/v1',
      temperature = 0.9,
      topP = 1,
    }: {
      organization?: string;
      apiBaseUrl?: string;
      temperature?: number;
      topP?: number;
    } = {}
  ) {
    this._temperature = temperature;
    this._topP = topP;

    // Clean up the API URL and determine if it's Azure
    const cleanBaseUrl = apiBaseUrl.replace(/\/$/, '');

    if (this.checkIfAzure(cleanBaseUrl)) {
      this.updateAzureConfig({ apiKey }, cleanBaseUrl);
    } else {
      this.updateConfig({
        apiKey,
        organization,
        baseURL: cleanBaseUrl,
      } as OpenAIProviderSettings);
    }
  }

  /**
   * Calculates remaining tokens available for model completion
   * 
   * @param model - The AI model being used
   * @param promptTokensUsed - Number of tokens already used in the prompt
   * @returns Number of tokens available for completion
   */
  getRemainingTokens(model: Model | undefined, promptTokensUsed: number): number {
    const modelContext = getModelContextLimit(model) || DEFAULT_CONTEXT_WINDOW;
    const modelMax = getModelCompletionLimit(model);

    // Calculate available tokens based on model constraints
    const tokensLeft = modelMax !== undefined
      ? Math.min(modelContext - promptTokensUsed, modelMax) // For models with max token limit
      : modelContext - promptTokensUsed;                    // For models without a limit

    if (tokensLeft < 0) {
      throw new Error(
        `This conversation uses ${promptTokensUsed} tokens, but ${model?.name || model?.id} only supports ${modelContext} context tokens. ` +
        `Please reduce code, clear the conversation, or use a model with a larger context window.`
      );
    }

    return tokensLeft;
  }

  /**
   * Streams chat completions from the API
   * 
   * @param conversation - The conversation history and model
   * @param abortSignal - Signal to abort the request
   * @param options - Generation parameters
   * @returns An async generator yielding text chunks
   */
  async* streamChatCompletion(
    conversation: Conversation,
    abortSignal: AbortSignal,
    { temperature = this._temperature, topP = this._topP } = {}
  ): AsyncGenerator<string, void, unknown> {
    if (!this._openai) {
      console.error(ERROR_MESSAGES.API_NOT_INITIALIZED);
      return;
    }

    const promptTokensUsed = ApiProvider.countConversationTokens(conversation);
    const completeTokensLeft = this.getRemainingTokens(conversation.model, promptTokensUsed);
    const model = this.getModelIdentifier(conversation.model?.id);

    try {
      const { textStream } = await streamText({
        model: this._openai.languageModel(model),
        messages: this.prepareMessages(conversation),
        maxTokens: isReasoningModel(model) ? undefined : completeTokensLeft,
        temperature,
        topP,
        abortSignal,
      });

      for await (const textPart of textStream) {
        if (abortSignal.aborted) { return; }
        yield textPart;
      }
    } catch (error) {
      console.error(`Error streaming completion: ${error}`);
      throw error;
    }
  }

  /**
   * Gets a complete chat response (non-streaming)
   * 
   * @param conversation - The conversation history and model
   * @param options - Generation parameters
   * @returns The completed text response
   */
  async getChatCompletion(
    conversation: Conversation,
    { temperature = this._temperature, topP = this._topP } = {}
  ): Promise<string | undefined> {
    if (!this._openai) {
      console.error(ERROR_MESSAGES.API_NOT_INITIALIZED);
      return;
    }

    const promptTokensUsed = ApiProvider.countConversationTokens(conversation);
    const completeTokensLeft = this.getRemainingTokens(conversation.model, promptTokensUsed);
    const model = this.getModelIdentifier(conversation.model?.id);

    try {
      const { text } = await generateText({
        model: this._openai.languageModel(model),
        messages: this.prepareMessages(conversation),
        maxTokens: isReasoningModel(model) ? undefined : completeTokensLeft,
        temperature,
        topP,
      });

      return text;
    } catch (error) {
      console.error(`Error getting completion: ${error}`);
      throw error;
    }
  }

  /**
   * Gets a quick completion for inline suggestions
   * Optimized for speed and minimal context
   * 
   * @param codeContext - The code context to complete
   * @param language - The programming language
   * @param options - Generation parameters
   * @returns The code completion suggestion
   */
  async getQuickCompletion(
    codeContext: string,
    language: string,
    { temperature = 0.2, topP = 0.95, maxTokens = 100 } = {}
  ): Promise<string> {
    if (!this._openai) {
      console.error(ERROR_MESSAGES.API_NOT_INITIALIZED);
      return '';
    }

    // Use a smaller model for speed if available
    const modelToUse = 'gpt-3.5-turbo'; // Or a more appropriate model for code completion

    try {
      // Create a minimal conversation with system and user messages
      const conversation: Conversation = {
        id: 'inline-completion',
        createdAt: Date.now(),
        inProgress: false,
        autoscroll: false,
        messages: [
          {
            id: 'system-message',
            role: Role.system,
            content: `You are an AI coding assistant. Complete the code snippet in ${language}. 
                      Provide only the code completion without explanations or comments.`,
            rawContent: `You are an AI coding assistant. Complete the code snippet in ${language}. 
                      Provide only the code completion without explanations or comments.`,
            createdAt: Date.now(),
          },
          {
            id: 'user-message',
            role: Role.user,
            content: codeContext,
            rawContent: codeContext,
            createdAt: Date.now(),
          }
        ],
        model: {
          id: modelToUse,
          object: 'model',
          created: 0,
          owned_by: Role.system
        },
        tools: {},
      };

      // Make API call with minimal parameters for speed
      const { text } = await generateText({
        model: this._openai.languageModel(modelToUse),
        messages: this.prepareMessages(conversation),
        maxTokens,
        temperature,
        topP,
      });

      return text.trim();
    } catch (error) {
      console.error('[M31 Mini] Error in quick completion:', error);
      return '';
    }
  }

  /**
   * Prepares messages for API request
   * 
   * @param conversation - The conversation to prepare messages from
   * @returns Array of formatted messages
   */
  private prepareMessages(conversation: Conversation) {
    return conversation.messages.map(message => ({
      role: message.role,
      content: message.content,
    }));
  }

  /**
   * Gets the correct model identifier based on provider
   * 
   * @param modelId - The model ID from the conversation
   * @returns The correctly formatted model identifier
   */
  private getModelIdentifier(modelId?: string): string {
    const model = modelId ?? FALLBACK_MODEL_ID;

    // For Azure, extract deployment name from the model ID if needed
    if (this.isAzure && model.includes('/deployments/')) {
      return model.split('/deployments/').pop() ?? model;
    }

    return model;
  }

  // Token counting utilities

  /**
   * Gets the appropriate token encoder for a model
   */
  public static getEncodingForModel(modelId: string): Tiktoken {
    try {
      return encodingForModel(modelId as TiktokenModel);
    } catch (e) {
      // Fallback to default model if the specified one isn't supported
      return encodingForModel(FALLBACK_MODEL_ID as TiktokenModel);
    }
  }

  /**
   * Counts tokens in an entire conversation
   */
  public static countConversationTokens(conversation: Conversation): number {
    const enc = this.getEncodingForModel(conversation.model?.id ?? FALLBACK_MODEL_ID);
    let tokensUsed = 0;

    // Count tokens for each message
    for (const message of conversation.messages) {
      tokensUsed += ApiProvider.countMessageTokens(message, conversation.model, enc);
    }

    // Add overhead for assistant prompt
    tokensUsed += 3; // <im_start>assistant

    return tokensUsed;
  }

  /**
   * Counts tokens in a single message
   */
  public static countMessageTokens(message: ChatMessage, model: Model | undefined, encoder?: Tiktoken): number {
    const enc = encoder ?? this.getEncodingForModel(model?.id ?? FALLBACK_MODEL_ID);

    // Base token count for message format
    let tokensUsed = 4; // <im_start>{role/name}\n{content}<im_end>\n

    const openAIMessage = {
      role: message.role ?? Role.user,
      content: message.content ?? '',
    };

    // Count tokens for each message component
    for (const [key, value] of Object.entries(openAIMessage)) {
      const tokens = enc.encode(value);
      tokensUsed += tokens ? tokens.length : 0;

      // Adjust for name field if present
      if (key === "name") {
        tokensUsed -= 1; // role is always 1 token but omitted when name is used
      }
    }

    return tokensUsed;
  }

  /**
   * Calculates remaining tokens for a prompt
   */
  public static getRemainingPromptTokens(maxTokens: number, prompt: string, modelId: string): number {
    return maxTokens - ApiProvider.countPromptTokens(prompt, modelId);
  }

  /**
   * Counts tokens in a prompt string
   */
  public static countPromptTokens(prompt: string, modelId: string): number {
    const enc = this.getEncodingForModel(modelId);
    return enc.encode(prompt).length;
  }

  // Configuration management

  /**
   * Updates temperature setting
   */
  set temperature(value: number) {
    this._temperature = value;
  }

  /**
   * Updates top-p setting
   */
  set topP(value: number) {
    this._topP = value;
  }

  /**
   * Updates OpenAI configuration
   */
  private updateConfig(config: OpenAIProviderSettings) {
    // Validate configurations
    const validGlobalConfig = openaiSettingsSchema.parse(this.config);
    const validConfig = openaiSettingsSchema.parse(config);

    // Merge configurations
    this.config = {
      ...validGlobalConfig,
      ...validConfig,
      headers: {
        ...(this.config as OpenAIProviderSettings).headers,
        ...config.headers,
        "HTTP-Referer": "https://github.com/m31-team/m31-mini",
        "X-Title": "M31 Mini",
      }
    } as OpenAIProviderSettings;

    // Set compatibility mode based on URL
    const baseURL = (this.config as OpenAIProviderSettings).baseURL ?? '';
    (this.config as OpenAIProviderSettings).compatibility =
      baseURL.includes('openai.com') ? 'strict' : 'compatible';

    this.rebuildOpenAIProvider();
  }

  /**
   * Updates Azure OpenAI configuration
   */
  private updateAzureConfig(config: AzureOpenAIProviderSettings, baseURL?: string) {
    this.isAzure = true;

    // Merge configurations
    this.config = {
      resourceName: config?.resourceName ?? (this.config as AzureOpenAIProviderSettings).resourceName ?? '',
      apiKey: config?.apiKey ?? (this.config as AzureOpenAIProviderSettings).apiKey ?? '',
    } as AzureOpenAIProviderSettings;

    this.rebuildAzureOpenAIProvider(baseURL);
  }

  /**
   * Rebuilds the Azure OpenAI provider with current configuration
   */
  private rebuildAzureOpenAIProvider(baseURL?: string) {
    this.isAzure = true;

    // Extract deployment name from URL if present
    if (baseURL?.includes('/deployments/')) {
      const urlParts = baseURL.split('/');
      this.deploymentName = urlParts[urlParts.length - 1];
    } else if (baseURL) {
      console.warn(`${ERROR_MESSAGES.AZURE_DEPLOYMENT_NOT_FOUND} ${baseURL}`);
    }

    // Extract resource name from endpoint
    const endpoint = (baseURL ?? '').replace(`/deployments/${this.deploymentName}`, '');
    const resourceName = (endpoint.split('.').shift() ?? endpoint).replace('https://', '');

    if (!this.deploymentName) {
      console.warn(ERROR_MESSAGES.AZURE_NO_DEPLOYMENT_ID);
    }

    (this.config as AzureOpenAIProviderSettings).resourceName = resourceName;
    this._openai = createAzure(this.config);
  }

  /**
   * Rebuilds the standard OpenAI provider with current configuration
   */
  private rebuildOpenAIProvider() {
    this.isAzure = false;
    this._openai = createOpenAI(this.config);
  }

  /**
   * Updates API key and refreshes model list
   */
  async updateApiKey(apiKey: string) {
    if (this.isAzure) {
      this.updateAzureConfig({ apiKey });
    } else {
      this.updateConfig({ apiKey });
    }

    await this.repullModelListOnce();
  }

  /**
   * Updates organization ID and refreshes model list
   */
  async updateOrganizationId(organization: string) {
    if (this.isAzure) {
      console.info(ERROR_MESSAGES.AZURE_NO_ORG_ID);
    } else {
      this.updateConfig({ organization });
    }

    await this.repullModelListOnce();
  }

  /**
   * Updates API base URL and refreshes model list
   */
  async updateApiBaseUrl(apiBaseUrl: string) {
    // Clean URL and check if it's Azure
    const cleanUrl = apiBaseUrl.replace(/\/$/, '');
    const wasAzure = this.isAzure;
    this.isAzure = this.checkIfAzure(cleanUrl);

    // Skip if URL hasn't changed (for non-Azure)
    if (!this.isAzure && !wasAzure && cleanUrl === (this.config as OpenAIProviderSettings).baseURL) {
      return;
    }

    // Update configuration based on provider type
    if (this.isAzure) {
      this.updateAzureConfig({}, cleanUrl);
    } else {
      this.updateConfig({ baseURL: cleanUrl });
    }

    await this.repullModelListOnce();
  }

  /**
   * Updates both API key and base URL together
   */
  async updateApiKeyAndBaseUrl(apiKey: string, apiBaseUrl: string) {
    const cleanUrl = apiBaseUrl.replace(/\/$/, '');
    this.isAzure = this.checkIfAzure(cleanUrl);

    if (this.isAzure) {
      this.updateAzureConfig({ apiKey }, cleanUrl);
    } else {
      this.updateConfig({
        apiKey,
        baseURL: cleanUrl,
      });
    }

    await this.repullModelListOnce();
  }

  /**
   * Ensures only one model list fetch happens at a time
   */
  private async repullModelListOnce(): Promise<void> {
    if (!this.pendingModelFetch) {
      this.pendingModelFetch = this.repullModelList();
    }
    return this.pendingModelFetch;
  }

  /**
   * Fetches the list of available models from the API
   */
  private async repullModelList(): Promise<void> {
    try {
      // For Azure, we just use the deployment as the model
      if (this.isAzure) {
        this._modelList = [{
          id: this.deploymentName ?? FALLBACK_MODEL_ID,
          name: 'Default Azure Model',
          created: Date.now(),
          object: "model",
          owned_by: Role.user,
        }];
        return;
      }

      if (!this._openai) {
        console.error(ERROR_MESSAGES.API_NOT_INITIALIZED);
        return;
      }

      // Error instances for specific error cases
      const modelEndpointNotFound = new Error(ERROR_MESSAGES.MODEL_ENDPOINT_NOT_FOUND);
      const missingApiKey = new Error(ERROR_MESSAGES.MISSING_API_KEY);

      // Determine the models endpoint URL
      const config = this.config as OpenAIProviderSettings;
      const url = `${config.baseURL}/models`;

      // Fetch models list
      const data = await ky.get(url, {
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        hooks: {
          afterResponse: [
            async (_input, _options, response: Response) => {
              switch (response.status) {
                case 401: throw missingApiKey;
                case 404: throw modelEndpointNotFound;
                default: return response;
              }
            },
          ],
        },
      }).json() as { object: string; data: Model[]; };

      this._modelList = data.data;
    } catch (error: any) {
      // Handle different error cases
      if (error?.message === ERROR_MESSAGES.MODEL_ENDPOINT_NOT_FOUND) {
        await this.tryFetchOllamaModels();
      } else if (error?.message === ERROR_MESSAGES.MISSING_API_KEY) {
        const config = this.config as OpenAIProviderSettings;
        console.error(ERROR_MESSAGES.MISSING_API_KEY, error, {
          url: `${config.baseURL}/models`,
          headers: { "Authorization": `Bearer ${this.config.apiKey}` },
        }, 'config:', this.config);
        throw error;
      } else {
        console.error(ERROR_MESSAGES.OPENAI_FAILURE, error);
        throw error;
      }
    } finally {
      // Always reset the pending fetch
      this.pendingModelFetch = undefined;
    }
  }

  /**
   * Attempts to fetch models from Ollama API as a fallback
   */
  private async tryFetchOllamaModels(): Promise<void> {
    try {
      const config = this.config as OpenAIProviderSettings;
      const baseUrl = (config.baseURL ?? '').replace('/v1', '');

      const data = await ky.get(`${baseUrl}/api/tags`).json() as {
        models: {
          name: string;
          modified_at: string;
          size: number;
          digest: string;
          details: string;
        }[];
      };

      this._modelList = data.models.map(model => {
        // Parse details string if possible, or create a default details object
        let detailsObj;
        try {
          // Try to parse as JSON if it's a JSON string
          detailsObj = JSON.parse(model.details);
        } catch (e) {
          // If parsing fails, create a default details object
          detailsObj = {
            format: "unknown",
            family: "unknown",
            families: null,
            parameter_size: "unknown",
            quantization_level: "unknown"
          };
        }

        return {
          id: model.name,
          name: model.name,
          created: Date.parse(model.modified_at),
          object: "model",
          owned_by: Role.user,
          // Ollama-specific fields
          size: model.size,
          digest: model.digest,
          details: detailsObj,
        };
      });

      console.info(ERROR_MESSAGES.OLLAMA_SUCCESS);
    } catch (e) {
      console.error(ERROR_MESSAGES.OLLAMA_FAILURE, e);
    }
  }

  /**
   * Gets the list of available models
   */
  async getModelList(): Promise<Model[]> {
    if (this._modelList?.length === 0) {
      await this.repullModelListOnce();
    }
    return this._modelList ?? [];
  }

  /**
   * Gets the current API URL
   */
  getApiUrl(): string {
    if (this.isAzure) {
      const config = this.config as AzureOpenAIProviderSettings;
      return this.buildAzureApiUrl(config.resourceName ?? '', this.deploymentName ?? '');
    } else {
      return (this.config as OpenAIProviderSettings).baseURL ?? '';
    }
  }

  /**
   * Checks if a URL is for Azure OpenAI
   */
  checkIfAzure(apiUrl: string): boolean {
    return apiUrl.includes('azure.com');
  }

  /**
   * Builds a complete Azure API URL
   */
  buildAzureApiUrl(resourceName: string, deploymentName: string): string {
    return `https://${resourceName}.openai.azure.com/openai/deployments/${deploymentName}`;
  }
}
