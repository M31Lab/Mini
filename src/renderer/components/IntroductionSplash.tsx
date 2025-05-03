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
      className={`flex flex-col justify-center gap-3 h-[calc(100vh-12em)] items-center px-2 pt-2 pb-16 w-full relative login-screen overflow-auto ${className}`}
    >
      {/* Header */}
      <div className="w-full flex justify-center flex-col items-center gap-1 mb-1">
        <div className="relative mb-1">
          <svg width="56" height="56" viewBox="0 0 128 128" className="fill-current text-gray-600 dark:text-gray-400">
            <path d="m102.8 24.8c0 8.2-2.3 16.4-5.1 23.8q-0.7 1.7-1.4 3.3c-0.2 0.4-1.3 2.9-1.6 3.2 0.1-0.5 1.4-5.1 1.7-6.1 0.5-2 1-4.2 1.4-6.2 1.4-7.4 3.2-18.9-0.3-26.1q-1.1-2.3-2.7-3.6c-4.8-3.9-12.5-0.2-16.8 2.6-1.6 1-3.2 2-4.6 3.2l-2.1 1.7c-0.4 0.3-0.7 0.6-1 0.9l-3.5 3.2c-0.2 0.2-0.3 0.2-0.5 0.4-0.4 0.4-0.6 0.6-1 1-0.7 0.7-3.9 4-4.6 5l-7.8 9.5c-0.5 0.7-1.1 1.4-1.6 2.2-1 1.3-2.4 3.2-3.2 4.5q-0.2 0.3-0.4 0.6c-0.9 1.2-0.3 0.3-1.1 1.7l-1.5 2.4c-3.1 4.7-5.8 9.5-8.5 14.6-1 1.9-2.9 5.7-3.8 7.7-0.2 0.6-0.9 2.3-1.2 2.7 0-0.6 0.8-3.2 1.1-3.9 1.3-4.1 2.1-6.6 3.9-10.9 2-4.7 4.2-9.2 6.5-13.4 0.2-0.2 0.3-0.4 0.5-0.7 0.2-0.3 0.3-0.5 0.5-0.7 0.1-0.4 0.3-0.9 0.8-1.7 0.4-0.5 0.6-0.9 0.9-1.5 3.1-5.1 6.4-9.6 10-14.2l1.4-1.7c0.7-0.9 2.1-2.4 2.9-3.3 0.3-0.3 0.3-0.4 0.6-0.7 1.5-1.4 2.6-2.8 4.3-4.3 0.3-0.2 0.4-0.4 0.7-0.6l2.6-2.4c0.5-0.3 0.9-0.7 1.4-1.1 3.8-2.9 7.6-5.7 12.4-7.4 2.8-1 5.1-1.5 8.5-1.4 1.2 0.1 1.6 0.3 2.5 0.5l2.3 0.9 1.5 1c0.3 0.2 0.3 0.4 0.6 0.6 0.8 0.6 0.6 0.5 1 0.9l0.8 1c0.2 0.2 0.4 0.6 0.6 0.8 0.1 0.2 0.2 0.5 0.3 0.8 0.4 0.6 0.1-0.1 0.5 0.8 0.3 0.7 0.4 0.6 0.7 1.8 0.9 2.6 1.4 5.5 1.4 8.6z" />
            <path d="m68.1 86.7h6.2c2.8 0 5.6-0.2 8.3-0.4 2.4-0.1 4-0.3 6.1-0.4 1-0.1 1.8-0.3 2.4-0.2-0.3 0.1-1.3 0.3-1.8 0.4-0.5 0.2-1.2 0.4-1.8 0.5-3.7 0.9-7.9 1.6-11.7 2.1-6.4 0.9-19.4 1.4-26.4 0.7-2.8-0.2-5.7-0.4-8.4-0.8-6-1.1-9.2-1.4-15.2-3.2-6.3-1.8-12.1-4.2-17.4-7.8l-2.5-2.1c-0.5-0.4-0.9-0.7-1.2-1.1-0.2-0.2-0.3-0.4-0.6-0.6l-1-1.2c-0.2-0.2-0.4-0.5-0.5-0.7-3.3-4.8-3.6-10.4 0.1-15.3 0.4-0.5 0.7-0.9 1.1-1.3 1-1.1 2.3-2.3 3.6-3.2 0.4-0.4 0.9-0.7 1.3-1 6.3-4.3 16.2-7 23.9-8.3 1.3-0.2 2.6-0.4 4-0.6 1-0.1 3.3-0.4 4.3-0.3l-7.2 1.9c-6.7 1.9-13.6 4.4-19.4 7.8-1.9 1.1-3.9 2.5-5.3 3.8-0.6 0.6-1.2 1-1.7 1.7-0.2 0.2-0.4 0.3-0.5 0.6-3.6 4.7-3.5 8.4 0.2 12.7 0.6 0.6 0.4 0.4 1.1 1.1l1.3 1.1c1.1 1 4.2 2.8 5.5 3.5 1.9 1.1 4.1 2 6.2 2.9 8.1 3.2 21.1 5.9 29.8 6.6 2.8 0.3 5.6 0.6 8.4 0.7 2.9 0.2 5.9 0.4 8.8 0.4z" />
            <path d="m102.9 94.8l0.2 2.6c0.8 7.4-0.4 17.6-7.1 21.5-1.6 1-4 1.7-6.3 1.6-5.4-0.3-9.3-2.5-13-5.1-0.5-0.3-0.8-0.5-1.2-0.8-2.4-1.9-3.3-2.7-5.4-4.7-0.3-0.3-0.5-0.6-0.9-1 0.2 0 3.7 2.5 4 2.6 3.9 2.6 9.2 5.4 14.1 5.9 9.1 1 11.6-6.6 11.6-14.9 0-7.4-1.9-15.2-3.9-21.7-2.7-8.7-7.1-19.1-11.5-27.2-2-3.8-4.6-8.6-7-12.3-1.2-1.9-2.4-3.9-3.7-5.9q-0.7-0.9-1.3-1.9c-0.5-0.6-2.6-3.5-2.7-3.8 0.3 0.1 2 1.9 2.3 2.2l2.3 2.4c1.8 1.9 4 4.9 5.6 6.8l2.7 3.6c0.4 0.6 0.9 1.2 1.3 1.8q1.2 1.8 2.4 3.7c0.4 0.7 0.8 1.2 1.2 1.9 2.1 3.5 3.7 6.1 5.6 10 1.5 3.1 2.6 5.2 3.9 8.4 1.6 3.8 3.8 10 4.8 13.9 0.6 2.4 1.6 6.5 1.8 9 0 0.5 0.2 1 0.2 1.4z" />
            <path d="m71.8 95c-0.1 0.7-3.6 5.6-4.6 6.9l-2.9 3.7c-1.3 1.4-4.4 4.7-5.7 5.8-0.7 0.5-1.7 1.5-2.7 2.2-0.9 0.8-1.7 1.4-2.8 2.2-2.5 1.7-5.4 3.4-8.8 4.5-8.5 2.7-14.8-0.4-17.5-6.9-2.2-5.2-1.8-11.6-0.6-17.2 0.2-0.8 0.5-1.7 0.7-2.6 0.1-0.3 0.6-2.3 0.8-2.5 0.1 0.1 0 4.9 0 5.4 0.1 1.8 0 3.7 0.2 5.5 0.6 5.7 2 13.2 8.4 14.5 6.3 1.3 15.2-4.7 20-8.2 1.7-1.2 7.6-6 8.7-7.2 0.2-0.1 0.2-0.2 0.4-0.3l3.4-3.1c0.2-0.3 0.4-0.4 0.7-0.6l0.8-0.8c0.2-0.2 1.2-1.2 1.5-1.3z" />
            <path d="m105.2 82c0.1-0.2 5.1-3.2 5.5-3.4 4.6-2.8 12.6-8.2 12.7-14.4 0-3.4-1.9-5.5-3.7-7.6-0.6-0.8-1.5-1.5-2.3-2.2-0.4-0.4-0.8-0.6-1.3-1-1.5-1.3-5.9-4.2-8.1-5.4-0.4-0.2-2.6-1.5-2.8-1.7 1.3-0.2 6.9 1.5 8.1 2 1.2 0.5 2.4 1 3.5 1.5 5.5 2.7 11.3 7.7 11.2 14.3-0.1 4-1.7 6.4-3.7 8.9-0.9 1-3.1 2.8-4.2 3.5-2 1.3-4.2 2.5-6.8 3.5-1.9 0.7-5.9 1.9-8.1 2z" />
            <path d="m58.7 19.5l-5.2-2.9c-1.8-1-3.5-1.8-5.4-2.6-3.2-1.6-9.2-3.5-13.1-1.8-3.9 1.7-5.4 5.8-6.2 9.9-1 4.7-1 10.1-1 15.1-0.2-0.1-0.1 0-0.2-0.3-0.1-0.1-0.1-0.3-0.2-0.5-2.7-7-3.8-16.9 0.1-23.5 0.6-1 1.5-2.2 2.2-2.8 1.3-1 1.4-1.1 3-2 4.8-2.4 11.2-0.5 15.5 2 1.7 1 2.3 1.5 3.7 2.5 0.2 0.2 0.4 0.3 0.7 0.6l2 1.7c0.2 0.2 0.4 0.4 0.6 0.6 0.6 0.5 3.3 3.4 3.5 4z" />
            <path fill-rule="evenodd" d="m54.4 68.8l2.3 4.1-1.9 3.4q-0.2 0.2-0.3 0.4c-2.1 3.2-6.4 4.3-9.8 2.3q-0.6-0.3-1.1-0.7-0.8-0.7-1.4-1.6c-1.4-2.1-1.6-4.9-0.5-7.3l3.5-6.2c1-1.6 2.2-2.8 4-3.4 3.1-1.2 7-0.1 8.7 2.8l3.8-6.6-1-1.7c-1.5-2.5-4.1-2.6-5.6 0l-1.7 3.1q-1.4-0.2-2.8 0-1.2 0.1-2.3 0.6l3.3-5.8c2.9-4.9 9.3-5.2 12.4-0.3 3.1-4.9 9.6-4.6 12.5 0.3l3.3 5.8q-1.2-0.5-2.4-0.6-1.3-0.2-2.7 0l-1.8-3.1c-1.4-2.6-4.1-2.5-5.5 0l-1 1.7 3.8 6.6c1.7-2.9 5.6-4 8.7-2.8 1.8 0.6 3 1.8 3.9 3.4l3.6 6.2c1.1 2.4 0.9 5.2-0.5 7.3q-0.6 0.9-1.5 1.6-0.4 0.4-1 0.7c-3.4 2-7.7 0.9-9.8-2.3q-0.2-0.2-0.3-0.4l-2-3.4 2.4-4.1 0.6 1 2.4 4.1c0.4 0.7 0.9 1.3 1.5 1.7 0.6 0.3 1.4 0.5 2.2 0.3q0.4-0.1 0.8-0.3l0.2-0.1c1-0.6 1.6-1.6 1.7-2.7q-0.1-1-0.9-2.4l-2.6-4.5c-0.6-1.2-1.1-2.2-2.6-2.5-1.3-0.3-2.7 0.3-3.6 1.8l-0.8 1.5-2.4 4-3 5.2-0.2 0.4c-0.7 1.2-1.8 2.2-3 2.8-1.2-0.6-2.2-1.6-2.9-2.8l-0.2-0.4-3-5.2-2.4-4-0.8-1.5c-0.9-1.5-2.3-2.1-3.6-1.8-1.6 0.3-2 1.3-2.7 2.5l-2.5 4.5q-0.8 1.4-0.9 2.4c0.1 1.1 0.7 2.1 1.7 2.7l0.2 0.1q0.4 0.2 0.8 0.3c0.8 0.2 1.6 0 2.2-0.3 0.6-0.4 1.1-1 1.5-1.7l2.4-4.1zm6.7-3.5l-0.9 1.4h0.1l0.8 1.4 2.9 5.2 3-5.2 0.8-1.4-0.8-1.4-3-5.2z" />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
          M31 Mini
        </h2>
        <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 mt-1 max-w-md">
          Production-grade AI coding assistant for VS Code
        </p>
      </div>

      {/* Rotating tips */}
      <div className="w-full max-w-md bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)] rounded-sm border border-tab-inactive/20 p-2 mb-1">
        <div className="flex items-center gap-1">
          <Icon name={IconName.Lightbulb} className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          <span className="text-[11px] font-medium">Tip</span>
        </div>
        <p className="text-[11px] mt-1 min-h-[2rem] text-gray-600 dark:text-gray-300">
          {TIPS[currentTip]}
        </p>
      </div>

      {/* Features grid with icons */}
      <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-2">
        {FEATURES.map((feature, index) => (
          <div
            key={index}
            className="feature-card bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)] rounded-sm border border-tab-inactive/20 p-2 hover:bg-[rgba(0,0,0,0.015)] dark:hover:bg-[rgba(255,255,255,0.015)] transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="p-0.5 rounded-sm bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] text-gray-500 dark:text-gray-400">
                <Icon name={IconName[feature.icon as keyof typeof IconName]} className="w-3 h-3" />
              </div>
              <h3 className="font-medium text-[11px] text-gray-700 dark:text-gray-300">{feature.title}</h3>
            </div>
            <p className="text-[9px] text-gray-500 dark:text-gray-400 pl-6">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Get started prompt */}
      <div className="mt-2 text-center">
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          Type a question below to get started
        </p>
        <div className="mt-0.5 flex justify-center">
          <Icon name={IconName.ArrowDown} className="w-3 h-3 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default IntroductionSplash;
