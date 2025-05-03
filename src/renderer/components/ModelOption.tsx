import classNames from "classnames";
import React, { ReactElement, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useMessenger } from "../send-to-backend";
import { RootState } from "../store";
import { updateConversationModel } from "../store/conversation";
import { Conversation, Model, MODEL_TOKEN_LIMITS } from "../types";
import { RichModel } from "./ModelSelect";

interface ModelOptionProps {
  currentConversation: Conversation;
  model: RichModel;
  currentlySelectedId?: string;
  vscode: any;
  showParentMenu?: React.Dispatch<React.SetStateAction<boolean>>;
  setShowModels: React.Dispatch<React.SetStateAction<boolean>>;
}

const ModelOption = ({
  model,
  currentlySelectedId,
  vscode,
  showParentMenu,
  currentConversation,
  setShowModels,
}: ModelOptionProps): ReactElement => {
  const isSelected = model.id === currentlySelectedId;
  const dispatch = useAppDispatch();

  const backendMessenger = useMessenger(vscode);
  const models: Model[] = useAppSelector(
    (state: RootState) => state.app.models
  );
  const [selectedModel, setSelectedModel] = useState<Model | undefined>(
    undefined
  );

  const handleModelSelection = (model: Model): void => {
    backendMessenger.sendModelUpdate(model);

    dispatch(
      updateConversationModel({
        conversationId: currentConversation.id,
        model,
      })
    );

    setShowModels(false);
  };

  useEffect(() => {
    setSelectedModel(models.find((m) => m.id === model.id));
  }, [models, currentlySelectedId, model]);

  const handleClick = (): void => {
    if (selectedModel) {
      handleModelSelection(selectedModel);
    } else {
      console.error(
        "ModelOption: selectedModel is undefined, cannot set model"
      );
    }

    if (showParentMenu) {
      showParentMenu(false);
    }
  };

  return (
    <button
      className={classNames(
        "group flex flex-col gap-1 items-start justify-start py-1.5 px-2 w-full text-left",
        "hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] text-gray-700 dark:text-gray-300",
        "transition-colors",
        {
          "bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.03)] border-l-2 border-l-gray-400/40": isSelected,
        }
      )}
      onClick={handleClick}
    >
      <span className="font-medium text-[11px]">
        <code className="text-gray-700 dark:text-gray-300 font-mono">
          {model.name}
        </code>
        {model.recommended && <span className="text-green-600 dark:text-green-400 text-[10px] ml-1">(recommended)</span>}
      </span>
      <p className="text-[10px] text-gray-500 dark:text-gray-400">
        <span className="mr-1">Quality: {model.quality}</span>
        <span className="mr-1">Speed: {model.speed}</span>
        <span className="mr-1">Cost: {model.cost}</span>
        <span>
          Context:{" "}
          <code className="text-gray-600 dark:text-gray-400 font-mono">
            {MODEL_TOKEN_LIMITS.get(model.id ?? "")?.context}
          </code>
        </span>
        {MODEL_TOKEN_LIMITS.get(model.id ?? "")?.max && (
          <span className="ml-1">
            Completion:{" "}
            <code className="text-gray-600 dark:text-gray-400 font-mono">
              {MODEL_TOKEN_LIMITS.get(model.id ?? "")?.max}
            </code>
          </span>
        )}
      </p>
    </button>
  );
};

export default ModelOption;
