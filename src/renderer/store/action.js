import { createSlice } from '@reduxjs/toolkit';
import { ActionNames } from "../types";

/**
 * Represents the possible states of an action during execution
 */
export var ActionRunState;
(function (ActionRunState) {
    ActionRunState["running"] = "running"; // Action is currently running
    ActionRunState["error"] = "error";     // Action encountered an error
    ActionRunState["success"] = "success"; // Action completed successfully
    ActionRunState["idle"] = "idle";       // Action is not running
})(ActionRunState || (ActionRunState = {}));

// Initial state with predefined actions
// TODO: Support internationalization (i18n)
const initialState = {
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
        setActionError: (state, action) => {
            const { actionId, error } = action.payload;
            const actionIndex = state.actionList.findIndex((action) => action.id === actionId);

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
        clearActionError: (state, action) => {
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
        setActionState: (state, action) => {
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
    setActionState
} = actionSlice.actions;

// Export the reducer
export default actionSlice.reducer;
//# sourceMappingURL=action.js.map