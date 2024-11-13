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
  setSuggestion: (suggestion: string | null) => void;
  setPopupPosition: (position: { top: number; left: number } | null) => void;
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

    // toast.success("Fetched Gemini successfully", { duration: 2000 });
    return [text.trim()];  // 返回生成的文本内容
  } catch (error) {
    toast.error("Error fetching completion from Gemini AI model.", { duration: 3000 });
    console.error("Error fetching AI completion:", error);
    return [];
  }
}

function CodeEditorCompoonent({ isReadOnly, setSuggestion, setPopupPosition }: CodeEditorCompoonentProps) {
  const { t } = useTranslation();
  const {
    files,
    selectedPath,
    modifiedFiles,
    modifyFileContent,
    saveFileContent: saveNewFileContent,
  } = useFiles();

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

          freeInlineCompletions: (arg) => {
            return [];
          },
        });
      });

      editor.onDidChangeModelContent((e) => {
        console.log('Editor content changed', e);
      });

      editor.onDidChangeCursorSelection((e) => {
        const selection = editor.getSelection();
        if (!selection) return;

        const selectedText = editor.getModel()?.getValueInRange(selection);
        if (selectedText) {
          // Handle selected text if needed
        }
      });

      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyP,
        async (e) => {
          const selection = editor.getSelection();
          if (!selection) return;

          const selectedText = editor.getModel()?.getValueInRange(selection);
          if (!selectedText) return;

          const lines = selectedText.split('\n');

          const annotatedLines = await Promise.all(
            lines.map(async (line) => {
              const prompt = `为以下代码生成一句简洁的注释，不超过30字：\n${line}`;
              const commentSuggestions = await fetchAICompletion(prompt);
              return commentSuggestions.length > 0 ? `${line}  # ${commentSuggestions[0]}` : line;
            })
          );

          const updatedText = annotatedLines.join('\n');

          editor.executeEdits("generate-comments", [
            {
              range: selection,
              text: updatedText,
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
      
          // 中文提示语
          const suggestions = await fetchAICompletion(`为以下代码提供一些建议：\n${selectedText}`);
      
          if (suggestions.length > 0) {
            setSuggestion(suggestions[0]); // 获取第一条建议
      
            // 直接使用返回的建议内容，而不进行格式化
            setSuggestion(suggestions[0]);
      
            const editorDomNode = editor.getDomNode();
            if (editorDomNode) {
              const editorWidth = editorDomNode.clientWidth;
              const editorHeight = editorDomNode.clientHeight;
      
              const top = (editorHeight / 2) - 20; // 根据需要调整位置
              const left = (editorWidth / 2) - 100; // 根据需要调整位置
      
              setPopupPosition({ top, left });
            }
          } else {
            toast.error("没有从 AI 模型返回建议。", { duration: 3000 });
          }
        }
      );          
    },
    [setSuggestion, setPopupPosition]
  );

  const handleEditorChange = (value: string | undefined) => {
    console.log("Editor content changed:", value);
    if (selectedPath && value) modifyFileContent(selectedPath, value);
  };

  useEffect(() => {
    const handleSave = async (event: KeyboardEvent) => {
      if (selectedPath && (event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();

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
    <>
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
      {/* 这里可以添加 SuggestionPopup 的逻辑 */}
    </>
  );
}

export default React.memo(CodeEditorCompoonent);

