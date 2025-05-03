<div align="center">

# M31 Mini

<img src="https://raw.githubusercontent.com/M31Lab/Mini/master/images/m31icon.png" alt="M31 Mini Logo" width="128" height="128">

### Production-grade AI coding assistant for VS Code

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?style=for-the-badge)](https://github.com/m31-team/m31-mini/releases)
[![License: ISC](https://img.shields.io/badge/License-ISC-green.svg?style=for-the-badge)](LICENSE)
[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-007ACC?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=m31-team.m31-mini)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)

</div>

## 🚀 Features

Write, refactor, and improve your code in VS Code using AI. With M31 Mini, **you decide what AI you want to use**.

- 💻 **Code offline** with AI using a local LLM
- 🔄 **Enhanced API support** for [OpenRouter.ai](https://openrouter.ai), [OpenAI](https://openai.com), and [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service/)
- 🏠 **Local model support** for [ollama](https://github.com/ollama/ollama), [text-generation-webui](https://github.com/oobabooga/text-generation-webui), and [LocalAI](https://localai.io/)
- 🛠️ **Powerful coding tools** including code generation, optimization, and explanation
- ✨ **Real-time code suggestions** similar to GitHub Copilot as you type
- 🎨 **Clean, intuitive UI** that integrates seamlessly with VS Code

## 📋 M31 Production Ruleset

M31 Mini follows strict M31 production ruleset standards:

| Standard | Description |
|----------|-------------|
| **Self-documenting code** | All code is written to be self-explanatory with no comments |
| **Strict type annotations** | All functions have explicit return types |
| **No implicit any** | TypeScript code uses explicit type declarations |
| **Layered architecture** | Clean separation between frontend and backend modules |
| **Functional decomposition** | Smaller, testable units for better maintainability |

This ensures high-quality, maintainable, and production-ready code.

## 📥 Installation

### VS Code Marketplace

[![Install from VS Code Marketplace](https://img.shields.io/badge/Install-VS%20Code%20Marketplace-007ACC?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=m31-team.m31-mini)

Search for "M31 Mini" in the VS Code extension search.

### Manual Build

Or build this extension yourself [(see Development section)](#-development).

## 📸 Screenshots

<div align="center">
  <table>
    <tr>
      <td align="center">
        <h3>A clean chat interface</h3>
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/m31-team/m31-mini/main/screenshot-1-dark.png">
          <img alt="M31 Mini extension in use within VS Code, displaying a chat interface." src="https://raw.githubusercontent.com/m31-team/m31-mini/main/screenshot-1-light.png" width="100%">
        </picture>
      </td>
      <td align="center">
        <h3>Easy presets for popular LLMs</h3>
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/m31-team/m31-mini/main/screenshot-2-dark.png">
          <img alt="M31 Mini extension's 'LLM Settings' interface for connecting to an official OpenAI API." src="https://raw.githubusercontent.com/m31-team/m31-mini/main/screenshot-2-light.png" width="100%">
        </picture>
      </td>
    </tr>
    <tr>
      <td align="center">
        <h3>Rich model picker for APIs</h3>
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/m31-team/m31-mini/main/screenshot-3-dark.png">
          <img alt="M31 Mini extension's model picker interface displaying a dropdown list of available models when using an API like OpenRouter.ai." src="https://raw.githubusercontent.com/m31-team/m31-mini/main/screenshot-3-light.png" width="100%">
        </picture>
      </td>
      <td align="center">
        <h3>Recent data with online models</h3>
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/m31-team/m31-mini/main/screenshot-4-dark.png">
          <img alt="M31 Mini extension showing a chat interface with online model capabilities." src="https://raw.githubusercontent.com/m31-team/m31-mini/main/screenshot-4-light.png" width="100%">
        </picture>
      </td>
    </tr>
  </table>
</div>

## ✨ Real-time Code Suggestions

M31 Mini now includes GitHub Copilot-like functionality that provides real-time code suggestions as you type:

- **Inline suggestions**: See AI-generated code completions directly in your editor
- **Ghost text**: Suggestions appear as ghost text that you can accept with Tab
- **Multi-language support**: Works with JavaScript, TypeScript, Python, Java, C/C++, C#, Go, Ruby, PHP, and Rust
- **Configurable**: Enable/disable features and customize behavior in settings

To use this feature:
1. Just start typing in a supported language file
2. When a suggestion appears as ghost text, press Tab to accept it
3. Configure behavior in Settings under "M31 Mini > Inline Suggestions"

## 🔌 Compatible AI Providers

Any tool that is "compatible" with the OpenAI API should work with this extension. The tools listed below are the ones we have personally tested.

### Local LLMs

| Provider | Status | Link |
|----------|--------|------|
| ✅ **ollama** | Tested & Working | [GitHub](https://github.com/ollama/ollama) |
| ✅ **text-generation-webui** | Tested & Working | [GitHub](https://github.com/oobabooga/text-generation-webui) |
| ✅ **LocalAI** | Tested & Working | [Website](https://localai.io/) |

### Cloud APIs

| Provider | Status | Link |
|----------|--------|------|
| ✅ **OpenRouter** | Tested & Working | [Website](https://openrouter.ai/) |
| ✅ **Azure OpenAI Service** | Tested & Working | [Website](https://azure.microsoft.com/en-us/products/ai-services/openai-service/) |
| ✅ **OpenAI** | Tested & Working | [Website](https://openai.com) |

### Proxies

We've set up a proxy for anyone that needs it at `https://openai-proxy.dev/v1`. It's running [x-dr/chatgptProxyAPI](https://github.com/x-dr/chatgptProxyAPI) code on CloudFlare Workers. This is mainly for anyone who wants to use OpenAI, but cannot due to api.openai.com being blocked in your region.

## 📝 Changelog

See the [CHANGELOG](CHANGELOG.md) for a list of past updates and upcoming unreleased features.

## 🛠️ Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher)
- [Yarn](https://yarnpkg.com/) (v1.22.19 or higher)
- [VS Code](https://code.visualstudio.com/) (v1.70.0 or higher)

### Clone this repo

```bash
git clone https://github.com/m31-team/m31-mini.git
cd m31-mini
```

### Setup

```bash
yarn
```

### Build the extension

```bash
yarn run build
```

### Test new features in VS Code

To test the M31 Mini extension in VS Code:

1. Open the project directory in VS Code
2. Start a new Extension Development Host:
   - Press <kbd>F5</kbd>, or
   - Select <kbd>Run</kbd> > <kbd>Start Debugging</kbd> in the top menu
3. In the new VS Code window, test the extension
4. Use the **Debug Console** in the main VS Code window to view logs and errors
5. **To make changes** to the extension:
   - Edit the code (VS Code will automatically rebuild using `yarn run watch`)
   - Reload the extension with <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F5</kbd> (or <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>F5</kbd> on macOS)

### Package for VS Code

```bash
yarn run package # Runs `vsce package`
```

## 🧰 Tech Stack

<div align="center">

[![Yarn](https://img.shields.io/badge/Yarn-2C8EBB?style=for-the-badge&logo=yarn&logoColor=white)](https://yarnpkg.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![VS Code API](https://img.shields.io/badge/VS%20Code%20API-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)](https://code.visualstudio.com/api)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Redux](https://img.shields.io/badge/Redux-764ABC?style=for-the-badge&logo=redux&logoColor=white)](https://redux.js.org/)
[![React Router](https://img.shields.io/badge/React%20Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)](https://reactrouter.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

This extension has a custom UI with React + TailwindCSS, but theme support and remaining consistent with VS Code's UI components is still a priority.

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by the [M31 Team](https://github.com/m31-team)

</div>
