import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  ClientActionFunctionArgs,
  json,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import { RootState } from "#/store";
import AgentState from "#/types/AgentState";
import FileExplorer from "#/components/file-explorer/FileExplorer";
import OpenHands from "#/api/open-hands";
import { useSocket } from "#/context/socket";
import CodeEditorCompoonent from "./code-editor-component";
import { useFiles } from "#/context/files";
import SuggestionPopup from './SuggestionPopup'; // 根据实际路径调整

export const clientLoader = async () => {
  const token = localStorage.getItem("token");
  return json({ token });
};

export const clientAction = async ({ request }: ClientActionFunctionArgs) => {
  const token = localStorage.getItem("token");

  const formData = await request.formData();
  const file = formData.get("file")?.toString();

  let selectedFileContent: string | null = null;

  if (file && token) {
    selectedFileContent = await OpenHands.getFile(token, file);
  }

  return json({ file, selectedFileContent });
};

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="w-full h-full border border-danger rounded-b-xl flex flex-col items-center justify-center gap-2 bg-red-500/5">
      <h1 className="text-3xl font-bold">Oops! An error occurred!</h1>
      {error instanceof Error && <pre>{error.message}</pre>}
    </div>
  );
}

function CodeEditor() {
  const { token } = useLoaderData<typeof clientLoader>();
  const { runtimeActive } = useSocket();
  const { setPaths } = useFiles();

  const agentState = useSelector(
    (state: RootState) => state.agent.curAgentState,
  );

  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);

  const closeSuggestion = () => {
    setSuggestion(null);
  };

  React.useEffect(() => {
    if (runtimeActive && token) OpenHands.getFiles(token).then(setPaths);
  }, [runtimeActive, token]);

  const isEditingAllowed = React.useMemo(
    () =>
      agentState === AgentState.PAUSED ||
      agentState === AgentState.FINISHED ||
      agentState === AgentState.AWAITING_USER_INPUT,
    [agentState],
  );

  return (
    <div className="flex h-full w-full bg-neutral-900 relative">
      <FileExplorer />
      <div className="flex flex-col min-h-0 w-full pt-3">
        <div className="flex grow items-center justify-center">
          <CodeEditorCompoonent 
            isReadOnly={!isEditingAllowed}
            setSuggestion={setSuggestion}
            setPopupPosition={setPopupPosition}
          />
          {suggestion && popupPosition && (
            <SuggestionPopup
              suggestion={suggestion}
              position={popupPosition}
              onClose={closeSuggestion}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default CodeEditor;

