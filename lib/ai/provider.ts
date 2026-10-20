// Server-only. Calls the free AI providers (Gemini first, Groq as backup).
// Never import this file into a "use client" page.

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type AiResult = {
  text: string;
  provider: "gemini" | "groq";
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
};

// Optional settings. Every field is optional, so old calls like
// generateReply(system, messages) keep working exactly as before.
export type AiOptions = {
  maxTokens?: number;   // longer replies, e.g. the final interview report
  temperature?: number; // lower = more consistent (use ~0.2 for scoring)
  json?: boolean;       // ask the AI to reply with valid JSON only
};

type ProviderName = "gemini" | "groq";

const TIMEOUT_MS = 25000;

function maxOutputTokens(override?: number) {
  return override ?? (Number(process.env.AI_MAX_OUTPUT_TOKENS) || 800);
}

async function callGemini(
  system: string,
  messages: ChatTurn[],
  options: AiOptions
): Promise<AiResult> {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!key || !model) throw new Error("Gemini is not configured");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          maxOutputTokens: maxOutputTokens(options.maxTokens),
          temperature: options.temperature ?? 0.4,
          ...(options.json ? { responseMimeType: "application/json" } : {}),
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }
  );
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);

  const data = await res.json();
  const parts: { text?: string }[] = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? "").join("").trim();
  if (!text) throw new Error("Gemini returned an empty reply");

  return {
    text,
    provider: "gemini",
    model: typeof data.modelVersion === "string" && data.modelVersion ? data.modelVersion : model,
    inputTokens: data.usageMetadata?.promptTokenCount ?? null,
    outputTokens: data.usageMetadata?.candidatesTokenCount ?? null,
  };
}

async function callGroq(
  system: string,
  messages: ChatTurn[],
  options: AiOptions
): Promise<AiResult> {
  const key = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL;
  if (!key || !model) throw new Error("Groq is not configured");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...messages],
      max_tokens: maxOutputTokens(options.maxTokens),
      temperature: options.temperature ?? 0.4,
      // Groq needs the word "JSON" somewhere in the prompt when this is on.
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);

  const data = await res.json();
  const text: string = (data.choices?.[0]?.message?.content ?? "").trim();
  if (!text) throw new Error("Groq returned an empty reply");

  return {
    text,
    provider: "groq",
    model: typeof data.model === "string" && data.model ? data.model : model,
    inputTokens: data.usage?.prompt_tokens ?? null,
    outputTokens: data.usage?.completion_tokens ?? null,
  };
}

export async function generateReply(
  system: string,
  messages: ChatTurn[],
  options: AiOptions = {}
): Promise<AiResult> {
  const first: ProviderName = process.env.AI_PROVIDER === "groq" ? "groq" : "gemini";
  const order: ProviderName[] = first === "gemini" ? ["gemini", "groq"] : ["groq", "gemini"];

  for (const name of order) {
    try {
      return name === "gemini"
        ? await callGemini(system, messages, options)
        : await callGroq(system, messages, options);
    } catch (err) {
      // Log only a short message (no keys, no student text) for debugging.
      console.error(`[ai] ${name} failed:`, err instanceof Error ? err.message : "unknown");
    }
  }
  throw new Error("AI_UNAVAILABLE");
}