import React, { ReactElement, useEffect, useState } from "react";
import Icon, { IconName } from "./Icon";

interface IntroductionSplashProps {
  vscode: any;
  className?: string;
}

const FEATURES = [
  {
    icon: "code",
    title: "Optimize & Debug",
    description: "Refactor and improve your code with AI assistance"
  },
  {
    icon: "file-text",
    title: "Generate Content",
    description: "Create tests, documentation, and more with ease"
  },
  {
    icon: "terminal",
    title: "Syntax Highlighting",
    description: "Automatic code highlighting for better readability"
  },
  {
    icon: "message-square",
    title: "Multiple Chats",
    description: "Run parallel conversations for different tasks"
  }
];

const TIPS = [
  "Select code and right-click to access M31 Mini actions",
  "Use Ctrl+Shift+A (Cmd+Shift+A on Mac) to generate code",
  "Try asking for code explanations or optimizations",
  "M31 Mini works with local LLMs for offline coding"
];

const IntroductionSplash = ({
  className,
}: IntroductionSplashProps): ReactElement => {
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`flex flex-col justify-center gap-6 h-[calc(100vh-12em)] items-center px-6 pt-4 pb-20 w-full relative login-screen overflow-auto ${className}`}
    >
      {/* Header with animated gradient */}
      <div className="w-full flex justify-center flex-col items-center gap-2 mb-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 blur-lg animate-pulse"></div>
          <div className="splash-logo">
            <Icon name={IconName.Logo} className="w-20 h-20 fill-current relative z-10" />
          </div>
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          M31 Mini
        </h2>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-1 max-w-md">
          Production-grade AI coding assistant for VS Code
        </p>
      </div>

      {/* Rotating tips */}
      <div className="w-full max-w-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-2 transition-all duration-500 ease-in-out">
        <div className="flex items-center gap-2">
          <Icon name={IconName.Lightbulb} className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-medium">Tip:</span>
        </div>
        <p className="text-sm mt-1 min-h-[2.5rem] transition-opacity duration-500">
          {TIPS[currentTip]}
        </p>
      </div>

      {/* Features grid with icons */}
      <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map((feature, index) => (
          <div
            key={index}
            className="feature-card group relative overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-700"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Icon name={IconName[feature.icon as keyof typeof IconName]} className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-sm">{feature.title}</h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 pl-10">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Get started prompt */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
          Type a question below to get started
        </p>
        <div className="mt-2 flex justify-center">
          <Icon name={IconName.ArrowDown} className="w-5 h-5 text-gray-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
};

export default IntroductionSplash;
