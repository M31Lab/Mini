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
      className={`flex flex-col justify-center gap-4 h-[calc(100vh-12em)] items-center px-4 pt-2 pb-16 w-full relative login-screen overflow-auto ${className}`}
    >
      {/* Header */}
      <div className="w-full flex justify-center flex-col items-center gap-1 mb-2">
        <div className="relative mb-1">
          <Icon name={IconName.Logo} className="w-14 h-14 fill-current" />
        </div>
        <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200">
          M31 Mini
        </h2>
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1 max-w-md">
          Production-grade AI coding assistant for VS Code
        </p>
      </div>

      {/* Rotating tips */}
      <div className="w-full max-w-lg bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] rounded-sm border border-tab-inactive/20 p-3 mb-1">
        <div className="flex items-center gap-2">
          <Icon name={IconName.Lightbulb} className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-xs font-medium">Tip:</span>
        </div>
        <p className="text-xs mt-1 min-h-[2.5rem] text-gray-600 dark:text-gray-300">
          {TIPS[currentTip]}
        </p>
      </div>

      {/* Features grid with icons */}
      <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-2">
        {FEATURES.map((feature, index) => (
          <div
            key={index}
            className="feature-card bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)] rounded-sm border border-tab-inactive/20 p-3 hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded-sm bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.03)] text-gray-500 dark:text-gray-400">
                <Icon name={IconName[feature.icon as keyof typeof IconName]} className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-medium text-xs">{feature.title}</h3>
            </div>
            <p className="text-[9px] text-gray-500 dark:text-gray-400 pl-6">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Get started prompt */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Type a question below to get started
        </p>
        <div className="mt-1 flex justify-center">
          <Icon name={IconName.ArrowDown} className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default IntroductionSplash;
