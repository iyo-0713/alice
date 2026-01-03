import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

const buildDialogueEndpoint = (baseUrl: string) => {
  const trimmed = baseUrl.trim();

  if (!trimmed) {
    return "/dialogue";
  }

  const normalized = trimmed.replace(/\/+$/, "");
  return `${normalized}/dialogue`;
};

const buildHistoriesEndpoint = (baseUrl: string) => {
  const trimmed = baseUrl.trim();

  if (!trimmed) {
    return "/dialogue/histories";
  }

  const normalized = trimmed.replace(/\/+$/, "");
  return `${normalized}/dialogue/histories`;
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

const parseHistoriesResponse = async (res: Response): Promise<DialogueHistoriesResponse> => {
  const bodyText = (await res.text()).trim();

  if (!bodyText) {
    throw new Error("履歴の応答が空です");
  }

  const parsed = safeParseJson(bodyText);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("履歴の応答形式が不正です");
  }

  return parsed as DialogueHistoriesResponse;
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

type DialogueResponse = {
  response: string;
};

type DialogueHistoryItem = {
  id: number;
  title: string | null;
  created_at: string;
};

type DialogueHistoriesResponse = {
  histories: DialogueHistoryItem[];
};

export default function Index() {
  const endpoint = useMemo(
    () => buildDialogueEndpoint(import.meta.env.VITE_API_BASE_URL ?? ""),
    []
  );
  const historiesEndpoint = useMemo(
    () => buildHistoriesEndpoint(import.meta.env.VITE_API_BASE_URL ?? ""),
    []
  );
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [histories, setHistories] = useState<DialogueHistoryItem[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const loadHistories = useCallback(async () => {
    setIsHistoryLoading(true);
    setHistoryError("");

    try {
      const res = await fetch(historiesEndpoint);

      if (!res.ok) {
        throw new Error(await buildErrorMessage(res));
      }

      const data = await parseHistoriesResponse(res);

      if (!Array.isArray(data.histories)) {
        throw new Error("履歴の応答形式が不正です");
      }

      setHistories(data.histories);
    } catch (err) {
      if (err instanceof Error) {
        setHistoryError(err.message);
      } else {
        setHistoryError("履歴の取得に失敗しました");
      }
    } finally {
      setIsHistoryLoading(false);
    }
  }, [historiesEndpoint]);

  useEffect(() => {
    void loadHistories();
  }, [loadHistories]);

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
      void loadHistories();
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
    <div
      style={{
        display: "flex",
        gap: "2rem",
        alignItems: "flex-start",
        flexWrap: "wrap"
      }}
    >
      <aside style={{ minWidth: "200px", flex: "1 1 200px" }}>
        <h2>履歴</h2>
        {isHistoryLoading ? <p>読み込み中...</p> : null}
        {historyError ? <p>{historyError}</p> : null}
        {!isHistoryLoading && histories.length === 0 ? (
          <p>履歴はありません</p>
        ) : null}
        {histories.length > 0 ? (
          <ul>
            {histories.map((history) => {
              const title = history.title?.trim();
              return (
                <li key={history.id}>{title ? title : "(タイトルなし)"}</li>
              );
            })}
          </ul>
        ) : null}
      </aside>

      <main style={{ flex: "2 1 320px" }}>
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
    </div>
  );
}
