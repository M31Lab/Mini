/// <reference lib="dom" />

import * as vscode from "vscode";
import { CopilotStyleCompletionProvider } from "./completion-provider";
import { GhostTextProvider } from "./ghost-text-provider";
import { getSelectedModelId } from "./helpers";
import ChatGptViewProvider from './main';

/**
 * List of all available menu commands for the extension
 */
const availableMenuCommands: string[] = [
  "addTests", "findProblems", "optimize", "explain",
  "addComments", "completeCode", "generateCode",
  "customPrompt1", "customPrompt2", "customPrompt3",
  "customPrompt4", "customPrompt5", "customPrompt6",
  "adhoc"
];

/**
 * Activates the extension and registers all commands and views
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  let adhocCommandPrefix: string = context.globalState.get("chatgpt-adhoc-prompt") || '';
  const provider: ChatGptViewProvider = new ChatGptViewProvider(context);

  // Register the webview provider that will handle the UI
  const webviewView = vscode.window.registerWebviewViewProvider(
    "vscode-chatgpt.view",
    provider,
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    }
  );

  // Register the free text command to ask anything
  const freeTextCommand = vscode.commands.registerCommand("vscode-chatgpt.freeText", async () => {
    const userInput = await vscode.window.showInputBox({
      prompt: "Ask anything...",
    });

    if (!userInput) {
      return;
    }

    const currentConversation = provider.currentConversation;
    if (!currentConversation) {
      console.error("[M31 Mini] freeText - No current conversation found");
      return;
    }

    provider.sendApiRequest(userInput, {
      command: "freeText",
      conversation: currentConversation,
      language: vscode.window.activeTextEditor?.document.languageId,
    });
  });

  // Register command to clear the current conversation
  const resetThreadCommand = vscode.commands.registerCommand(
    "vscode-chatgpt.clearConversation",
    () => provider.clearConversation()
  );

  // Register command to export the current conversation to markdown
  const exportConversationCommand = vscode.commands.registerCommand(
    "vscode-chatgpt.exportConversation",
    async () => {
      const currentConversation = provider.currentConversation;
      if (currentConversation) {
        await provider.exportToMarkdown(currentConversation);
      }
    }
  );

  // Register command to clear the session (API key)
  const clearSessionCommand = vscode.commands.registerCommand(
    "vscode-chatgpt.clearSession",
    () => context.globalState.update("chatgpt-gpt3-apiKey", null)
  );

  // Handle configuration changes
  const configChangeHandler = vscode.workspace.onDidChangeConfiguration(
    (configChangeEvent: vscode.ConfigurationChangeEvent) => {
      if (configChangeEvent.affectsConfiguration('chatgpt.response.showNotification')) {
        provider.subscribeToResponse = vscode.workspace.getConfiguration("chatgpt")
          .get("response.showNotification") || false;
      }
    }
  );

  // Register the ad-hoc command handler
  const adhocCommandHandler = vscode.commands.registerCommand("vscode-chatgpt.adhoc", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const selectedText = editor.document.getText(editor.selection);
    if (!selectedText) {
      return;
    }

    let userDismissed = false;

    const userPrefix = await vscode.window.showInputBox({
      title: "Add prefix to your ad-hoc command",
      prompt: "Prefix your code with your custom prompt. i.e. Explain this",
      ignoreFocusOut: true,
      placeHolder: "Ask anything...",
      value: adhocCommandPrefix
    });

    if (!userPrefix) {
      return;
    }

    adhocCommandPrefix = userPrefix.trim() || '';
    context.globalState.update("chatgpt-adhoc-prompt", adhocCommandPrefix);

    if (adhocCommandPrefix.length > 0) {
      const currentConversation = provider.currentConversation;
      if (!currentConversation) {
        console.error("[M31 Mini] adhoc - No current conversation found");
        return;
      }

      provider.sendApiRequest(adhocCommandPrefix, {
        command: "adhoc",
        code: selectedText,
        conversation: currentConversation,
        language: editor.document.languageId,
      });
    }
  });

  // Register the generate code command handler
  const generateCodeCommandHandler = vscode.commands.registerCommand("vscode-chatgpt.generateCode", () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const selectedText = editor.document.getText(editor.selection);
    if (!selectedText) {
      return;
    }

    const currentConversation = provider.currentConversation;
    if (!currentConversation) {
      console.error("[M31 Mini] generateCode - No current conversation found");
      return;
    }

    provider.sendApiRequest(selectedText, {
      command: "generateCode",
      language: editor.document.languageId,
      conversation: currentConversation,
    });
  });

  // Register all standard command handlers
  const standardCommandHandlers = availableMenuCommands
    .filter(command => command !== "adhoc" && command !== "generateCode")
    .map((command) => vscode.commands.registerCommand(`vscode-chatgpt.${command}`, () => {
      const promptTemplate = vscode.workspace.getConfiguration("chatgpt").get<string>(`promptPrefix.${command}`);
      const editor = vscode.window.activeTextEditor;

      if (!editor || !promptTemplate) {
        return;
      }

      const selectedText = editor.document.getText(editor.selection);
      if (!selectedText) {
        return;
      }

      const currentConversation = provider.currentConversation;
      if (!currentConversation) {
        console.error(`[M31 Mini] ${command} - No current conversation found`);
        return;
      }

      provider.sendApiRequest(promptTemplate, {
        command,
        code: selectedText,
        language: editor.document.languageId,
        conversation: currentConversation,
      });
    }));

  // Register inline code completion providers (GitHub Copilot-like functionality)
  const supportedLanguages = [
    'javascript', 'typescript', 'python', 'java', 'c', 'cpp',
    'csharp', 'go', 'ruby', 'php', 'rust'
  ];

  // Create and register the completion provider
  const completionProvider = new CopilotStyleCompletionProvider(provider.api);
  const completionProviderDisposable = vscode.languages.registerCompletionItemProvider(
    supportedLanguages.map(lang => ({ language: lang })),
    completionProvider,
    '.', '(', '{', '[', ':', '=', ' ' // Trigger characters
  );

  // Create and register the ghost text provider
  const ghostTextProvider = new GhostTextProvider(provider.api);

  // Register command to accept suggestion
  const acceptSuggestionCommand = vscode.commands.registerCommand(
    'vscode-chatgpt.acceptSuggestion',
    () => ghostTextProvider.acceptSuggestion()
  );

  // Register keybinding for accepting suggestion (Tab key)
  const acceptSuggestionKeybinding = vscode.commands.registerTextEditorCommand(
    'vscode-chatgpt.acceptSuggestionKeybinding',
    (textEditor) => {
      // Check if there's an active suggestion
      if (ghostTextProvider.isActiveSuggestion()) {
        ghostTextProvider.acceptSuggestion();
      } else {
        // If no suggestion, perform default Tab behavior
        vscode.commands.executeCommand('tab');
      }
    }
  );

  // Register command to toggle inline suggestions
  const toggleInlineSuggestionsCommand = vscode.commands.registerCommand(
    'vscode-chatgpt.toggleInlineSuggestions',
    () => {
      const config = vscode.workspace.getConfiguration('chatgpt.inlineSuggestions');
      const currentValue = config.get<boolean>('enabled', true);

      // Toggle the value
      config.update('enabled', !currentValue, vscode.ConfigurationTarget.Global)
        .then(() => {
          vscode.window.showInformationMessage(
            `Inline suggestions ${!currentValue ? 'enabled' : 'disabled'}`
          );
        });
    }
  );

  // Register command to disable inline suggestions for current file
  const disableInlineSuggestionsForFileCommand = vscode.commands.registerCommand(
    'vscode-chatgpt.disableInlineSuggestionsForFile',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const config = vscode.workspace.getConfiguration('chatgpt.inlineSuggestions');
      const languages = config.get<string[]>('languages', []);
      const currentLanguage = editor.document.languageId;

      // Remove current language from the list if it exists
      if (languages.includes(currentLanguage)) {
        const updatedLanguages = languages.filter(lang => lang !== currentLanguage);
        config.update('languages', updatedLanguages, vscode.ConfigurationTarget.Global)
          .then(() => {
            vscode.window.showInformationMessage(
              `Inline suggestions disabled for ${currentLanguage} files`
            );
          });
      } else {
        vscode.window.showInformationMessage(
          `Inline suggestions already disabled for ${currentLanguage} files`
        );
      }
    }
  );

  // Register command to open inline suggestions settings
  const configureInlineSuggestionsCommand = vscode.commands.registerCommand(
    'vscode-chatgpt.configureInlineSuggestions',
    () => {
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'chatgpt.inlineSuggestions'
      );
    }
  );

  // Register all commands with the extension context
  context.subscriptions.push(
    webviewView,
    freeTextCommand,
    resetThreadCommand,
    exportConversationCommand,
    clearSessionCommand,
    configChangeHandler,
    adhocCommandHandler,
    generateCodeCommandHandler,
    ...standardCommandHandlers,
    // Add new providers and commands
    completionProviderDisposable,
    acceptSuggestionCommand,
    acceptSuggestionKeybinding,
    toggleInlineSuggestionsCommand,
    disableInlineSuggestionsForFileCommand,
    configureInlineSuggestionsCommand,
    ghostTextProvider
  );

  /**
   * Updates the command contexts to enable/disable menu items based on configuration
   */
  const updateCommandContexts = (): void => {
    availableMenuCommands.forEach(command => {
      if (command === "generateCode") {
        const config = vscode.workspace.getConfiguration("chatgpt");
        let generateCodeEnabled = !!config.get<boolean>("gpt3.generateCode-enabled");
        const selectedModel = getSelectedModelId();
        const authenticationMethod = config.get("method") as string;

        // Only enable code generation for code-specific models with OpenAI API
        generateCodeEnabled = generateCodeEnabled &&
          authenticationMethod === "GPT3 OpenAI API Key" &&
          selectedModel.startsWith("code-");

        vscode.commands.executeCommand('setContext', "generateCode-enabled", generateCodeEnabled);
      } else {
        // For other commands, check if they're enabled in the configuration
        const isCommandEnabled = !!vscode.workspace.getConfiguration("chatgpt.promptPrefix")
          .get<boolean>(`${command}-enabled`);
        vscode.commands.executeCommand('setContext', `${command}-enabled`, isCommandEnabled);
      }
    });
  };

  // Initialize command contexts
  updateCommandContexts();
}

/**
 * Called when the extension is deactivated
 */
export function deactivate(): void {
  // Clean up resources if needed
}
