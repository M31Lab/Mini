import React, { useState } from "react";
import { useAppSelector } from "../hooks";
import { RootState } from "../store";

type PromptCategory = {
  category: string;
  prompts: string[];
};

type PromptEvent = (text: string) => void;

const PROMPT_STRINGS = {
  CLOSE: "Close",
  NEW: "New",
  NEW_FROM_TEMPLATE: "New from Template"
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
    if (!showTemplatePanel) return null;

    return (
      <div
        className="absolute top-0 left-0 w-full h-full bg-gray-200 p-4 z-10"
        onClick={handleCloseTemplatePanel}
      >
        <div className="relative w-full h-full p-4">
          <button
            className="absolute top-0 right-0 p-2"
            onClick={handleCloseTemplatePanel}
          >
            {PROMPT_STRINGS.CLOSE}
          </button>
          {examplePrompts.map((categoryItem) => (
            <div key={categoryItem.category}>
              <h3>{categoryItem.category}</h3>
              <ul>
                {categoryItem.prompts.map((promptText) => (
                  <li
                    key={promptText}
                    className="cursor-pointer"
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
    <ul>
      {prompts.map((prompt, index) => (
        <li key={index} className="flex items-center mb-2">
          <input
            type="text"
            value={prompt}
            onChange={(e): void => handlePromptChange(index, e)}
            className="border-2 border-gray-300 p-2 rounded-sm w-full mr-2"
          />
          <button
            onClick={(): void => removePrompt(index)}
            className="bg-red-500 text-white p-2 rounded"
          >
            X
          </button>
        </li>
      ))}
    </ul>
  );

  const renderActionButtons = (): React.ReactElement => (
    <>
      <button
        className="bg-blue-500 text-white p-2 rounded mr-2"
        onClick={handleAddNewPrompt}
      >
        {PROMPT_STRINGS.NEW}
      </button>
      <button
        className="bg-green-500 text-white p-2 rounded"
        onClick={handleOpenTemplatePanel}
      >
        {PROMPT_STRINGS.NEW_FROM_TEMPLATE}
      </button>
    </>
  );

  return (
    <div className="relative">
      {renderTemplatePanel()}
      {renderPromptList()}
      {renderActionButtons()}
    </div>
  );
};

export default CustomPromptManager;
