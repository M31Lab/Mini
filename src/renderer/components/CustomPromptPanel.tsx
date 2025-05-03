import React, { useState } from "react";
import Icon, { IconName } from "./Icon";

type PromptCategory = {
  category: string;
  prompts: string[];
};

type PromptEvent = (text: string) => void;

const PROMPT_STRINGS = {
  CLOSE: "Close",
  NEW: "New",
  NEW_FROM_TEMPLATE: "Templates"
};

const examplePrompts: PromptCategory[] = [
  { category: "Greetings", prompts: ["Hello", "Hi", "Hey"] },
  { category: "Farewells", prompts: ["Goodbye", "Bye", "See you later"] },
];

const CustomPromptManager = (): React.ReactElement => {
  const [prompts, setPrompts] = useState<string[]>(Array(6).fill(""));
  const [showTemplatePanel, setShowTemplatePanel] = useState<boolean>(false);

  const addPrompt = (text: string): void => {
    setPrompts([...prompts, text]);
  };

  const removePrompt = (index: number): void => {
    setPrompts(prompts.filter((_, i) => i !== index));
  };

  const updatePrompt = (index: number, newText: string): void => {
    setPrompts(prompts.map((p, i) => (i === index ? newText : p)));
  };

  const handleCloseTemplatePanel = (): void => {
    setShowTemplatePanel(false);
  };

  const handlePromptSelection = (promptText: string): void => {
    addPrompt(promptText);
    setShowTemplatePanel(false);
  };

  const handleAddNewPrompt = (): void => {
    addPrompt("");
  };

  const handleOpenTemplatePanel = (): void => {
    setShowTemplatePanel(true);
  };

  const handlePromptChange = (index: number, e: React.ChangeEvent<HTMLInputElement>): void => {
    updatePrompt(index, e.target.value);
  };

  const renderTemplatePanel = (): React.ReactElement | null => {
    if (!showTemplatePanel) { return null; }

    return (
      <div
        className="absolute top-0 left-0 w-full h-full bg-white dark:bg-gray-900 shadow-sm border border-tab-inactive/30 rounded-sm p-3 z-10"
        onClick={handleCloseTemplatePanel}
      >
        <div className="relative w-full h-full">
          <button
            className="absolute top-1 right-1 p-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-sm transition-colors"
            onClick={handleCloseTemplatePanel}
          >
            <Icon name={IconName.Close} className="w-3 h-3" />
          </button>
          {examplePrompts.map((categoryItem) => (
            <div key={categoryItem.category} className="mb-2">
              <h3 className="text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">{categoryItem.category}</h3>
              <ul className="pl-1">
                {categoryItem.prompts.map((promptText) => (
                  <li
                    key={promptText}
                    className="text-[11px] text-gray-600 dark:text-gray-400 cursor-pointer py-0.5 px-1 hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] rounded-sm transition-colors"
                    onClick={(): void => handlePromptSelection(promptText)}
                  >
                    {promptText}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPromptList = (): React.ReactElement => (
    <ul className="space-y-1.5 mb-2">
      {prompts.map((prompt, index) => (
        <li key={index} className="flex items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e): void => handlePromptChange(index, e)}
            className="border border-tab-inactive/30 py-1 px-1.5 text-[11px] rounded-sm w-full mr-1 text-gray-700 dark:text-gray-300 bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)] focus:outline-none focus:border-tab-inactive/60"
          />
          <button
            onClick={(): void => removePrompt(index)}
            className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-sm transition-colors"
            aria-label="Remove prompt"
          >
            <Icon name={IconName.Close} className="w-3 h-3" />
          </button>
        </li>
      ))}
    </ul>
  );

  const renderActionButtons = (): React.ReactElement => (
    <div className="flex gap-1.5">
      <button
        className="py-1 px-1.5 text-[11px] text-gray-600 dark:text-gray-300 bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(0,0,0,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] border border-tab-inactive/30 rounded-sm transition-colors flex items-center gap-1"
        onClick={handleAddNewPrompt}
      >
        <Icon name={IconName.Plus} className="w-2.5 h-2.5" />
        {PROMPT_STRINGS.NEW}
      </button>
      <button
        className="py-1 px-1.5 text-[11px] text-gray-600 dark:text-gray-300 bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(0,0,0,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] border border-tab-inactive/30 rounded-sm transition-colors flex items-center gap-1"
        onClick={handleOpenTemplatePanel}
      >
        <Icon name={IconName.More} className="w-2.5 h-2.5" />
        {PROMPT_STRINGS.NEW_FROM_TEMPLATE}
      </button>
    </div>
  );

  return (
    <div className="relative p-2">
      {renderTemplatePanel()}
      {renderPromptList()}
      {renderActionButtons()}
    </div>
  );
};

export default CustomPromptManager;
