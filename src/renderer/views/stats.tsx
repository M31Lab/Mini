import React from "react";

type StatsProps = {
  vscode: any;
};

const STATS_STRINGS = {
  TITLE: "Stats"
};

export default function Stats({ vscode }: StatsProps): React.ReactElement {
  return <div>{STATS_STRINGS.TITLE}</div>;
}
