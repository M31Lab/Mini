import React from "react";
import ApiKeySetup from "../components/ApiKeySetup";

type OpenAISetupProps = {
  vscode: any;
};

export default function OpenAISetup({ vscode }: OpenAISetupProps): React.ReactElement {
  return (
    <div className="overflow-y-auto">
      <ApiKeySetup vscode={vscode} />
    </div>
  );
}
