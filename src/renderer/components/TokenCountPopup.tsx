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
        "mb-4 absolute w-[calc(100% - 3em) max-w-[25em] items-center border text-menu bg-menu border-menu shadow-xl text-xs rounded z-10 right-4",
        className,
        showTokenBreakdown ? "block" : "hidden"
      )}
    >
      {/* Show a breakdown of the token count with min tokens, max tokens, min cost, and max cost */}
      <div className="p-4 flex flex-col gap-2 whitespace-pre-wrap">
        <h5 className="flex items-center gap-1">
          <span
            data-tooltip-content="These counts are approximate"
            data-tooltip-id="token-count-info-tooltip"
          >
            <Icon name={IconName.Help} className="w-3 h-3" />
          </span>
          Token Breakdown
        </h5>
        <p>
          <span className="block">
            <span className="font-bold">
              At least:
            </span>
            <br />
            <span className="font-italic text-[10px]">
              (Conversation + Current Input)
              <br />(
              <code>{currentConversation.tokenCount?.messages ?? 0}</code> +{" "}
              <code>{currentConversation.tokenCount?.userInput ?? 0}</code>)
            </span>
          </span>
          <code>{minPromptTokens}</code>{" "}
          tokens
          {" = "}
          <code>${minCost?.toFixed(2) ?? "???"}</code>
        </p>
        <p>
          <span className="block">
            <span className="font-bold">
              At most:
            </span>
            <br />
            <span className="font-italic text-[10px]">
              (Conversation + Current Input + Max Response)

              <br />(
              <code>{currentConversation.tokenCount?.messages ?? 0}</code> +{" "}
              <code>{currentConversation.tokenCount?.userInput ?? 0}</code> +{" "}
              <code>{maxCompleteTokens}</code>)
            </span>
          </span>
          <code>{minPromptTokens + maxCompleteTokens}</code>{" "}
          tokens
          {" = "}
          <code>${maxCost?.toFixed(2) ?? "???"}</code>
        </p>
        <p className="italic">
          Tip: Make a new chat routinely to keep costs low.
        </p>

        {/* if gpt-4 or gpt-4-32k is the model, add an additional warning about cost */}
        {(currentConversation.model?.id === "gpt-4" ||
          currentConversation.model?.id === "gpt-4-32k") && (
            <p className="font-bold">
              GPT-4 is significantly more expensive than GPT-3.5.
            </p>
          )}

        {/* gpt_4_turbo cost warning */}
        {currentConversation.model?.id === "gpt-4-turbo" && (
          <p className="font-bold">
            GPT-4 Turbo is more expensive than GPT-3.5.
          </p>
        )}
      </div>
    </div>
  );
}
