import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WebviewApi } from "vscode-webview";
import { DEFAULT_EXTENSION_SETTINGS, ExtensionSettings, Model } from "../types";

/**
 * Represents the possible states of an API key
 */
export enum ApiKeyStatus {
  Unknown = "unknown",         // Initial state, status not yet determined
  Unset = "unset",             // API key has not been set
  Pending = "pending",         // API key is being processed
  Authenticating = "authenticating", // Authentication in progress
  Invalid = "invalid",         // API key is invalid
  Valid = "valid",             // API key is valid and working
  Error = "error"              // Error occurred during validation
}

/**
 * Configuration options for the UI view
 */
export interface ViewOptionsState {
  hideName: boolean;           // Whether to hide names in the UI
  showCodeOnly: boolean;       // Whether to show only code sections
  showMarkdown: boolean;       // Whether to render markdown
  alignRight: boolean;         // Whether to align content to the right
  showCompact: boolean;        // Whether to use compact view mode
  showNetworkLogs: boolean;    // Whether to display network logs
  showEditorSelection: boolean; // Whether to show editor selection controls
  showClear: boolean;          // Whether to show clear button
  showVerbosity: boolean;      // Whether to show verbosity controls
  showModelSelect: boolean;    // Whether to show model selection dropdown
  showTokenCount: boolean;     // Whether to show token usage counts
}

/**
 * Tracks synchronization status with extension
 */
export interface SyncState {
  receivedViewOptions: boolean;      // Whether view options have been received
  receivedModels: boolean;           // Whether models have been received
  receivedExtensionSettings: boolean; // Whether extension settings have been received
}

/**
 * Translation strings
 */
export interface Translations {
  [key: string]: string;
}

/**
 * Main application state
 */
export interface AppState {
  debug: boolean;                    // Whether debug mode is enabled
  extensionSettings: ExtensionSettings; // Settings from the extension
  models: Model[];                   // Available AI models
  apiKeyStatus: ApiKeyStatus;        // Status of the API key
  useEditorSelection: boolean;       // Whether to use text selected in editor
  vscode?: WebviewApi<unknown>;      // VS Code webview API instance
  viewOptions: ViewOptionsState;     // UI view configuration
  sync: SyncState;                   // Synchronization status
  translations: Translations;        // Translation strings
}

/**
 * Default view options
 */
const defaultViewOptions: ViewOptionsState = {
  hideName: true,
  showCodeOnly: false,
  showMarkdown: true,
  alignRight: false,
  showCompact: true,
  showNetworkLogs: false,
  showEditorSelection: false,
  showClear: false,
  showVerbosity: false,
  showModelSelect: true,
  showTokenCount: false
};

/**
 * Initial synchronization state
 */
const initialSyncState: SyncState = {
  receivedViewOptions: false,
  receivedModels: false,
  receivedExtensionSettings: false
};

/**
 * Initial application state
 */
const initialState: AppState = {
  debug: false,
  extensionSettings: DEFAULT_EXTENSION_SETTINGS,
  models: [],
  apiKeyStatus: ApiKeyStatus.Unknown,
  useEditorSelection: false,
  vscode: undefined,
  viewOptions: defaultViewOptions,
  sync: initialSyncState,
  translations: {}
};

/**
 * Payload for updating extension settings
 */
export type ExtensionSettingsPayload = {
  newSettings: ExtensionSettings;
};

/**
 * Payload for updating available models
 */
export type ModelsPayload = {
  models: Model[];
};

/**
 * Redux slice for managing application state
 */
export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    /**
     * Toggles debug mode
     */
    setDebug: (state, action: PayloadAction<boolean>) => {
      state.debug = action.payload;
    },

    /**
     * Updates extension settings
     */
    setExtensionSettings: (state, action: PayloadAction<ExtensionSettingsPayload>) => {
      state.extensionSettings = action.payload.newSettings;
    },

    /**
     * Updates available models
     */
    setModels: (state, action: PayloadAction<ModelsPayload>) => {
      state.models = action.payload.models ?? [];
    },

    /**
     * Updates API key status
     */
    setApiKeyStatus: (state, action: PayloadAction<ApiKeyStatus>) => {
      state.apiKeyStatus = action.payload;
    },

    /**
     * Toggles whether to use editor selection
     */
    setUseEditorSelection: (state, action: PayloadAction<boolean>) => {
      state.useEditorSelection = action.payload;
    },

    /**
     * Sets the VS Code webview API instance
     */
    setVSCode: (state, action: PayloadAction<WebviewApi<unknown>>) => {
      state.vscode = action.payload;
    },

    /**
     * Toggles a specific view option
     */
    toggleViewOption: (state, action: PayloadAction<keyof ViewOptionsState>) => {
      state.viewOptions[action.payload] = !state.viewOptions[action.payload];
    },

    /**
     * Updates all view options
     */
    setViewOptions: (state, action: PayloadAction<ViewOptionsState>) => {
      state.viewOptions = {
        ...defaultViewOptions,
        ...action.payload
      };
    },

    /**
     * Updates view options sync status
     */
    setReceivedViewOptions: (state, action: PayloadAction<boolean>) => {
      state.sync.receivedViewOptions = action.payload;
    },

    /**
     * Updates models sync status
     */
    setReceivedModels: (state, action: PayloadAction<boolean>) => {
      state.sync.receivedModels = action.payload;
    },

    /**
     * Updates extension settings sync status
     */
    setReceivedExtensionSettings: (state, action: PayloadAction<boolean>) => {
      state.sync.receivedExtensionSettings = action.payload;
    },
  },
});

// Export action creators
export const {
  setDebug,
  setExtensionSettings,
  setModels,
  setApiKeyStatus,
  setUseEditorSelection,
  setVSCode,
  toggleViewOption,
  setViewOptions,
  setReceivedViewOptions,
  setReceivedModels,
  setReceivedExtensionSettings,
} = appSlice.actions;

// Export the reducer
export default appSlice.reducer;
