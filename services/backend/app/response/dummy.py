"""ダミーの応答を返す."""

def dummy_response(input: str, model: str) -> str: # noqa: A002
    """dummyの出力を返す."""
    return f"{model}: こんにちは。入力は{input}です"
