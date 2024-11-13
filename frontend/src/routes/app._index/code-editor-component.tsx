import { Editor, Monaco } from "@monaco-editor/react";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { VscCode } from "react-icons/vsc";
import { I18nKey } from "#/i18n/declaration";
import { useFiles } from "#/context/files";
import OpenHands from "#/api/open-hands";
import { toast } from 'react-hot-toast';
import * as monaco from 'monaco-editor';
import { GoogleGenerativeAI } from "@google/generative-ai";  // 2024 修改
import SuggestionPopup from './SuggestionPopup'; // 根据实际路径调整

interface CodeEditorCompoonentProps {
  isReadOnly: boolean;
}

const API_KEY = "AIzaSyCmSx2EJUSmXJNNm8MTvPrRpD1NOsRp8bw";
const genAI = new GoogleGenerativeAI(API_KEY);

// 添加一个用于控制请求频率的定时器状态
let debounceTimeout: NodeJS.Timeout | null = null;

async function fetchAICompletion(prompt: string): Promise<string[]> {
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

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    toast.success("Fetched Gemini successfully", { duration: 2000 });
    return [text.trim()];  // 返回生成的文本内容
  } catch (error) {
    toast.error("Error fetching completion from Gemini AI model.", { duration: 3000 });
    console.error("Error fetching AI completion:", error);
    return [];
  }
}

function CodeEditorCompoonent({ isReadOnly }: CodeEditorCompoonentProps) {
  const { t } = useTranslation();
  const {
    files,
    selectedPath,
    modifiedFiles,
    modifyFileContent,
    saveFileContent: saveNewFileContent,
  } = useFiles();

  const [suggestion, setSuggestion] = useState<string | null>(null); // 新增状态管理建议内容
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco): void => {
      monaco.editor.defineTheme("my-theme", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#171717",
        },
      });

      monaco.editor.setTheme("my-theme");

      const languages = ["typescript", "python", "javascript", "java", "csharp"];

      languages.forEach(language => {
        monaco.languages.registerInlineCompletionsProvider(language, {
          provideInlineCompletions: async (model, position, context, token) => {
            const currentLine = model.getLineContent(position.lineNumber);
            const completionItems: monaco.languages.InlineCompletion[] = [];

            const regex = /#\s*(\S.*)/;
            const match = currentLine.match(regex);

            if (match && match[1]) {
              const functionName = match[1].trim();

              if (debounceTimeout) {
                clearTimeout(debounceTimeout);
              }

              debounceTimeout = setTimeout(async () => {
                const suggestions = await fetchAICompletion(`Create function for ${functionName}`);
                if (suggestions.length === 0) {
                  //toast.error('No suggestions returned from the AI model.', { duration: 3000 });
                }

                suggestions.forEach((suggestion) => {
                  completionItems.push({
                    insertText: suggestion,
                    range: new monaco.Range(
                      position.lineNumber,
                      position.column,
                      position.lineNumber,
                      position.column
                    ),
                  });
                });

                return { items: completionItems };
              }, 1000);
            } else {
              const suggestions = await fetchAICompletion(currentLine);
              if (suggestions.length === 0) {
                //toast.error('No suggestions returned from the AI model.', { duration: 3000 });
              }

              suggestions.forEach((suggestion) => {
                completionItems.push({
                  insertText: suggestion,
                  range: new monaco.Range(
                    position.lineNumber,
                    position.column,
                    position.lineNumber,
                    position.column
                  ),
                });
              });

              return { items: completionItems };
            }
          },

          // 添加 freeInlineCompletions 方法
          freeInlineCompletions: (arg) => {
            // 可选处理，当前不需要做任何操作
            return [];
          },
        });
      });

      editor.onDidChangeModelContent((e) => {
        console.log('Editor content changed', e);
      });

      // 监听光标选择变化（选中代码时触发）
      editor.onDidChangeCursorSelection((e) => {
        const selection = editor.getSelection();
        if (!selection) return;

        const selectedText = editor.getModel()?.getValueInRange(selection);
        if (selectedText) {
          //toast.success(`Selected text:\n${selectedText}`, { duration: 2000 });
        }
      });

      // 监听快捷键 Shift + Alt + P 来生成代码注释
      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyP,  // Shift + Alt + P 快捷键
        async (e) => {
          const selection = editor.getSelection();
          if (!selection) return;
      
          const selectedText = editor.getModel()?.getValueInRange(selection);
          if (!selectedText) return;
      
          // 将选中的代码按行分割
          const lines = selectedText.split('\n');
      
          // 显示分割的行数
          //toast(`分割的行数: ${lines.length}`, { duration: 2000 });
      
          // 对每一行代码生成简洁注释
          const annotatedLines = await Promise.all(
            lines.map(async (line) => {
              const prompt = `为以下代码生成一句简洁的注释，不超过30字：\n${line}`;
              const commentSuggestions = await fetchAICompletion(prompt);
      
              if (commentSuggestions.length > 0) {
                // 简化注释，添加到代码后面
                return `${line}  # ${commentSuggestions[0]}`; // 注释添加在代码后面，简洁说明
              }
              return line; // 如果没有注释返回原始代码
            })
          );
      
          // 将注释后的行重新合并成完整的文本
          const updatedText = annotatedLines.join('\n');
      
          // 用生成的注释更新选中的代码
          editor.executeEdits("generate-comments", [
            {
              range: selection,
              text: updatedText, // 用注释替换选中的代码
            },
          ]);
      
          toast.success("注释已成功添加！", { duration: 2000 });
        }
      );
      
      // 代码建议
