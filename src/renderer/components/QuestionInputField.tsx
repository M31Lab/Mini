import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import {
  isInstructModel,
  isReasoningModel,
  useIsModelAvailable,
  useMaxCost,
} from "../helpers";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../send-to-backend";
import { RootState } from "../store";
import { setUseEditorSelection } from "../store/app";
import {
  clearMessages,
  setAutoscroll,
  setInProgress,
  updateUserInput,
} from "../store/conversation";
import { Conversation, MODEL_TOKEN_LIMITS } from "../types";
import Icon, { IconName } from "./Icon";
import TokenCountPopup from "./TokenCountPopup";

const INPUT_STRINGS = {
  THINKING: "Thinking...",
  STREAMING_INSTRUCT: "(streaming is disabled on instruct models)",
  STREAMING_REASONING: "(streaming not yet supported on reasoning models)",
  ASK_QUESTION: "Ask a question...",
  STOP: "Stop",
  ASK: "Ask",
  SELECT_MODEL_FIRST: "Select a model first",
  USE_EDITOR_SELECTION: "Editor selection",
  USE_EDITOR_SELECTION_SHORT: "Editor",
  CLEAR: "Clear",
  MORE_ACTIONS: "More Actions",
  EDITOR_TOOLTIP: "Include the code selected in your editor in the prompt?",
  CLEAR_TOOLTIP: "Clear all messages from conversation"
};

type QuestionInputFieldProps = {
  conversation: Conversation;
  conversationList: Conversation[];
  vscode: any;
};

