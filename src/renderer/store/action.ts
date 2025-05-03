import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ActionNames } from "../types";

/**
 * Represents the possible states of an action during execution
 */
export enum ActionRunState {
  running = "running", // Action is currently running
  error = "error",     // Action encountered an error
  success = "success", // Action completed successfully
  idle = "idle",       // Action is not running
}

/**
 * Represents an executable action in the application
 */
export interface Action {
  id: string;           // Unique identifier for the action
  name: string;         // Human-readable name
  description: string;  // Detailed description of what the action does
  tags: string[];       // Categories/tags for filtering and organization
  state: ActionRunState; // Current execution state
  error?: string;       // Error message if state is error
}

/**
 * The state shape for the action slice
 */
export interface ActionState {
  actionList: Action[]; // List of all available actions
}

/**
 * Payload for setting an error on an action
 */
export interface ActionErrorPayload {
  actionId: string; // ID of the action that encountered an error
  error: string;    // Error message
}

/**
 * Payload for updating an action's state
 */
export interface ActionStatePayload {
  actionId: string;       // ID of the action to update
  state: ActionRunState;  // New state to set
}

// Initial state with predefined actions
// TODO: Support internationalization (i18n)
const initialState: ActionState = {
  actionList: [
    {
      id: ActionNames.createReadmeFromPackageJson,
      name: "Generate README.md from package.json",
      description: "Creates a README.md file based on the contents of package.json",
      tags: ["javascript"],
      state: ActionRunState.idle,
    },
    {
      id: ActionNames.createReadmeFromFileStructure,
      name: "Generate README.md from file structure",
      description: "Creates a README.md file based on the files/folders present. Does not open files.",
      tags: [],
      state: ActionRunState.idle,
    },
    {
      id: ActionNames.createGitignore,
      name: "Generate .gitignore",
      description: "Creates a .gitignore file based on the file structure and the package.json if present.",
      tags: ["javascript"],
      state: ActionRunState.idle,
    },
  ],
};

/**
 * Redux slice for managing actions
 */
export const actionSlice = createSlice({
  name: 'action',
  initialState,
  reducers: {
    /**
     * Sets an error state and message for a specific action
     */
    setActionError: (state, action: PayloadAction<ActionErrorPayload>) => {
      const { actionId, error } = action.payload;
      const actionIndex = state.actionList.findIndex((action: Action) => action.id === actionId);

      if (actionIndex >= 0) {
        state.actionList[actionIndex].state = ActionRunState.error;
        state.actionList[actionIndex].error = error;
      }
    },

    /**
     * Clears all error states and resets actions to idle
     */
    clearActionErrors: (state) => {
      // Reset all actions in error state back to idle
      state.actionList.forEach((action) => {
        if (action.state === ActionRunState.error) {
          action.state = ActionRunState.idle;
          delete action.error;
        }
      });
    },

    /**
     * Clears the error state for a specific action
     */
    clearActionError: (state, action: PayloadAction<string>) => {
      const actionId = action.payload;
      const actionIndex = state.actionList.findIndex((action) => action.id === actionId);

      if (actionIndex >= 0 && state.actionList[actionIndex].state === ActionRunState.error) {
        state.actionList[actionIndex].state = ActionRunState.idle;
        delete state.actionList[actionIndex].error;
      }
    },

    /**
     * Updates the state of a specific action
     */
    setActionState: (state, action: PayloadAction<ActionStatePayload>) => {
      const { actionId, state: newState } = action.payload;
      const actionIndex = state.actionList.findIndex((action) => action.id === actionId);

      // Some actions are not in the list (ie set convo title)
      // TODO: Separate UI actions from backend actions
      if (actionIndex >= 0) {
        state.actionList[actionIndex].state = newState;
      }
    },
  },
});

// Export action creators
export const {
  setActionError,
  clearActionErrors,
  clearActionError,
  setActionState,
} = actionSlice.actions;

// Export the reducer
export default actionSlice.reducer;
