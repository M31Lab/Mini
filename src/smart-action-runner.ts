/// <reference lib="dom" />

import fs from "fs";
import sanitizeHtml from 'sanitize-html';
import upath from 'upath';
import { v4 as uuidv4 } from "uuid";
import vscode from 'vscode';
import { isReasoningModel, listItems } from "./helpers";
import ChatGptViewProvider from "./main";
import { ActionNames, ChatMessage, Conversation, Role } from "./renderer/types";

/**
 * Manages and executes AI-powered actions for the extension
 * 
 * This module handles complex operations that require AI assistance,
 * such as generating README files, .gitignore files, and conversation titles.
 */
export class ActionRunner {
  public mainProvider: ChatGptViewProvider;

  /**
   * Creates a new ActionRunner instance
   * 
   * @param chatgptViewProvider - The main provider for ChatGPT functionality
   */
  constructor(chatgptViewProvider: ChatGptViewProvider) {
    this.mainProvider = chatgptViewProvider;
  }

  /**
   * Runs a specific action with the given context and options
   * 
   * @param actionName - The name of the action to run
   * @param systemContext - The system context for the AI
   * @param controller - AbortController for canceling the action
   * @param options - Additional options for the action
   * @returns Promise resolving when the action completes
   * @throws Error if the action is not found
   */
  public runAction(
    actionName: ActionNames,
    systemContext: string,
    controller: AbortController,
    options?: unknown
  ): Promise<unknown> {
    const action = this.getAction(actionName);

    if (!action) {
      console.error(`[M31 Mini] Action ${actionName} not found`);
      throw new Error(`Action ${actionName} not found`);
    }

    return action.run(systemContext, controller, options ?? {});
  }

  /**
   * Gets the appropriate action implementation for the given action name
   * 
   * @param actionName - The name of the action to get
   * @returns The action implementation or undefined if not found
   */
  private getAction(actionName: ActionNames): Action | undefined {
    switch (actionName) {
      case ActionNames.createReadmeFromPackageJson:
        return new ReadmeFromPackageJSONAction(this);
      case ActionNames.createReadmeFromFileStructure:
        return new ReadmeFromFileStructure(this);
      case ActionNames.createGitignore:
        return new GitignoreAction(this);
      case ActionNames.createConversationTitle:
        return new RetitleAction(this);
      default:
        console.error(`[M31 Mini] Action ${actionName} not found`);
        return undefined;
    }
  }
}

/**
 * Base class for all actions
 * Provides common functionality for AI-powered actions
 */
abstract class Action {
  protected runner: ActionRunner;

  /**
   * Creates a new Action instance
   * 
   * @param runner - The ActionRunner instance
   */
  constructor(runner: ActionRunner) {
    this.runner = runner;
  }

  /**
   * Streams a chat completion from the AI
   * 
   * @param systemContext - The system context for the AI
   * @param prompt - The prompt to send to the AI
   * @param abortSignal - Signal for aborting the request
   * @yields Tokens from the AI response
   */
  protected async* streamChatCompletion(
    systemContext: string,
    prompt: string,
    abortSignal: AbortSignal
  ): AsyncGenerator<string, void, unknown> {
    const model = this.runner.mainProvider.model;

    // Create system message
    const systemMessage: ChatMessage = {
      id: uuidv4(),
      content: systemContext,
      rawContent: systemContext,
      role: Role.system,
      createdAt: Date.now(),
    };

    // Create user message
    const message: ChatMessage = {
      id: uuidv4(),
      content: prompt,
      rawContent: prompt,
      role: Role.assistant,
      createdAt: Date.now(),
    };

    // For reasoning models, we don't need to include the system message
    const messages = isReasoningModel(model.id) ? [message] : [systemMessage, message];

    // Create a temporary conversation for this request
    const conversation: Conversation = {
      id: uuidv4(),
      messages,
      createdAt: Date.now(),
      inProgress: true,
      model,
      autoscroll: true,
      tools: {},
    };

    // Stream the response
    for await (const token of this.runner.mainProvider.api.streamChatCompletion(conversation, abortSignal)) {
      yield token;
    }
  }

  /**
   * Runs the action
   * 
   * @param systemContext - The system context for the AI
   * @param controller - AbortController for canceling the action
   * @param options - Additional options for the action
   * @returns Promise resolving when the action completes
   */
  public abstract run(
    systemContext: string,
    controller: AbortController,
    options?: unknown
  ): Promise<unknown>;
}

/**
 * Action for generating a README.md file from package.json
 */
