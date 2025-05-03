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
        "group flex flex-col gap-2 items-start justify-start p-2 w-full",
        "hover:bg-menu-selection hover:text-menu-selection",
        "focus:bg-menu-selection focus:text-menu-selection",
        {
          "bg-gray-500 bg-opacity-15 border-l-4 border-l-tab-editor-focus":
            isSelected,
        }
      )}
      onClick={handleClick}
    >
      <span>
        <code className="group-hover:text-menu-selection group-focus:text-menu-selection">
          {model.name}
        </code>
        {model.recommended && <strong> (recommended)</strong>}
      </span>
      <p>
        Quality: {model.quality}, Speed: {model.speed}, Cost: {model.cost},
        Context:{" "}
        <code className="group-hover:text-menu-selection group-focus:text-menu-selection">
          {MODEL_TOKEN_LIMITS.get(model.id ?? "")?.context}
        </code>
        {MODEL_TOKEN_LIMITS.get(model.id ?? "")?.max && (
          <>
            , Completion:{" "}
            <code className="group-hover:text-menu-selection group-focus:text-menu-selection">
              {MODEL_TOKEN_LIMITS.get(model.id ?? "")?.max}
            </code>
          </>
        )}
      </p>
    </button>
  );
};

export default ModelOption;
