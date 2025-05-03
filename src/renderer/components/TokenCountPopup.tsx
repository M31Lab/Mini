import classNames from "classnames";
import React, { useEffect, useState } from "react";
import {
  getModelCompletionLimit,
  getModelContextLimit,
  getModelRates,
} from "../helpers";
import { useAppSelector } from "../hooks";
import { RootState } from "../store";
import { Conversation } from "../types";
import Icon, { IconName } from "./Icon";

const FALLBACK_MODEL_ID = "gpt-4-turbo";

export default function TokenCountPopup({
  currentConversation,
  showTokenBreakdown,
  setTokenCountLabel,
  className,
}: {
  currentConversation: Conversation;
  conversationList: Conversation[];
  vscode: any;
  showTokenBreakdown: boolean;
  setTokenCountLabel: React.Dispatch<React.SetStateAction<string>>;
  className?: string;
}) {
  const settings = useAppSelector(
    (state: RootState) => state.app.extensionSettings
  );

  const [minCost, setMinCost] = useState<number | undefined>(undefined);
  const [maxCost, setMaxCost] = useState<number | undefined>(undefined);
  const [minPromptTokens, setMinPromptTokens] = useState(
    currentConversation.tokenCount?.minTotal ?? 0
  );
  const [maxCompleteTokens, setMaxCompleteTokens] = useState(0);
  const [promptRate, setPromptRate] = useState<number | undefined>(undefined);
  const [completeRate, setCompleteRate] = useState<number | undefined>(
    undefined
  );

  // On model change and token count change, update the token count label
  useEffect(() => {
    const minPromptTokens =
      (currentConversation.tokenCount?.messages ?? 0) +
      (currentConversation.tokenCount?.userInput ?? 0);
    const modelId = currentConversation.model?.id ?? FALLBACK_MODEL_ID;

    // Limits
    const modelContextLimit = getModelContextLimit(currentConversation.model);
    const modelMax = getModelCompletionLimit(currentConversation.model);
    let maxCompleteTokens = modelContextLimit - minPromptTokens;

    if (modelMax) {
      maxCompleteTokens = Math.min(maxCompleteTokens, modelMax);
    }

    // Rates
    const rates = getModelRates(currentConversation.model);
    let minCost =
      rates.prompt !== undefined
        ? (minPromptTokens / 1000000) * rates.prompt
        : undefined;
    // maxCost is based on current convo text at ratePrompt pricing + theoretical maximum response at rateComplete pricing
    let maxCost =
      minCost !== undefined && rates.complete !== undefined
        ? minCost + (maxCompleteTokens / 1000000) * rates.complete
        : undefined;

    setMinPromptTokens(minPromptTokens);
    setMaxCompleteTokens(maxCompleteTokens);
    setPromptRate(rates.prompt);
    setCompleteRate(rates.complete);
    setMinCost(minCost);
    setMaxCost(maxCost);
    setTokenCountLabel(minPromptTokens.toString());
  }, [currentConversation.tokenCount, currentConversation.model]);

  return (
    <div
      className={classNames(
        "TokenCountPopup",
        "mb-3 absolute w-[calc(100% - 2em)] max-w-[20em] items-center border border-tab-inactive/30 text-gray-600 dark:text-gray-400 bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] text-[9px] rounded-sm z-10 right-3",
        className,
        showTokenBreakdown ? "block" : "hidden"
      )}
    >
      {/* Show a breakdown of the token count with min tokens, max tokens, min cost, and max cost */}
      <div className="p-3 flex flex-col gap-1.5 whitespace-pre-wrap">
        <h5 className="flex items-center gap-1 mb-1 text-xs">
          <span
            data-tooltip-content="These counts are approximate"
            data-tooltip-id="token-count-info-tooltip"
          >
            <Icon name={IconName.Help} className="w-2.5 h-2.5" />
          </span>
          Token Breakdown
        </h5>
        <p>
          <span className="block">
            <span className="font-medium">
              At least:
            </span>
            <br />
            <span className="text-[8px] text-gray-500 dark:text-gray-500">
              (Conversation + Current Input)
              <br />(
              <code>{currentConversation.tokenCount?.messages ?? 0}</code> +{" "}
              <code>{currentConversation.tokenCount?.userInput ?? 0}</code>)
            </span>
          </span>
          <code className="text-gray-700 dark:text-gray-300">{minPromptTokens}</code>{" "}
          tokens
          {" = "}
          <code className="text-gray-700 dark:text-gray-300">${minCost?.toFixed(2) ?? "???"}</code>
        </p>
        <p>
          <span className="block">
            <span className="font-medium">
              At most:
            </span>
            <br />
            <span className="text-[8px] text-gray-500 dark:text-gray-500">
              (Conversation + Current Input + Max Response)

              <br />(
              <code>{currentConversation.tokenCount?.messages ?? 0}</code> +{" "}
              <code>{currentConversation.tokenCount?.userInput ?? 0}</code> +{" "}
              <code>{maxCompleteTokens}</code>)
            </span>
          </span>
          <code className="text-gray-700 dark:text-gray-300">{minPromptTokens + maxCompleteTokens}</code>{" "}
          tokens
          {" = "}
          <code className="text-gray-700 dark:text-gray-300">${maxCost?.toFixed(2) ?? "???"}</code>
        </p>
        <p className="italic text-[8px] mt-1 text-gray-500 dark:text-gray-500">
          Tip: Make a new chat routinely to keep costs low.
        </p>

        {/* if gpt-4 or gpt-4-32k is the model, add an additional warning about cost */}
        {(currentConversation.model?.id === "gpt-4" ||
          currentConversation.model?.id === "gpt-4-32k") && (
            <p className="text-[8px] font-medium text-gray-700 dark:text-gray-300">
              GPT-4 is significantly more expensive than GPT-3.5.
            </p>
          )}

        {/* gpt_4_turbo cost warning */}
        {currentConversation.model?.id === "gpt-4-turbo" && (
          <p className="text-[8px] font-medium text-gray-700 dark:text-gray-300">
            GPT-4 Turbo is more expensive than GPT-3.5.
          </p>
        )}
      </div>
    </div>
  );
}