editor.addCommand(
  monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyL,
  async () => {
    const selection = editor.getSelection();
    if (!selection) return;
    const selectedText = editor.getModel()?.getValueInRange(selection);
    if (!selectedText) return;

    const suggestions = await fetchAICompletion(`Provide suggestions for the following code:\n${selectedText}`);
    if (suggestions.length > 0) {
      setSuggestion(suggestions[0]);

      // 获取编辑器的宽度和高度
      const editorDomNode = editor.getDomNode();
      if (editorDomNode) {
        const editorWidth = editorDomNode.clientWidth;
        const editorHeight = editorDomNode.clientHeight;

        // 计算中心位置
        const top = (editorHeight / 2) - 20; // 根据需要调整位置
        const left = (editorWidth / 2) - 100; // 根据需要调整位置

        setPopupPosition({ top, left });
      }
    } else {
      toast.error("No suggestions returned from the AI model.", { duration: 3000 });
    }
  }
);

      
    },
    []
  );

  const handleEditorChange = (value: string | undefined) => {
    console.log("Editor content changed:", value);
    if (selectedPath && value) modifyFileContent(selectedPath, value);
  };

  useEffect(() => {
    const handleSave = async (event: KeyboardEvent) => {
      if (selectedPath && (event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();  // Prevent default browser save behavior

        const content = saveNewFileContent(selectedPath);

        if (content) {
          try {
            const token = localStorage.getItem("token")?.toString();
            if (token) await OpenHands.saveFile(token, selectedPath, content);
            toast.success(`File saved successfully at ${selectedPath}`, { duration: 2000 });
          } catch (error) {
            toast.error("Error saving file", { duration: 3000 });
          }
        } else {
          toast.error("No file content to save.", { duration: 3000 });
        }
      }
    };

    document.addEventListener("keydown", handleSave);
    return () => {
      document.removeEventListener("keydown", handleSave);
    };
  }, [saveNewFileContent, selectedPath]);

  const closeSuggestion = () => {
    setSuggestion(null); // 关闭建议窗口
  };

  if (!selectedPath) {
    return (
      <div
        data-testid="code-editor-empty-message"
        className="flex flex-col items-center text-neutral-400"
      >
        <VscCode size={100} />
        {t(I18nKey.CODE_EDITOR$EMPTY_MESSAGE)}
      </div>
    );
  }

  return (
    <Editor
      data-testid="code-editor"
      height="100%"
      path={selectedPath ?? undefined}
      defaultValue=" "
      value={selectedPath ? modifiedFiles[selectedPath] || files[selectedPath] : undefined}
      onMount={handleEditorDidMount}
      onChange={handleEditorChange}
      options={{ readOnly: isReadOnly }}
    />
  );
}

export default React.memo(CodeEditorCompoonent);
