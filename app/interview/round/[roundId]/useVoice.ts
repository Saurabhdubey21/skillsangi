"use client";

// Free browser voice features: microphone (speech to text) and read-aloud (text to speech).
// Save as: app/interview/round/[roundId]/useVoice.ts

import { useCallback, useEffect, useRef, useState } from "react";

type RecResult = { isFinal: boolean; 0: { transcript: string } };
type RecEvent = { resultIndex: number; results: ArrayLike<RecResult> };
type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecCtor = new () => Rec;

function getRecCtor(): RecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechInput(onText: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState("");
  const recRef = useRef<Rec | null>(null);
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
  });

  useEffect(() => {
    setSupported(getRecCtor() !== null);
    return () => {
      recRef.current?.abort();
    };
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecCtor();
    if (!Ctor || recRef.current) return;
    setMicError("");

    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = false;

    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) text += r[0].transcript + " ";
      }
      if (text.trim()) onTextRef.current(text.trim());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setMicError("Microphone is blocked. Allow it in the browser address bar and try again.");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        setMicError("The microphone stopped. You can type your answer instead.");
      }
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      recRef.current = null;
      setMicError("Could not start the microphone.");
    }
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  return { supported, listening, micError, start, stop };
}

export function useSpeechOutput() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN";
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  return { supported, speaking, speak, cancel };
}