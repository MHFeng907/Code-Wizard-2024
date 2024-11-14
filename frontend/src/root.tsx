import {
  Links,
  Meta,
  MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
  defer,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigation,
} from "@remix-run/react";
import "./tailwind.css";
import "./index.css";
// import React from "react"; 2024修改
import React, { useState, useEffect, useRef } from "react";
// import { execFile } from "child_process";
import { Toaster, toast } from "react-hot-toast";
import CogTooth from "./assets/cog-tooth";
import { SettingsForm } from "./components/form/settings-form";
import AllHandsLogo from "#/assets/branding/all-hands-logo.svg?react";
import { ModalBackdrop } from "#/components/modals/modal-backdrop";
import { isGitHubErrorReponse, retrieveGitHubUser } from "./api/github";
import OpenHands from "./api/open-hands";
import LoadingProjectModal from "./components/modals/LoadingProject";
import { getSettings, settingsAreUpToDate } from "./services/settings";
import AccountSettingsModal from "./components/modals/AccountSettingsModal";
import NewProjectIcon from "./assets/new-project.svg?react";
import DocsIcon from "./assets/docs.svg?react";
import VSOpenIcon from './assets/vsopen.svg?react'; // 2024新增
import DialogModeIcon from './assets/dialogmode.svg?react'; // 2024新增
// import an icon for language translation from'./assets/vsopen.svg?react'
import LanTransIcon from './assets/Translate.svg?react';
import GenProIcon from './assets/genpro.svg?react';
import i18n from "./i18n";
import { useSocket } from "./context/socket";
import { UserAvatar } from "./components/user-avatar";
import { DangerModal } from "./components/modals/confirmation-modals/danger-modal";
import { DialogModeForm } from "./components/DialogModeForm"; // 2024新增
import { useDispatch } from "react-redux";
import { ActionMessage } from "#/types/Message";
import ActionType from "#/types/ActionType";
import { GoogleGenerativeAI } from "@google/generative-ai";  // 2024新增
import { LanguageFactory, Language } from "./LanguageFactory"; // 导入工厂类


const API_KEY = "AIzaSyCmSx2EJUSmXJNNm8MTvPrRpD1NOsRp8bw"; // 替换为你的 API 密钥
const genAI = new GoogleGenerativeAI(API_KEY);

const translateCode = async (sourceLanguage: string, targetLanguage: string, sourceText: string): Promise<string> => {
  try {
    const generationConfig = {
      stopSequences: ["red"],
      maxOutputTokens: 500,
      temperature: 0.5,
      topP: 1,
      topK: 16,
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: generationConfig,
    });

    const prompt = `Translate the following ${sourceLanguage} code to ${targetLanguage}:\n\n${sourceText}`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    const translatedText = response.text();

    toast.success("Translation successful", { duration: 2000 });
    return translatedText.trim();
  } catch (error) {
    toast.error("Error translating code", { duration: 3000 });
    console.error("Error translating code:", error);
    return "Translation failed";
  }
};

const generateProject = async (projectPath: string, projectDescription: string, projectLanguage: string): Promise<string> => {
  try {
    const prompt = `Generate a project with the following details:\n\nPath: ${projectPath}\nDescription: ${projectDescription}\nLanguage: ${projectLanguage}`;
    const generationConfig = {
      stopSequences: ["red"],
      maxOutputTokens: 500,
      temperature: 0.5,
      topP: 1,
      topK: 16,
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: generationConfig,
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const notebookContent = response.text();

    // 在 workspace 目录中生成 Jupyter notebook 文件
    const notebookPath = `${projectPath}/generated_project.ipynb`;
    await fetch('/api/save-notebook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: notebookPath, content: notebookContent }),
    });

    // 执行 Jupyter notebook
    await fetch('/api/execute-notebook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: notebookPath }),
    });

    toast.success("Project generated successfully", { duration: 2000 });
    return notebookPath;
  } catch (error) {
    toast.error("Error generating project", { duration: 3000 });
    console.error("Error generating project:", error);
    return "Generation failed";
  }
};

