/// <reference lib="dom" />

import * as vscode from 'vscode';
import { ApiProvider } from './openai-api-provider';

/**
 * Provides inline code suggestions similar to GitHub Copilot
 * 
 * This provider integrates with VS Code's IntelliSense system to offer
 * AI-powered code completions as you type.
 */
export class CopilotStyleCompletionProvider implements vscode.CompletionItemProvider {
  private api: ApiProvider;

  constructor(api: ApiProvider) {
    this.api = api;
  }

  /**
   * Provides completion items for the current cursor position
   */
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList> {
    // Skip if user is not typing or if we're in a comment
    if (context.triggerKind !== vscode.CompletionTriggerKind.Invoke &&
      context.triggerKind !== vscode.CompletionTriggerKind.TriggerCharacter) {
      return [];
    }

    // Get configuration
    const config = vscode.workspace.getConfiguration('chatgpt.inlineSuggestions');
    if (!config.get<boolean>('enabled', true)) {
      return [];
    }

    // Check if language is supported
    const supportedLanguages = config.get<string[]>('languages', [
      'javascript', 'typescript', 'python', 'java', 'c', 'cpp',
      'csharp', 'go', 'ruby', 'php', 'rust'
    ]);

    if (!supportedLanguages.includes(document.languageId)) {
      return [];
    }

    // Get context (preceding code)
    const linePrefix = document.lineAt(position.line).text.substring(0, position.character);
    if (linePrefix.trim() === '') {
      return [];
    }

    // Get surrounding code for context (e.g., 10 lines before and after)
    const startLine = Math.max(0, position.line - 10);
    const endLine = Math.min(document.lineCount - 1, position.line + 10);

    let codeContext = '';
    for (let i = startLine; i <= endLine; i++) {
      if (i === position.line) {
        // For current line, only include text up to cursor position
        codeContext += document.lineAt(i).text.substring(0, position.character) + '\n';
      } else {
        codeContext += document.lineAt(i).text + '\n';
      }
    }

    try {
      // Get completion from AI
      const completion = await this.getCompletion(codeContext, document.languageId);

      if (!completion || token.isCancellationRequested) {
        return [];
      }

      // Create completion item
      const item = new vscode.CompletionItem(completion);
      item.insertText = completion;
      item.detail = 'M31 Mini AI suggestion';
      item.kind = vscode.CompletionItemKind.Snippet;
      item.documentation = new vscode.MarkdownString('AI-generated code suggestion');

      return [item];
    } catch (error) {
      console.error('[M31 Mini] Error providing completion:', error);
      return [];
    }
  }

  /**
   * Gets a code completion from the AI
   */
  private async getCompletion(codeContext: string, language: string): Promise<string> {
    try {
      // Use the API provider to get a completion
      return await this.api.getQuickCompletion(codeContext, language);
    } catch (error) {
      console.error('[M31 Mini] Error in getCompletion:', error);
      return '';
    }
  }
}