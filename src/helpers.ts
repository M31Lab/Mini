import path from 'path';
import * as vscode from 'vscode';
import { REASONING_MODELS } from "./renderer/types";

// Use the VS Code file system API
const fs = vscode.workspace.fs;

/**
 * Recursively reads a directory up to a specified depth
 * 
 * @param dir - Directory path to read
 * @param maxDepth - Maximum depth to traverse
 * @param currentDepth - Current traversal depth (used internally)
 * @returns List of file and directory names
 */
export async function readDirRecursively(dir: string, maxDepth: number, currentDepth: number = 0): Promise<string[]> {
  // Stop recursion if we've reached the maximum depth
  if (currentDepth > maxDepth) {
    return [];
  }

  const fileList: string[] = [];

  try {
    const entryList = await fs.readDirectory(vscode.Uri.file(dir));

    for (const [entryName, entryType] of entryList) {
      const filePath = path.join(dir, entryName);

      if (entryType === vscode.FileType.Directory) {
        // Add directory name and recursively add its contents
        fileList.push(entryName, ...await readDirRecursively(filePath, maxDepth, currentDepth + 1));
      } else {
        // Add file name
        fileList.push(entryName);
      }
    }
  } catch (error) {
    console.error(`[M31 Mini] Error reading directory ${dir}:`, error);
  }

  return fileList;
}

/**
 * Lists items in a project directory, respecting .gitignore rules
 * 
 * @param currentProjectDir - Project directory path
 * @returns Filtered list of items (max 50)
 */
export async function listItems(currentProjectDir: string): Promise<string[]> {
  // Read .gitignore file if it exists
  const gitignorePath = path.join(currentProjectDir, '.gitignore');
  let gitignoreContents = await readFileIfExists(gitignorePath) ?? '';

  // Always ignore .git directory
  gitignoreContents += '\n.git';

  // Parse gitignore entries
  const gitignoreEntries = gitignoreContents
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));

  // Read directory and filter items
  const items = await readDirRecursively(currentProjectDir, 2);
  const filteredItems = items
    .filter(item => !gitignoreEntries.some(gitignoreEntry => item.includes(gitignoreEntry)))
    .slice(0, 50); // Limit to 50 items for performance

  return filteredItems;
}

/**
 * Map of deprecated model IDs to their current replacements
 */
const deprecatedModelMap = new Map<string, string>([
  ['gpt-4-1106-preview', 'gpt-4-turbo'],
  ['gpt-3.5-turbo-16k', 'gpt-3.5-turbo'],
  ['gpt-3.5-turbo', 'gpt-4o-mini'],
  ['gpt-4-32k', 'gpt-4'],
]);

/**
 * Gets the updated model ID if the provided one is deprecated
 * 
 * @param modelId - Original model ID
 * @returns Updated model ID or original if not deprecated
 */
export function getUpdatedModel(modelId: string): string {
  return deprecatedModelMap.get(modelId) || modelId;
}

/**
 * Gets the currently selected model ID from configuration
 * Updates deprecated models automatically
 * 
 * @returns Current model ID (updated if needed)
 */
export function getSelectedModelId(): string {
  const config = vscode.workspace.getConfiguration("chatgpt");
  const currentModelId = config.get("gpt3.model", 'gpt-4-turbo');
  const updatedModelId = getUpdatedModel(currentModelId);

  // Update configuration if model was deprecated
  if (currentModelId !== updatedModelId) {
    config.update("gpt3.model", updatedModelId, vscode.ConfigurationTarget.Global);
    console.debug(`[M31 Mini] Updated deprecated model "${currentModelId}" to "${updatedModelId}".`);
  }

  return updatedModelId;
}

/**
 * Checks if a file exists at the given path
 * 
 * @param filePath - Path to check
 * @returns URI if file exists, null otherwise
 */
export async function fileExists(filePath: string): Promise<vscode.Uri | null> {
  try {
    const uri = vscode.Uri.file(filePath);
    await fs.stat(uri);
    return uri;
  } catch (error) {
    return null;
  }
}

/**
 * Reads a file if it exists at the given path
 * 
 * @param filePath - Path to read
 * @returns File contents as string if file exists, null otherwise
 */
export async function readFileIfExists(filePath: string): Promise<string | null> {
  const uri = await fileExists(filePath);

  if (uri) {
    try {
      return (await fs.readFile(uri)).toString();
    } catch (error) {
      console.error(`[M31 Mini] Error reading file ${filePath}:`, error);
    }
  }

  return null;
}

/**
 * Creates a throttled function that won't be triggered more than once in a specified time frame
 * 
 * @param func - Function to throttle
 * @param timeFrameMs - Minimum time between function calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(func: T, timeFrameMs: number): (...args: Parameters<T>) => void {
  let lastExecutionTime = 0;

  return function (this: any, ...args: Parameters<T>): void {
    const currentTime = Date.now();

    if (currentTime - lastExecutionTime >= timeFrameMs) {
      func.apply(this, args);
      lastExecutionTime = currentTime;
    }
  };
}

/**
 * A class that provides a stream-like interface for writing to files
 * with throttled writes to improve performance
 */
export class WriteStream {
  private data: string = '';
  private uri: vscode.Uri;
  private throttledWrite: () => void;

  constructor(filePath: string) {
    this.uri = vscode.Uri.file(filePath);
    this.throttledWrite = throttle(this.writeFile.bind(this), 1000);
  }

  /**
   * Appends data to the stream and schedules a throttled write
   */
  write(data: string): void {
    this.data += data;
    this.throttledWrite();
  }

  /**
   * Writes the accumulated data to the file
   */
  private writeFile(): void {
    fs.writeFile(this.uri, Buffer.from(this.data))
      .then(() => { },
        (error: Error) => console.error(`[M31 Mini] Error writing to file ${this.uri.fsPath}:`, error));
  }

  /**
   * Ensures all data is written and closes the stream
   */
  end(): void {
    this.writeFile();
  }
}

/**
 * Checks if a model supports reasoning capabilities
 * 
 * @param modelId - Model ID to check
 * @returns True if the model supports reasoning
 */
export const isReasoningModel = (modelId: string): boolean => REASONING_MODELS.includes(modelId);
