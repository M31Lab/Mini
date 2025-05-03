/// <reference lib="dom" />

import * as vscode from 'vscode';
import { ApiProvider } from './openai-api-provider';

/**
 * Provides inline "ghost text" suggestions as you type
 * 
 * This class manages the display of inline suggestions that appear
 * as ghost text while typing, similar to GitHub Copilot.
 */
export class GhostTextProvider {
  private api: ApiProvider;
  private decorationType: vscode.TextEditorDecorationType;
  private timeout: NodeJS.Timeout | undefined;
  private lastPosition: vscode.Position | undefined;
  private hasActiveSuggestion: boolean = false;
  private currentSuggestion: string | undefined;

  constructor(api: ApiProvider) {
    this.api = api;

    // Create decoration type for ghost text
    this.decorationType = vscode.window.createTextEditorDecorationType({
      opacity: '0.6',
      after: {
        color: new vscode.ThemeColor('editorGhostText.foreground')
      }
    });

    // Listen for editor changes
    vscode.window.onDidChangeActiveTextEditor(this.onEditorChange, this);
    vscode.workspace.onDidChangeTextDocument(this.onDocumentChange, this);
  }

  /**
   * Handles changes to the active editor
   */
  private onEditorChange(editor: vscode.TextEditor | undefined): void {
    if (!editor) { return; }
    this.updateGhostText(editor);
  }

  /**
   * Handles changes to the document text
   */
  private onDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== event.document) { return; }

    // Get configuration
    const config = vscode.workspace.getConfiguration('chatgpt.inlineSuggestions');
    if (!config.get<boolean>('enabled', true)) {
      this.clearDecorations(editor);
      return;
    }

    // Check if language is supported
    const supportedLanguages = config.get<string[]>('languages', [
      'javascript', 'typescript', 'python', 'java', 'c', 'cpp',
      'csharp', 'go', 'ruby', 'php', 'rust'
    ]);

    if (!supportedLanguages.includes(editor.document.languageId)) {
      this.clearDecorations(editor);
      return;
    }

    // Clear existing timeout
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    // Debounce to avoid too many API calls
    const debounceTime = config.get<number>('debounceTime', 500);
    this.timeout = setTimeout(() => {
      this.updateGhostText(editor);
    }, debounceTime);
  }

  /**
   * Clears all ghost text decorations
   */
  private clearDecorations(editor: vscode.TextEditor): void {
    editor.setDecorations(this.decorationType, []);
    this.hasActiveSuggestion = false;
    this.currentSuggestion = undefined;
  }

  /**
   * Updates the ghost text suggestion based on current context
   */
  private async updateGhostText(editor: vscode.TextEditor): Promise<void> {
    const position = editor.selection.active;

    // Skip if position hasn't changed
    if (this.lastPosition &&
      this.lastPosition.line === position.line &&
      this.lastPosition.character === position.character) {
      return;
    }

    this.lastPosition = position;

    // Get context
    const document = editor.document;
    const lineText = document.lineAt(position.line).text;
    const linePrefix = lineText.substring(0, position.character);

    // Skip if line is empty or cursor is at beginning
    if (linePrefix.trim() === '') {
      this.clearDecorations(editor);
      return;
    }

    // Get surrounding code for context
    const startLine = Math.max(0, position.line - 10);
    const endLine = Math.min(document.lineCount - 1, position.line + 10);

    let codeContext = '';
    for (let i = startLine; i <= endLine; i++) {
      if (i === position.line) {
        codeContext += linePrefix + '\n';
      } else {
        codeContext += document.lineAt(i).text + '\n';
      }
    }

    try {
      // Get suggestion from AI
      const suggestion = await this.api.getQuickCompletion(codeContext, document.languageId);

      if (!suggestion) {
        this.clearDecorations(editor);
        return;
      }

      // Create decoration for ghost text
      const decoration: vscode.DecorationOptions = {
        range: new vscode.Range(position, position),
        renderOptions: {
          after: {
            contentText: suggestion
          }
        }
      };

      editor.setDecorations(this.decorationType, [decoration]);
      this.hasActiveSuggestion = true;
      this.currentSuggestion = suggestion;
    } catch (error) {
      console.error('[M31 Mini] Error providing ghost text:', error);
      this.clearDecorations(editor);
    }
  }

  /**
   * Checks if there's an active suggestion
   */
  public isActiveSuggestion(): boolean {
    return this.hasActiveSuggestion;
  }

  /**
   * Accepts the current suggestion
   */
  public acceptSuggestion(): boolean {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !this.hasActiveSuggestion || !this.currentSuggestion) {
      return false;
    }

    // Insert the suggestion at current position
    editor.edit(editBuilder => {
      editBuilder.insert(editor.selection.active, this.currentSuggestion!);
    }).then(success => {
      if (success) {
        // Clear decorations after successful insertion
        this.clearDecorations(editor);
      }
    });
    return true;
  }

  /**
   * Disposes of resources
   */
  public dispose(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.decorationType.dispose();
  }
}