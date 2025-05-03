import React from "react";
import CustomPromptPanel from "../components/CustomPromptPanel";

type PromptsProps = {
  vscode: any;
};

export default function Prompts({ vscode }: PromptsProps): React.ReactElement {
  return <CustomPromptPanel />;
}
