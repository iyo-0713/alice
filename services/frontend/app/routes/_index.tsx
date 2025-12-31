import { type FormEvent, useState } from "react";

const buildDialogueEndpoint = (baseUrl: string) => {
  const trimmed = baseUrl.trim();

  if (!trimmed) {
    return "/dialogue";
  }

  const normalized = trimmed.replace(/\/+$/, "");
  return `${normalized}/dialogue`;
};

const extractErrorDetail = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const record = payload as Record<string, unknown>;
  const candidates = ["message", "error", "detail"];

  for (const key of candidates) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const safeParseJson = (text: string) => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
};

const parseDialogueResponse = async (res: Response): Promise<DialogueResponse> => {
  const bodyText = (await res.text()).trim();

  if (!bodyText) {
    throw new Error("応答が空です");
  }

  const parsed = safeParseJson(bodyText);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("応答形式が不正です");
  }

  return parsed as DialogueResponse;
};

const buildErrorMessage = async (res: Response) => {
  const statusLabel = res.statusText
    ? `${res.status} ${res.statusText}`
    : `${res.status}`;
  const bodyText = (await res.text()).trim();

  if (!bodyText) {
    return `リクエストに失敗しました: ${statusLabel}`;
  }

  let detail = bodyText;

  if (bodyText.startsWith("{") || bodyText.startsWith("[")) {
    const parsed = safeParseJson(bodyText);
    const extracted = parsed ? extractErrorDetail(parsed) : "";
    if (extracted) {
      detail = extracted;
    }
  }

  return `リクエストに失敗しました: ${statusLabel} - ${detail}`;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
const endpoint = buildDialogueEndpoint(apiBaseUrl);

type DialogueResponse = {
  response: string;
};

export default function Index() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed) {
      return;
    }

    setIsLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ input: trimmed })
      });

      if (!res.ok) {
        throw new Error(await buildErrorMessage(res));
      }

      const data = await parseDialogueResponse(res);

      if (typeof data.response !== "string") {
        throw new Error("応答形式が不正です");
      }

      setResponse(data.response);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("エラーが発生しました");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <h1>dialogue エンドポイント</h1>
      <form onSubmit={handleSubmit}>
        <label>
          入力
          <textarea
            name="input"
            rows={4}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </label>
        <div>
          <button type="submit" disabled={isLoading || input.trim() === ""}>
            送信
          </button>
        </div>
      </form>

      {isLoading ? <p>送信中...</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      {response ? (
        <section>
          <h2>応答</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{response}</pre>
        </section>
      ) : null}
    </main>
  );
}
