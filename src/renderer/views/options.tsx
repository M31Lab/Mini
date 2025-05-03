import React from "react";

type OptionsProps = {
  vscode: any;
};

const OPTIONS_STRINGS = {
  TITLE: "Options"
};

export default function Options({ vscode }: OptionsProps): React.ReactElement {
  return <div>{OPTIONS_STRINGS.TITLE}</div>;
}
