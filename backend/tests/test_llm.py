from app.core import llm as llm_module


class _FakeMessage:
    def __init__(self, content):
        self.content = content


class _FakeChoice:
    def __init__(self, content):
        self.message = _FakeMessage(content)


class _FakeCompletion:
    def __init__(self, content):
        self.choices = [_FakeChoice(content)]


class _FakeCompletions:
    def __init__(self, content):
        self._content = content

    def create(self, **kwargs):
        self.last_kwargs = kwargs
        return _FakeCompletion(self._content)


class _FakeChat:
    def __init__(self, content):
        self.completions = _FakeCompletions(content)


class _FakeOpenAIClient:
    def __init__(self, content):
        self.chat = _FakeChat(content)


def test_is_enabled_false_without_key(monkeypatch):
    monkeypatch.setattr(llm_module.settings, "llm_api_key", "")
    assert llm_module.is_enabled() is False


def test_is_enabled_true_with_key(monkeypatch):
    monkeypatch.setattr(llm_module.settings, "llm_api_key", "fake-key")
    assert llm_module.is_enabled() is True


def test_generate_summary_returns_none_when_disabled(monkeypatch):
    monkeypatch.setattr(llm_module.settings, "llm_api_key", "")
    assert llm_module.generate_incident_summary("some prompt") is None


def test_generate_summary_returns_model_output(monkeypatch):
    monkeypatch.setattr(llm_module.settings, "llm_api_key", "fake-key")
    fake_client = _FakeOpenAIClient("Summary text from the model.")
    monkeypatch.setattr(llm_module, "_client", lambda: fake_client)

    result = llm_module.generate_incident_summary("some prompt")
    assert result == "Summary text from the model."
    assert fake_client.chat.completions.last_kwargs["model"] == llm_module.settings.llm_model


def test_generate_summary_returns_none_on_timeout(monkeypatch):
    monkeypatch.setattr(llm_module.settings, "llm_api_key", "fake-key")

    class _FailingClient:
        class chat:
            class completions:
                @staticmethod
                def create(**kwargs):
                    raise TimeoutError("request timed out")

    monkeypatch.setattr(llm_module, "_client", lambda: _FailingClient())
    assert llm_module.generate_incident_summary("some prompt") is None