const QuestionInputField = ({
  conversation: currentConversation,
  conversationList,
  vscode,
}: QuestionInputFieldProps): React.ReactElement => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );
  const viewOptions = useAppSelector(
    (state: RootState) => state.app.viewOptions
  );
  const questionInputRef = React.useRef<HTMLTextAreaElement>(null);
  const [showMoreActions, setShowMoreActions] = useState<boolean>(false);
  const useEditorSelection = useAppSelector(
    (state: RootState) => state.app.useEditorSelection
  );
  const [showTokenBreakdown, setShowTokenBreakdown] = useState<boolean>(false);
  const tokenCountRef = React.useRef<HTMLDivElement>(null);
  const [tokenCountLabel, setTokenCountLabel] = useState<string>("0");
  const maxCost = useMaxCost(currentConversation);
  const [tokenCountAnimation, setTokenCountAnimation] = useState<boolean>(false);
  const tokenCountAnimationTimer = useRef<number | null>(null);
  const backendMessenger = useMessenger(vscode);
  const models = useAppSelector((state: RootState) => state.app.models);

  const showEditorSelection = useAppSelector(
    (state: RootState) => state.app.viewOptions.showEditorSelection
  );
  const showModelSelect = useAppSelector(
    (state: RootState) => state.app.viewOptions.showModelSelect
  );
  const showVerbosity = useAppSelector(
    (state: RootState) => state.app.viewOptions.showVerbosity
  );
  const showClear = useAppSelector(
    (state: RootState) => state.app.viewOptions.showClear
  );
  const showTokenCount = useAppSelector(
    (state: RootState) => state.app.viewOptions.showTokenCount
  );
  const isCurrentModelAvailable = useIsModelAvailable(
    models,
    currentConversation?.model
  );

  useEffect((): (() => void) => {
    if (tokenCountAnimationTimer.current) {
      clearTimeout(tokenCountAnimationTimer.current);
    }

    setTokenCountAnimation(true);

    tokenCountAnimationTimer.current = window.setTimeout(() => {
      setTokenCountAnimation(false);
    }, 500);

    return (): void => {
      if (tokenCountAnimationTimer.current) {
        clearTimeout(tokenCountAnimationTimer.current);
      }
    };
  }, [tokenCountLabel]);

  useEffect((): void => {
    if (questionInputRef.current && conversationList.length > 1) {
      questionInputRef.current.focus();
      questionInputRef.current.value = currentConversation?.userInput ?? "";
    }
  }, [currentConversation.id, conversationList.length, currentConversation?.userInput]);

  const askQuestion = (): void => {
    if (!isCurrentModelAvailable) {
      return;
    }

    const question = questionInputRef?.current?.value;

    if (question && question.length > 0) {
      dispatch(
        setInProgress({
          conversationId: currentConversation.id,
          inProgress: true,
        })
      );

      backendMessenger.sendAddFreeTextQuestion({
        conversation: currentConversation,
        question: questionInputRef.current.value,
        includeEditorSelection: useEditorSelection,
      });

      questionInputRef.current.value = "";
      questionInputRef.current.rows = 1;

      dispatch(
        updateUserInput({
          conversationId: currentConversation.id,
          userInput: "",
        })
      );

      dispatch(
        setAutoscroll({
          conversationId: currentConversation.id,
          autoscroll: true,
        })
      );

      if (useEditorSelection) {
        dispatch(setUseEditorSelection(false));
      }

      if (questionInputRef?.current?.parentNode) {
        (
          questionInputRef.current.parentNode as HTMLElement
        ).dataset.replicatedValue = "";
      }
    }
  };

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>): void => {
    const target = e.target as HTMLTextAreaElement;
    if (target?.parentNode) {
      (target.parentNode as HTMLElement).dataset.replicatedValue = target.value;
    }
  };

  const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !(event.nativeEvent as any).isComposing
    ) {
      event.preventDefault();
    }
  };

  const handleTextareaKeyUp = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    const question = questionInputRef?.current?.value;

    dispatch(
      updateUserInput({
        conversationId: currentConversation.id,
        userInput: question ?? "",
      })
    );

    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !(event.nativeEvent as any).isComposing
    ) {
      askQuestion();
    } else if (
      event.key === "Enter" &&
      event.shiftKey &&
      !(event.nativeEvent as any).isComposing
    ) {
      const target = event.target as HTMLTextAreaElement;
      if (target?.parentNode) {
        (target.parentNode as HTMLElement).dataset.replicatedValue = target.value;
      }
    }
  };

  const handleStopGeneration = (): void => {
    backendMessenger.sendStopGenerating(currentConversation.id);
    dispatch(
      setInProgress({
        conversationId: currentConversation.id,
        inProgress: false,
      })
    );
  };

  const handleClearMessages = (): void => {
    dispatch(
      clearMessages({
        conversationId: currentConversation.id,
      })
    );
  };

  const handleMoreActionsToggle = (): void => {
    setShowMoreActions(!showMoreActions);
  };

  const handleMoreActionsKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (e.key === "Escape") {
      setShowMoreActions(false);
    } else if (e.key === "ArrowDown") {
      setShowMoreActions(true);
      const firstElem = document.querySelector(
        "#more-actions-menu ul li"
      ) as HTMLElement;
      if (firstElem) {
        firstElem.focus();
      }
    } else if (e.key === "ArrowUp") {
      setShowMoreActions(true);
      const lastElem = document.querySelector(
        "#more-actions-menu ul li:last-child"
      ) as HTMLElement;
      if (lastElem) {
        lastElem.focus();
      }
    } else if (e.key === "Space") {
      setShowMoreActions(!showMoreActions);
    }
  };

  const handleEditorSelectionToggle = (): void => {
    dispatch(setUseEditorSelection(!useEditorSelection));
  };

  const handleTokenCountMouseEnter = (): void => {
    setShowTokenBreakdown(true);
  };

  const handleTokenCountMouseLeave = (): void => {
    setShowTokenBreakdown(false);
  };

  const handleTokenCountKeyUp = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === "Escape") {
      setShowTokenBreakdown(false);
    } else if (e.key === "Space") {
      setShowTokenBreakdown(!showTokenBreakdown);
    }
  };

  const getMaxModelTokenLimit = (): number => {
    const modelId = currentConversation.model?.id ?? "gpt-4-turbo";
    return MODEL_TOKEN_LIMITS.has(modelId)
      ? MODEL_TOKEN_LIMITS.get(modelId)?.context ?? 128000
      : 128000;
  };

  const isTokenCountExceedingLimit = (): boolean => {
    return parseInt(tokenCountLabel) > getMaxModelTokenLimit();
  };

  const renderThinkingState = (): React.ReactElement => (
    <div className="flex flex-row items-center text-xs px-2 py-2 rounded-sm text-gray-500 w-full">
      <span className="mr-2">Thinking</span>
      <span className="flex items-center">
        <span className="w-1 h-1 bg-gray-400 rounded-full animate-pulse mx-0.5"></span>
        <span className="w-1 h-1 bg-gray-400 rounded-full animate-pulse mx-0.5" style={{ animationDelay: "300ms" }}></span>
        <span className="w-1 h-1 bg-gray-400 rounded-full animate-pulse mx-0.5" style={{ animationDelay: "600ms" }}></span>
      </span>
      {isInstructModel(currentConversation.model) && (
        <span className="text-[9px] opacity-50 ml-2">
          {INPUT_STRINGS.STREAMING_INSTRUCT}
        </span>
      )}
      {isReasoningModel(currentConversation.model) && (
        <span className="text-[9px] opacity-50 ml-2">
          {INPUT_STRINGS.STREAMING_REASONING}
        </span>
      )}
    </div>
  );

  const renderQuestionInput = (): React.ReactElement => (
    <textarea
      rows={1}
      className="text-sm p-2 rounded-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 resize-none w-full outline-none placeholder-gray-400 dark:placeholder-gray-500 whitespace-pre-wrap font-mono"
      id="question-input"
      placeholder={INPUT_STRINGS.ASK_QUESTION}
      ref={questionInputRef}
      disabled={currentConversation.inProgress}
      onInput={handleTextareaInput}
      onKeyDown={handleTextareaKeyDown}
      onKeyUp={handleTextareaKeyUp}
    ></textarea>
  );

  const renderStopButton = (): React.ReactElement => (
    <button
      title="Stop generation"
      className="px-2 py-1 h-full flex flex-row items-center gap-1 bg-transparent text-gray-600 dark:text-gray-300 hover:bg-button-hover/10 rounded-sm transition-colors"
      onClick={handleStopGeneration}
    >
      <Icon name={IconName.Cancel} className="w-4 h-4" />
      <span className="text-sm">{INPUT_STRINGS.STOP}</span>
    </button>
  );

  const renderAskButton = (): React.ReactElement => (
    <button
      title="Submit prompt"
      className={classNames(
        "ask-button rounded-sm px-2 py-1 flex flex-row items-center gap-1 text-gray-600 dark:text-gray-300 bg-transparent hover:bg-button-hover/10 transition-colors",
        {
          "opacity-50 cursor-not-allowed": !isCurrentModelAvailable,
        }
      )}
      onClick={askQuestion}
      disabled={
        currentConversation.inProgress || !isCurrentModelAvailable
      }
    >
      {isCurrentModelAvailable
        ? INPUT_STRINGS.ASK
        : INPUT_STRINGS.SELECT_MODEL_FIRST}
      <Icon name={IconName.Send} className="w-4 h-4 ml-1 hidden 2xs:block" />
    </button>
  );

  const renderEditorSelectionButton = (): React.ReactElement => (
    <button
      className={`rounded flex gap-1 items-center justify-start py-0.5 px-1 whitespace-nowrap
        ${useEditorSelection
          ? "bg-button text-button hover:bg-button-hover focus:bg-button-hover"
          : "hover:bg-button-secondary hover:text-button-secondary focus:text-button-secondary focus:bg-button-secondary"
        }
      `}
      data-tooltip-id="footer-tooltip"
      data-tooltip-content={INPUT_STRINGS.EDITOR_TOOLTIP}
      onMouseDown={handleEditorSelectionToggle}
      onClick={handleEditorSelectionToggle}
    >
      <Icon name={IconName.Plus} className="w-3 h-3 hidden 2xs:block" />
      <span className="hidden 2xs:block">
        {INPUT_STRINGS.USE_EDITOR_SELECTION}
      </span>
      <span className="block 2xs:hidden">
        {INPUT_STRINGS.USE_EDITOR_SELECTION_SHORT}
      </span>
    </button>
  );

  const renderClearButton = (): React.ReactElement => (
    <button
      className="rounded flex gap-1 items-center justify-start py-0.5 px-1 hover:bg-button-secondary hover:text-button-secondary focus:text-button-secondary focus:bg-button-secondary"
      data-tooltip-id="footer-tooltip"
      data-tooltip-content={INPUT_STRINGS.CLEAR_TOOLTIP}
      onClick={handleClearMessages}
    >
      <Icon name={IconName.Cancel} className="w-3 h-3 hidden 2xs:block" />
      {INPUT_STRINGS.CLEAR}
    </button>
  );

  const renderTokenCounter = (): React.ReactElement => (
    <div
      className={`rounded flex gap-1 items-center text-[9px] px-1 py-0.5 text-gray-500 hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] rounded-sm transition-colors`}
      ref={tokenCountRef}
      tabIndex={0}
      onMouseEnter={handleTokenCountMouseEnter}
      onMouseLeave={handleTokenCountMouseLeave}
      onFocus={handleTokenCountMouseEnter}
      onBlur={handleTokenCountMouseLeave}
      onKeyUp={handleTokenCountKeyUp}
    >
      <span className={isTokenCountExceedingLimit() ? "text-red-500" : ""}>≤ ${maxCost?.toFixed(2) ?? "???"}</span>
      <TokenCountPopup
        showTokenBreakdown={showTokenBreakdown}
        currentConversation={currentConversation}
        conversationList={conversationList}
        setTokenCountLabel={setTokenCountLabel}
        vscode={vscode}
      />
    </div>
  );

  const renderMoreActionsButton = (): React.ReactElement => (
    <button
      className="text-[9px] px-1 py-0.5 flex gap-1 items-center justify-start whitespace-nowrap hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] rounded-sm text-gray-500 transition-colors"
      onClick={handleMoreActionsToggle}
      onKeyUp={handleMoreActionsKeyUp}
    >
      <Icon name={IconName.Zap} className="w-3 h-3 hidden 2xs:block" />
      {INPUT_STRINGS.MORE_ACTIONS}
    </button>
  );

  return (
    <footer
      className={`fixed z-20 bottom-0 w-full flex flex-col gap-y-1 pt-1 pb-2
        bg-sidebar border-t border-tab-inactive/30
        ${settings?.minimalUI ? "pb-2" : "pb-2"}
      `}
    >
      <div className="w-full mx-auto px-2 relative">
        <div className="relative">
          <div className="relative bg-input rounded-sm border border-tab-inactive/30 overflow-hidden">
            <div className="flex items-stretch">
              <div className="bg flex-1 textarea-wrapper w-full flex items-center overflow-hidden transition-all">
                {currentConversation.inProgress ? renderThinkingState() : renderQuestionInput()}
              </div>

              <div className="flex items-center">
                <div className="h-5 w-px bg-tab-inactive/30 mx-0.5"></div>
                <div className="m-0.5" id="question-input-buttons">
                  {currentConversation.inProgress ?
                    renderStopButton() :
                    renderAskButton()
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tooltip id="clear-tooltip" />
      <Tooltip id="editor-tooltip" />
      <Tooltip id="model-selection-tooltip" />
    </footer>
  );
};

export default QuestionInputField;
