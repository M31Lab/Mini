import classNames from "classnames";
import React, { ChangeEvent, ReactElement, useState } from "react";
import { useAppDispatch } from "../hooks";
import { useMessenger } from "../send-to-backend";
import { updateConversationModel } from "../store/conversation";
import { Conversation, Model, Role } from "../types";

interface ModelInputProps {
  currentConversation: Conversation;
  vscode: any;
  className?: string;
  dropdownClassName?: string;
  tooltipId?: string;
  showParentMenu?: React.Dispatch<React.SetStateAction<boolean>>;
}

const ModelInput = ({
  currentConversation,
  vscode,
  className,
  dropdownClassName,
  tooltipId,
  showParentMenu,
}: ModelInputProps): ReactElement => {
  const dispatch = useAppDispatch();
  const backendMessenger = useMessenger(vscode);
  const [modelId, setModelId] = useState<string>("");
  const [showPopup, setShowPopup] = useState<boolean>(false);

  const handleModelChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setModelId(event.target.value);
  };

  const handleModelSubmit = (): void => {
    const model: Model = {
      id: modelId,
      name: modelId,
      created: Date.now(),
      object: "model",
      owned_by: Role.user,
    };

    backendMessenger.sendModelUpdate(model);
    dispatch(
      updateConversationModel({
        conversationId: currentConversation.id,
        model,
      })
    );

    setShowPopup(false);
  };

  const togglePopup = (): void => {
    setShowPopup(!showPopup);
  };

  return (
    <>
      <div className={classNames(className, "relative")}>
        <button
          className="rounded-sm py-0.5 px-1 flex items-center text-[11px] text-gray-600 dark:text-gray-300 hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] whitespace-nowrap transition-colors"
          onClick={togglePopup}
          data-tooltip-id={tooltipId ?? "footer-tooltip"}
          data-tooltip-content="Enter model ID manually"
        >
          <span>{modelId || "Enter Model ID"}</span>
        </button>

        <div
          className={classNames(
            "fixed mb-8 overflow-y-auto max-h-[calc(100%-7em)] items-center border border-tab-inactive/30 bg-white dark:bg-gray-900 shadow-sm text-[11px] rounded-sm",
            { block: showPopup, hidden: !showPopup },
            dropdownClassName ? dropdownClassName : "left-4 z-10"
          )}
        >
          <div className="w-full flex gap-1.5 p-1.5">
            <input
              type="text"
              placeholder="Enter Model ID"
              value={modelId}
              onChange={handleModelChange}
              className="px-2 py-1 rounded-sm border border-tab-inactive/40 text-gray-700 dark:text-gray-300 text-[11px] bg-[rgba(0,0,0,0.01)] dark:bg-[rgba(255,255,255,0.01)] outline-0 focus:border-tab-inactive/60"
            />
            <button
              onClick={handleModelSubmit}
              className="px-2 py-1 bg-[rgba(0,0,0,0.02)] hover:bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.02)] dark:hover:bg-[rgba(255,255,255,0.04)] text-gray-700 dark:text-gray-300 text-[11px] rounded-sm border border-tab-inactive/30 transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModelInput;