class ReadmeFromPackageJSONAction extends Action {
  /**
   * Generates a README.md file based on package.json contents
   * 
   * @param systemContext - The system context for the AI
   * @param controller - AbortController for canceling the action
   * @returns Promise resolving when the README is generated
   */
  public async run(
    systemContext: string,
    controller: AbortController
  ): Promise<void> {
    if (!vscode.workspace.workspaceFolders) {
      throw new Error('No workspace folder found.');
    }

    const currentProjectDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const readmePath = upath.join(currentProjectDir, 'README.md');

    // Check if README.md already exists
    if (fs.existsSync(readmePath)) {
      throw new Error('README.md already exists.');
    }

    // Create and open an empty README.md file
    fs.writeFileSync(readmePath, '');
    const document = await vscode.workspace.openTextDocument(readmePath);
    await vscode.window.showTextDocument(document);

    // Look for package.json
    const packageJsonPath = upath.join(currentProjectDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found.');
    }

    // Extract package.json data
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const {
      name,
      displayName,
      license,
      description,
      repository,
      scripts,
      dependencies,
      devDependencies,
      homepage,
      engines,
      main
    } = packageJson;

    // Check for package-lock.json
    const lockfile = fs.existsSync(upath.join(currentProjectDir, 'package-lock.json'))
      ? 'package-lock.json'
      : '';

    // Get project files and folders
    let filesAndFolders = await listItems(currentProjectDir);
    filesAndFolders = filesAndFolders.map(
      (fileOrFolder: string) => fileOrFolder.replace(`${currentProjectDir}/`, '')
    );

    // Try to extract repository URL from git config
    let repositoryUrl = '';
    const gitConfigPath = upath.join(currentProjectDir, '.git/config');

    if (fs.existsSync(gitConfigPath)) {
      try {
        const gitConfigContents = fs.readFileSync(gitConfigPath, 'utf8');
        const matches = gitConfigContents.match(/\[remote "origin"\]\s*url\s*=\s*(.*)/);
        if (matches) {
          repositoryUrl = matches[1];
        }
      } catch (error) {
        console.error('[M31 Mini] Error reading git config:', error);
      }
    }

    // Create prompt for the AI
    const prompt = `Generate a README.md GitHub markdown file for a project based on the following details:
    - Name: ${displayName || name}
    - Description: ${description}${repositoryUrl ? `
    - Repository URL: ${repositoryUrl}` : ''}
    - License: ${license}
    - Repository: ${repository?.url}
    - Version: ${packageJson.version}
    - Scripts: ${JSON.stringify(scripts)}
    - Dependencies: ${JSON.stringify(dependencies)}
    - Dev Dependencies: ${JSON.stringify(devDependencies)}
    - Homepage: ${homepage}
    - Engines: ${JSON.stringify(engines)}
    - Main: ${main}
    - Lockfile: ${lockfile}
    - Files/folders in this project: ${JSON.stringify(filesAndFolders)}
    `;

    // Create system context for the AI
    const systemContextModified = `Using the information provided in the package.json file and the details about the files in the project directory, please generate a comprehensive and well-structured README.md file in GitHub markdown for the project. Include the following sections:
- Project Title and Description: Extract the project name and a brief description from the package.json file. Also optionally include badges for the project's license, version, and build status.
- Table of Contents: Create a table of contents with clickable links to the different sections of the README.
- Installation: Provide clear instructions on how to install the project and its dependencies, using the information from the package.json file.
- Usage: Explain how to use the project, including any available commands or scripts found in the package.json file.
- Project Overview: Describe the organization of the project files and their respective functions, only include important subdirectories. Do not include every single file, but rather the most important ones.
- Contributing: Explain how others can contribute to the project, including any contribution guidelines or best practices.
- Testing: If applicable, provide instructions for running tests, using the information from the package.json file.
- License: Include the project's license information, as specified in the package.json file.
- Acknowledgements: Mention any noteworthy contributors, libraries, or frameworks used in the project.
Please ensure the README.md file is well-formatted, easy to read, and provides all necessary information for users to understand, install, and utilize the project effectively.`;

    // Create write stream for the README.md file
    const writeStream = fs.createWriteStream(readmePath, 'utf8');

    try {
      // Stream AI response to the file
      for await (const token of this.streamChatCompletion(systemContextModified, prompt, controller.signal)) {
        writeStream.write(token);
      }
    } catch (error) {
      console.error('[M31 Mini] Error generating README:', error);
    } finally {
      // Ensure the write stream is closed
      writeStream.end();
    }
  }
}

/**
 * Action for generating a README.md file from file structure
 */
