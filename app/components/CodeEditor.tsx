"use client";

import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";

export type Language = "c" | "cpp" | "java" | "python" | "javascript";

export default function CodeEditor({
  value,
  onChange,
  language,
}: {
  value: string;
  onChange: (value: string) => void;
  language: Language;
}) {
  const extensions = useMemo(() => {
    switch (language) {
      case "c":
      case "cpp":
        // The C++ rules also colour plain C code correctly
        return [cpp()];
      case "java":
        return [java()];
      case "python":
        return [python()];
      default:
        return [javascript()];
    }
  }, [language]);

  return (
    <CodeMirror
      value={value}
      height="360px"
      theme="light"
      extensions={extensions}
      onChange={onChange}
      basicSetup={{ foldGutter: false }}
      aria-label="Code editor"
    />
  );
}