declare global {
  interface Window {
    loadPyodide: () => Promise<any>;
  }
}

interface Pyodide {
  runPythonAsync: (code: string) => Promise<any>;
  loadPackage: (packageName: string) => Promise<void>;
}

const loadPyodide = async (): Promise<Pyodide> => {
  console.log("Loading Pyodide...");
  if (!window.loadPyodide) {
    throw new Error("Pyodide is not available on the window object.");
  }
  const pyodide = await window.loadPyodide();
  console.log("Pyodide loaded.");
  await pyodide.loadPackage("micropip");
  console.log("micropip package loaded.");
  await pyodide.runPythonAsync(`
    import micropip
    await micropip.install('google-generativeai')
  `);
  console.log("google-generativeai package installed.");
  return pyodide;
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster />
      </body>
    </html>
  );
}

export const meta: MetaFunction = () => [
  { title: "OpenHands" },
  { name: "description", content: "Let's Start Building!" },
];

export const clientLoader = async () => {
  let token = localStorage.getItem("token");
  const ghToken = localStorage.getItem("ghToken");

  let user: GitHubUser | GitHubErrorReponse | null = null;
  if (ghToken) user = await retrieveGitHubUser(ghToken);

  const settings = getSettings();
  await i18n.changeLanguage(settings.LANGUAGE);

  const settingsIsUpdated = settingsAreUpToDate();
  if (!settingsIsUpdated) {
    localStorage.removeItem("token");
    token = null;
  }

  return defer({
    token,
    ghToken,
    user,
    settingsIsUpdated,
    settings,
  });
};