class ReadmeFromFileStructure extends Action {
  /**
   * Generates a README.md file based on project file structure
   * 
   * @param systemContext - The system context for the AI
   * @param controller - AbortController for canceling the action
   * @returns Promise resolving when the README is generated
   */
  public async run(
    systemContext: string,
    controller: AbortController
  ): Promise<void> {
    if (!vscode.workspace.workspaceFolders) {
      throw new Error('No workspace folder found.');
    }

    const currentProjectDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const readmePath = upath.join(currentProjectDir, 'README.md');

    // Check if README.md already exists
    if (fs.existsSync(readmePath)) {
      throw new Error('README.md already exists.');
    }

    // Create and open an empty README.md file
    fs.writeFileSync(readmePath, '');
    const document = await vscode.workspace.openTextDocument(readmePath);
    await vscode.window.showTextDocument(document);

    // Get project files and folders
    let filesAndFolders = await listItems(currentProjectDir);
    filesAndFolders = filesAndFolders.map(
      (fileOrFolder: string) => fileOrFolder.replace(`${currentProjectDir}/`, '')
    );

    // Try to extract repository URL from git config
    let repositoryUrl = '';
    const gitConfigPath = upath.join(currentProjectDir, '.git/config');

    if (fs.existsSync(gitConfigPath)) {
      try {
        const gitConfigContents = fs.readFileSync(gitConfigPath, 'utf8');
        const matches = gitConfigContents.match(/\[remote "origin"\]\s*url\s*=\s*(.*)/);
        if (matches) {
          repositoryUrl = matches[1];
        }
      } catch (error) {
        console.error('[M31 Mini] Error reading git config:', error);
      }
    }

    // Check for package-lock.json
    const lockfile = fs.existsSync(upath.join(currentProjectDir, 'package-lock.json'))
      ? 'package-lock.json'
      : '';

    // Create prompt for the AI
    const prompt = `Generate a README.md GitHub markdown file for a project based on the following files/folders in this project: ${JSON.stringify(filesAndFolders)}

- Repository URL: ${repositoryUrl}
- Lockfile: ${lockfile}
`;

    // Create system context for the AI
    const systemContextModified = `Using the information provided from the project structure, generate a comprehensive and well-structured README.md file in GitHub markdown format. Organize the information into the following sections:
- Project Title and Description: Extract the project name and a brief description from the package.json file. Also optionally include badges for the project's license, version, and build status.
- Table of Contents: Create a table of contents with clickable links to the different sections of the README.
- Installation: Provide clear instructions on how to install the project and its dependencies, using the information from the package.json file.
- Usage: Explain how to use the project, including any available commands or scripts found in the package.json file.
- Project Overview: Describe the organization of the project files and their respective functions, only include important subdirectories. Do not include every single file, but rather the most important ones.
- Contributing: Explain how others can contribute to the project, including any contribution guidelines or best practices.
- Testing: If applicable, provide instructions for running tests, using the information from the package.json file.
- License: Include the project's license information, as specified in the package.json file.
- Acknowledgements: Mention any noteworthy contributors, libraries, or frameworks used in the project.
Please ensure the README.md file is well-formatted, easy to read, and provides all necessary information for users to understand, install, and utilize the project effectively.`;

    // Create write stream for the README.md file
    const writeStream = fs.createWriteStream(readmePath, 'utf8');

    try {
      // Stream AI response to the file
      for await (const token of this.streamChatCompletion(systemContextModified, prompt, controller.signal)) {
        writeStream.write(token);
      }
    } catch (error) {
      console.error('[M31 Mini] Error generating README:', error);
    } finally {
      // Ensure the write stream is closed
      writeStream.end();
    }
  }
}

/**
 * Action for generating a .gitignore file
 */
