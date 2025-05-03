/// <reference lib="dom" />

import { ExtensionContext, SecretStorage } from "vscode";
import { ViewOptionsState } from "./renderer/store/app";
import { Model } from "./renderer/types";

/**
 * Storage keys for secure data
 */
const StorageKeys = {
  DEFAULT_API_KEY: "m31_mini_openai_api_key",
  API_KEYS_BY_URL: "m31_mini_openai_api_key_by_api",
  MODELS_BY_API: "m31_mini_models_by_api",
  VIEW_OPTIONS: "offline_view_options"
};

/**
 * Manages secure storage of API keys and authentication data
 * 
 * Features:
 * - Stores API keys securely by API base URL
 * - Maintains a default key for convenience
 * - Remembers which model was last used with each API
 */
export class AuthStore {
  private static _instance: AuthStore;

  /**
   * Creates a new AuthStore instance
   * 
   * @param secretStorage - VS Code's secure storage mechanism
   */
  constructor(private secretStorage: SecretStorage) { }

  /**
   * Initializes the AuthStore singleton
   * 
   * @param context - VS Code extension context
   * @returns The AuthStore instance
   */
  static init(context: ExtensionContext): AuthStore {
    if (!AuthStore._instance) {
      AuthStore._instance = new AuthStore(context.secrets);
    }
    return AuthStore._instance;
  }

  /**
   * Retrieves the mapping of API base URLs to their API keys
   * 
   * @returns Object mapping API URLs to their keys
   */
  private async getKeyByApiObject(): Promise<Record<string, string>> {
    try {
      const keyByApi = await this.secretStorage.get(StorageKeys.API_KEYS_BY_URL);

      if (!keyByApi) {
        const emptyObject = JSON.stringify({});
        await this.secretStorage.store(StorageKeys.API_KEYS_BY_URL, emptyObject);
        return {};
      }

      return JSON.parse(keyByApi);
    } catch (error) {
      console.error("[M31 Mini] Error retrieving API keys:", error);
      return {};
    }
  }

  /**
   * Stores the mapping of API base URLs to their API keys
   * 
   * @param keyByApi - Object mapping API URLs to their keys
   */
  private async storeKeyByApiObject(keyByApi: Record<string, string>): Promise<void> {
    try {
      await this.secretStorage.store(StorageKeys.API_KEYS_BY_URL, JSON.stringify(keyByApi));
    } catch (error) {
      console.error("[M31 Mini] Error storing API keys:", error);
    }
  }

  /**
   * Stores an API key, optionally associating it with a specific API base URL
   * 
   * @param token - API key to store (empty string to clear)
   * @param apiBaseUrl - Optional API base URL to associate with this key
   */
  async storeApiKey(token: string | undefined = undefined, apiBaseUrl?: string): Promise<void> {
    if (token === undefined) {
      console.warn("[M31 Mini] No API key provided to store");
      return;
    }

    try {
      // If an API base URL is provided, store the key for that specific API
      if (apiBaseUrl) {
        const keyByApi = await this.getKeyByApiObject();
        keyByApi[apiBaseUrl] = token;
        await this.storeKeyByApiObject(keyByApi);
      }

      // Always update the default key
      await this.secretStorage.store(StorageKeys.DEFAULT_API_KEY, token);
    } catch (error) {
      console.error("[M31 Mini] Error storing API key:", error);
    }
  }

  /**
   * Retrieves an API key, optionally for a specific API base URL
   * 
   * @param apiBaseUrl - Optional API base URL to get the key for
   * @returns The API key if found, undefined otherwise
   */
  async getApiKey(apiBaseUrl?: string): Promise<string | undefined> {
    try {
      if (apiBaseUrl) {
        // Get the key for the specific API, falling back to the default key
        const keyByApi = await this.getKeyByApiObject();
        const defaultKey = await this.secretStorage.get(StorageKeys.DEFAULT_API_KEY);
        const key = keyByApi[apiBaseUrl] ?? defaultKey;

        // Update the default key to the last accessed key
        if (key) {
          await this.secretStorage.store(StorageKeys.DEFAULT_API_KEY, key);
        }

        return key;
      } else {
        // Return the default key
        return await this.secretStorage.get(StorageKeys.DEFAULT_API_KEY);
      }
    } catch (error) {
      console.error("[M31 Mini] Error retrieving API key:", error);
      return undefined;
    }
  }

  /**
   * Retrieves the model associated with a specific API base URL
   * 
   * @param apiBaseUrl - API base URL to get the model for
   * @returns The associated model if found, undefined otherwise
   */
  async getModelByApi(apiBaseUrl: string): Promise<Model | undefined> {
    try {
      const modelsData = await this.secretStorage.get(StorageKeys.MODELS_BY_API);

      if (!modelsData) {
        return undefined;
      }

      const modelsByApi = JSON.parse(modelsData);
      return modelsByApi[apiBaseUrl];
    } catch (error) {
      console.error("[M31 Mini] Error retrieving model for API:", error);
      return undefined;
    }
  }

  /**
   * Stores a model association with a specific API base URL
   * 
   * @param apiBaseUrl - API base URL to associate the model with
   * @param model - Model to associate with the API
   */
  async storeModelByApi(apiBaseUrl: string, model: Model): Promise<void> {
    try {
      const modelsData = await this.secretStorage.get(StorageKeys.MODELS_BY_API);

      // Initialize or parse existing models data
      let modelsByApi: Record<string, Model> = {};
      if (modelsData) {
        modelsByApi = JSON.parse(modelsData);
      }

      // Update the model for this API
      modelsByApi[apiBaseUrl] = model;

      // Store the updated models data
      await this.secretStorage.store(StorageKeys.MODELS_BY_API, JSON.stringify(modelsByApi));
    } catch (error) {
      console.error("[M31 Mini] Error storing model for API:", error);
    }
  }
}

/**
 * Manages storage of view options and other non-sensitive settings
 */
export class OfflineStore {
  private static _instance: OfflineStore;

  /**
   * Creates a new OfflineStore instance
   * 
   * @param secretStorage - VS Code's secure storage mechanism
   */
  constructor(private secretStorage: SecretStorage) { }

  /**
   * Initializes the OfflineStore singleton
   * 
   * @param context - VS Code extension context
   * @returns The OfflineStore instance
   */
  static init(context: ExtensionContext): OfflineStore {
    if (!OfflineStore._instance) {
      OfflineStore._instance = new OfflineStore(context.secrets);
    }
    return OfflineStore._instance;
  }

  /**
   * Retrieves the current view options
   * 
   * @returns The current view options if found, undefined otherwise
   */
  async getViewOptions(): Promise<ViewOptionsState | undefined> {
    try {
      const viewOptionsData = await this.secretStorage.get(StorageKeys.VIEW_OPTIONS);

      if (!viewOptionsData) {
        return undefined;
      }

      return JSON.parse(viewOptionsData);
    } catch (error) {
      console.error("[M31 Mini] Error retrieving view options:", error);
      return undefined;
    }
  }

  /**
   * Updates the view options with new values
   * 
   * @param newOptions - Partial view options to merge with existing options
   */
  async setViewOptions(newOptions: Partial<ViewOptionsState>): Promise<void> {
    try {
      // Get current options or initialize empty object
      const currentOptions = await this.getViewOptions() || {};

      // Merge current options with new options
      const updatedOptions = { ...currentOptions, ...newOptions };

      // Store the updated options
      await this.secretStorage.store(StorageKeys.VIEW_OPTIONS, JSON.stringify(updatedOptions));
    } catch (error) {
      console.error("[M31 Mini] Error setting view options:", error);
    }
  }
}
