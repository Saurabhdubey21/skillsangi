"use client";

import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";

export type Language = "c" | "cpp" | "java" | "python" | "javascript";

type Mode = "light" | "dark";

// The site sets data-theme="light" or "dark" on <html>. Dark is the default.
function readSiteTheme(): Mode {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export default function CodeEditor({
  value,
  onChange,
  language,
}: {
  value: string;
  onChange: (value: string) => void;
  language: Language;
}) {
  const [mode, setMode] = useState<Mode>(readSiteTheme);

  // Follow the theme toggle while the page is open
  useEffect(() => {
    setMode(readSiteTheme());
    const observer = new MutationObserver(() => setMode(readSiteTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

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
      theme={mode}
      extensions={extensions}
      onChange={onChange}
      basicSetup={{ foldGutter: false }}
      aria-label="Code editor"
    />
  );
}