import { type FormEvent, useState } from "react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
const endpoint = apiBaseUrl ? `${apiBaseUrl}/dialogue` : "/dialogue";

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
        throw new Error(`リクエストに失敗しました: ${res.status}`);
      }

      const data = (await res.json()) as DialogueResponse;

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