export default function App() {
  const { stop, isConnected } = useSocket();
  const navigation = useNavigation();
  const location = useLocation();
  const { token, user, settingsIsUpdated, settings } =
    useLoaderData<typeof clientLoader>();
  const loginFetcher = useFetcher({ key: "login" });
  const logoutFetcher = useFetcher({ key: "logout" });
  const endSessionFetcher = useFetcher({ key: "end-session" });

  const [vscodePath, setVscodePath] = useState("");
  const [isVscodeModalOpen, setIsVscodeModalOpen] = useState(false);

  const [dialogModeModalIsOpen, setDialogModeModalIsOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const handleVscodeButtonClick = () => {
    setIsVscodeModalOpen(true);
  };

  const handleVscodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVscodePath(e.target.value);
  };

  const handleVscodeOpen = async () => {
    if (!vscodePath) {
      alert("Please enter a valid path.");
      return;
    }
    setLoading(true);
    const token = localStorage.getItem("token");
    if(token) {
      try {
        await OpenHands.openVscode(token, vscodePath); // 调用后端API
        setIsVscodeModalOpen(false); // 关闭模态框
      } catch (error) {
        console.error("Error opening VS Code", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVscodeModalClose = () => {
    setIsVscodeModalOpen(false);
  };

  const dispatch = useDispatch();
  const [isLanTransModalOpen, setIsLanTransModalOpen] = useState(false);
  const [isProjectGenModalOpen, setIsProjectGenModalOpen] = useState(false);
  const [projectPath, setProjectPath] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectLanguage, setProjectLanguage] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("python");
  const [targetLanguage, setTargetLanguage] = useState("java");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [pyodide, setPyodide] = useState<Pyodide | null>(null);
  const chatInputRef = useRef<any>(null); // 使用 ref 获取 ChatInput 组件实例

  useEffect(() => {
    loadPyodide().then(setPyodide).catch((error) => {
      console.error("Failed to load Pyodide:", error);
    });
  }, []);

  const handleLanTransButtonClick = () => {
    setIsLanTransModalOpen(true);
  };

  const handleProjectGenButtonClick = () => {
    setIsProjectGenModalOpen(true);
  };

  const handleLanTransModalClose = () => {
    setIsLanTransModalOpen(false);
    setSourceText("");
    setTranslatedText("");
  };

  const handleProjectGenModalClose = () => {
    setIsProjectGenModalOpen(false);
    setProjectPath("");
    setProjectDescription("");
    setProjectLanguage("");
  };

  const handleTranslate = async () => {
    try {
      console.log("Translating code...");
      const result = await translateCode(sourceLanguage, targetLanguage, sourceText);
      console.log("Translation result:", result);
      setTranslatedText(result);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('Translation failed');
    }
  };

  const handleGenerateProject = async () => {
    const prompt = `Generate a complete project with the following details:

    Path: ${projectPath}
    Description: ${projectDescription}
    Language: ${projectLanguage}

    Please generate the following:
    1. Create the project directory structure based on the provided path.
    2. Create all necessary project files with TypeScript (TSX) syntax. The project should include React components where applicable.
    3. For each file, write the corresponding content that fits the description and language specified.
    4. Include necessary configuration files such as:
        - tsconfig.json for TypeScript configuration.
        - package.json for Node.js package management.
        - .gitignore for git version control exclusions.
        - README.md with a brief description of the project.
    5. Ensure the generated code follows TypeScript and React best practices, including proper type annotations, JSX/TSX syntax, and modular structure.
    6. Include example React components in TSX format if needed, with appropriate props and state management.
    7. Ensure all required dependencies (e.g., React, React-DOM, TypeScript) are included in the package.json.

    Please provide the full structure with file names, folder hierarchy, and the content of each file in TSX format.`;




    const event = new CustomEvent('sendPrompt', { detail: { prompt } });
    window.dispatchEvent(event);
    handleProjectGenModalClose();
  };

  const [accountSettingsModalOpen, setAccountSettingsModalOpen] =
    React.useState(false);
  const [settingsModalIsOpen, setSettingsModalIsOpen] = React.useState(false);
  const [startNewProjectModalIsOpen, setStartNewProjectModalIsOpen] =
    React.useState(false);
  const [data, setData] = React.useState<{
    models: string[];
    agents: string[];
    securityAnalyzers: string[];
  }>({
    models: [],
    agents: [],
    securityAnalyzers: [],
  });

  React.useEffect(() => {
    // We fetch this here instead of the data loader because the server seems to block
    // the retrieval when the session is closing -- preventing the screen from rendering until
    // the fetch is complete
    (async () => {
      const [models, agents, securityAnalyzers] = await Promise.all([
        OpenHands.getModels(),
        OpenHands.getAgents(),
        OpenHands.getSecurityAnalyzers(),
      ]);

      setData({ models, agents, securityAnalyzers });
    })();
  }, []);

  React.useEffect(() => {
    // If the github token is invalid, open the account settings modal again
    if (isGitHubErrorReponse(user)) {
      setAccountSettingsModalOpen(true);
    }
  }, [user]);

  React.useEffect(() => {
    if (location.pathname === "/") {
      // If the user is on the home page, we should stop the socket connection.
      // This is relevant when the user redirects here for whatever reason.
      if (isConnected) stop();
    }
  }, [location.pathname]);

  const handleUserLogout = () => {
    logoutFetcher.submit(
      {},
      {
        method: "POST",
        action: "/logout",
      },
    );
  };

  const handleAccountSettingsModalClose = () => {
    // If the user closes the modal without connecting to GitHub,
    // we need to log them out to clear the invalid token from the
    // local storage
    if (isGitHubErrorReponse(user)) handleUserLogout();
    setAccountSettingsModalOpen(false);
  };

  const handleEndSession = () => {
    setStartNewProjectModalIsOpen(false);
    // call new session action and redirect to '/'
    endSessionFetcher.submit(new FormData(), {
      method: "POST",
      action: "/end-session",
    });
  };

  //<Toaster position="bottom-center" />

  return (

    <div className="bg-root-primary p-3 h-screen min-w-[1024px] overflow-x-hidden flex gap-3">

      <aside className="px-1 flex flex-col gap-[15px]">
        <button
          type="button"
          aria-label="All Hands Logo"
          onClick={() => {
            if (location.pathname !== "/") setStartNewProjectModalIsOpen(true);
          }}
        >
          <AllHandsLogo width={34} height={23} />
        </button>
        <nav className="py-[18px] flex flex-col items-center gap-[18px]">
          <UserAvatar
            user={user}
            isLoading={loginFetcher.state !== "idle"}
            onLogout={handleUserLogout}
            handleOpenAccountSettingsModal={() =>
              setAccountSettingsModalOpen(true)
            }
          />
          <button
            type="button"
            className="w-8 h-8 rounded-full hover:opacity-80 flex items-center justify-center"
            onClick={() => setSettingsModalIsOpen(true)}
            aria-label="Settings"
          >
            <CogTooth />
          </button>
          <a
            href="https://docs.all-hands.dev"
            target="_blank"
            rel="noreferrer noopener"
            className="w-8 h-8 rounded-full hover:opacity-80 flex items-center justify-center"
            aria-label="Documentation"
          >
            <DocsIcon width={28} height={28} />
          </a>
          {!!token && (
            <button
              type="button"
              aria-label="Start new project"
              onClick={() => setStartNewProjectModalIsOpen(true)}
            >
              <NewProjectIcon width={28} height={28} />
            </button>
          )}
          <button
            type="button"
            className="w-8 h-8 rounded-full hover:opacity-80 flex items-center justify-center"
            onClick={handleVscodeButtonClick}
            aria-label="VSOpen"
          >
            <VSOpenIcon width={28} height={28} />
          </button>
          <button
            type="button"
            className="w-8 h-8 rounded-full hover:opacity-80 flex items-center justify-center"
            onClick={() => setDialogModeModalIsOpen(true)}  // 点击时打开对话模式设置
            aria-label="Dialog Mode Settings"
          >
            <DialogModeIcon width={28} height={28} />
          </button>
          <button
            type="button"
            className="w-8 h-8 rounded-full hover:opacity-80 flex items-center justify-center"
            onClick={handleLanTransButtonClick}
            aria-label="LanTrans"
          >
            <LanTransIcon width={28} height={28} />
          </button>
          <button
            type="button"
            className="w-8 h-8 rounded-full hover:opacity-80 flex items-center justify-center"
            onClick={handleProjectGenButtonClick}
            aria-label="ProjectGen"
          >
            <GenProIcon width={28} height={28} />
          </button>
        </nav>
      </aside>

      <div className="h-full w-full relative">
        <Outlet />
        {navigation.state === "loading" && location.pathname !== "/" && (
          <ModalBackdrop>
            <LoadingProjectModal
              message={
                endSessionFetcher.state === "loading"
                  ? "Ending session, please wait..."
                  : undefined
              }
            />
          </ModalBackdrop>
        )}
        {(!settingsIsUpdated || settingsModalIsOpen) && (
          <ModalBackdrop onClose={() => setSettingsModalIsOpen(false)}>
            <div className="bg-root-primary w-[384px] p-6 rounded-xl flex flex-col gap-2">
              <span className="text-xl leading-6 font-semibold -tracking-[0.01em]">
                AI Provider Configuration
              </span>
              <p className="text-xs text-[#A3A3A3]">
                To continue, connect an OpenAI, Anthropic, or other LLM account
              </p>
              {isConnected && (
                <p className="text-xs text-danger">
                  Changing settings during an active session will end the
                  session
                </p>
              )}
              <SettingsForm
                settings={settings}
                models={data.models}
                agents={data.agents}
                securityAnalyzers={data.securityAnalyzers}
                onClose={() => setSettingsModalIsOpen(false)}
              />
            </div>
          </ModalBackdrop>
        )}
        {accountSettingsModalOpen && (
          <ModalBackdrop onClose={handleAccountSettingsModalClose}>
            <AccountSettingsModal
              onClose={handleAccountSettingsModalClose}
              selectedLanguage={settings.LANGUAGE}
              gitHubError={isGitHubErrorReponse(user)}
            />
          </ModalBackdrop>
        )}
        {startNewProjectModalIsOpen && (
          <ModalBackdrop onClose={() => setStartNewProjectModalIsOpen(false)}>
            <DangerModal
              title="Are you sure you want to exit?"
              description="You will lose any unsaved information."
              buttons={{
                danger: {
                  text: "Exit Project",
                  onClick: handleEndSession,
                },
                cancel: {
                  text: "Cancel",
                  onClick: () => setStartNewProjectModalIsOpen(false),
                },
              }}
            />
          </ModalBackdrop>
        )}

      {isVscodeModalOpen && (
        <ModalBackdrop onClose={handleVscodeModalClose}>
          <div className="bg-root-primary w-[384px] p-6 rounded-xl flex flex-col gap-2">
            <span className="text-xl leading-6 font-semibold -tracking-[0.01em]">
              Open VS Code
            </span>
            <p className="text-xs text-[#A3A3A3]">
              Enter the path of the project you want to open in VS Code.
            </p>
            <input
              type="text"
              value={vscodePath}
              onChange={handleVscodeInputChange}
              className="p-2 border rounded-md"
              placeholder="/path/to/your/project"
            />
            <div className="flex justify-between gap-2 mt-4">
              <button
                className="bg-gray-500 text-white p-2 rounded"
                onClick={handleVscodeModalClose}
              >
                Cancel
              </button>
              <button
                className={`bg-blue-500 text-white p-2 rounded ${
                  loading ? "opacity-50" : ""
                }`}
                onClick={handleVscodeOpen}
                disabled={loading}
              >
                {loading ? "Opening..." : "Open VS Code"}
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
      {/* 对话模式设置模态框 */}
      {dialogModeModalIsOpen && (
        <ModalBackdrop onClose={() => setDialogModeModalIsOpen(false)}>
          <DialogModeForm onClose={() => setDialogModeModalIsOpen(false)} />
          </ModalBackdrop>

      )}

      {isLanTransModalOpen && (
        <ModalBackdrop onClose={handleLanTransModalClose}>
          <div className="bg-root-primary w-[384px] p-6 rounded-xl flex flex-col gap-2">
            <span className="text-xl leading-6 font-semibold -tracking-[0.01em]">
              Language Translation
            </span>
            <div className="flex gap-2">
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="p-2 border rounded-md"
              >
                {LanguageFactory.getLanguages().map((lang: Language) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="p-2 border rounded-md"
              >
                {LanguageFactory.getLanguages().map((lang: Language) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="p-2 border rounded-md mt-2"
              placeholder="Enter source text"
              rows={4}
            />
            <textarea
              value={translatedText}
              readOnly
              className="p-2 border rounded-md mt-2"
              placeholder="Translated text"
              rows={4}
            />
            <div className="flex justify-between gap-2 mt-4">
              <button
                className="bg-gray-500 text-white p-2 rounded"
                onClick={handleLanTransModalClose}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white p-2 rounded"
                onClick={handleTranslate}
              >
                Translate
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
      {isProjectGenModalOpen && (
        <ModalBackdrop onClose={handleProjectGenModalClose}>
          <div className="bg-root-primary w-[384px] p-6 rounded-xl flex flex-col gap-2">
            <span className="text-xl leading-6 font-semibold -tracking-[0.01em]">
              Project Generation
            </span>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                className="p-2 border rounded-md"
                placeholder="Enter project path"
              />
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="p-2 border rounded-md"
                placeholder="Enter project description"
                rows={2}
              />
              <input
                type="text"
                value={projectLanguage}
                onChange={(e) => setProjectLanguage(e.target.value)}
                className="p-2 border rounded-md"
                placeholder="Enter project language (e.g., python)"
              />
            </div>
            <div className="flex justify-between gap-2 mt-4">
              <button
                className="bg-gray-500 text-white p-2 rounded"
                onClick={handleProjectGenModalClose}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white p-2 rounded"
                onClick={handleGenerateProject}
              >
                Generate Prompt
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
      </div>

    </div>
  );
}