class GitignoreAction extends Action {
  /**
   * Generates a .gitignore file based on project contents
   * 
   * @param systemContext - The system context for the AI
   * @param controller - AbortController for canceling the action
   * @returns Promise resolving when the .gitignore is generated
   */
  public async run(
    systemContext: string,
    controller: AbortController
  ): Promise<void> {
    if (!vscode.workspace.workspaceFolders) {
      throw new Error('No workspace folder found.');
    }

    const currentProjectDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const packageJsonPath = upath.join(currentProjectDir, 'package.json');
    const gitignorePath = upath.join(currentProjectDir, '.gitignore');

    // Extract package.json data if available
    let packageJsonData: Record<string, unknown> = {};
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const installedPackages = Object.keys({
          ...packageJson.dependencies || {},
          ...packageJson.devDependencies || {}
        }).join(', ');

        packageJsonData = {
          installedPackages,
          homepage: packageJson.homepage,
          engines: packageJson.engines,
          main: packageJson.main,
        };
      } catch (error) {
        console.error('[M31 Mini] Error reading package.json:', error);
      }
    }

    // Check for package-lock.json
    const lockfile = fs.existsSync(upath.join(currentProjectDir, 'package-lock.json'))
      ? 'package-lock.json'
      : '';

    // Create and open the .gitignore file
    fs.writeFileSync(gitignorePath, '');
    const document = await vscode.workspace.openTextDocument(gitignorePath);
    await vscode.window.showTextDocument(document);

    // Get project files and folders, excluding hidden files and node_modules
    const filesAndFolders = (await listItems(currentProjectDir))
      .filter((f: string) => !/^\..*/.test(f) && !f.includes('node_modules'))
      .map((f: string) => f.replace(`${currentProjectDir}/`, ''));

    // Create prompt for the AI
    const prompt = `Specify any additional directories or files to ignore in your .gitignore file, separated by a space. Leave blank if none. Some details about the project:
    ${Object.keys(packageJsonData).length > 0 ? `
    - Installed Packages: ${packageJsonData.installedPackages}
    - Homepage: ${packageJsonData.homepage}
    - Engines: ${packageJsonData.engines}
    - Main: ${packageJsonData.main}
    ` : ''}
    - Lockfile: ${lockfile}
    - Files/folders in this project: ${JSON.stringify(filesAndFolders)}
    `;

    // Create system context for the AI
    const systemContextModified = `Please create a well-structured .gitignore file for a typical software development project. The file should include common patterns and file types to be excluded from version control, such as:

    Operating system and editor-specific files, like .DS_Store, Thumbs.db, and .vscode.
    If applicable for this project, compiled files, build, and distribution directories, including .class, .exe, .jar, .war, and /dist.
    Any log files, cache, or temporary files this type of project might generate during the development process.
    Sensitive data, like API keys, secrets, and configuration files containing sensitive information.
    Do not include package-lock.json in the .gitignore file.

Please ensure the .gitignore file is well-organized, easy to understand. The types of files in the .gitignore should be relevant to the project, and not just a generic list of common patterns.`;

    // Create write stream for the .gitignore file
    const writeStream = fs.createWriteStream(gitignorePath, 'utf8');

    try {
      // Stream AI response to the file
      for await (const token of this.streamChatCompletion(systemContextModified, prompt, controller.signal)) {
        writeStream.write(token);
      }
    } catch (error) {
      console.error('[M31 Mini] Error generating .gitignore:', error);
    } finally {
      // Ensure the write stream is closed
      writeStream.end();
    }
  }
}

/**
 * Action for generating a conversation title
 */
class RetitleAction extends Action {
  /**
   * Generates a title for a conversation
   * 
   * @param systemContext - The system context for the AI
   * @param controller - AbortController for canceling the action
   * @param options - Options containing the message text and conversation ID
   * @returns Promise resolving to the new title and conversation ID
   */
  public async run(
    systemContext: string,
    controller: AbortController,
    options: {
      messageText: string;
      conversationId: string;
    }
  ): Promise<{
    newTitle: string | undefined;
    conversationId: string;
  }> {
    if (!options.messageText) {
      throw new Error('No user message provided.');
    }

    const prompt = options.messageText;
    const systemContextModified = 'Derive a concise conversation title from the provided user question and assistant response. ONLY respond with a 2 or 3 word title. For context, conversations are normally about software development. Shorter is better. Prepend an appropriate emoji to the title.';
    let title = '';

    try {
      // Collect the AI response
      for await (const token of this.streamChatCompletion(systemContextModified, prompt, controller.signal)) {
        title += token;
      }
    } catch (error) {
      console.error('[M31 Mini] Error generating conversation title:', error);
    }

    // Clean up the title
    title = title.trim()
      // Remove quotes
      .replace(/"/g, '')
      // Remove markdown formatting
      .replace(/`/g, '')
      .replace(/\*/g, '')
      .replace(/_/g, '')
      .replace(/#/g, '');

    // Remove HTML tags
    title = sanitizeHtml(title, {
      allowedTags: [],
      allowedAttributes: {}
    }) ?? '';

    // If the title matches the format "<text>:<text>", only show text after the colon
    title = title.replace(/.*:/, '');

    // Truncate to 25 characters
    title = title.slice(0, 25);

    return {
      // Return undefined if the title is empty or too short (keeps the existing title)
      newTitle: title === '' || title.length < 3 ? undefined : title,
      conversationId: options.conversationId
    };
  }
}
