import smtplib

from app.core import email as email_module


class _FakeSMTP:
    sent_messages: list = []

    def __init__(self, host, port, timeout=10):
        self.host = host
        self.port = port

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def starttls(self):
        pass

    def login(self, username, password):
        pass

    def send_message(self, message):
        _FakeSMTP.sent_messages.append(message)


def test_send_email_noop_when_disabled(monkeypatch):
    monkeypatch.setattr(email_module.settings, "enable_email_notifications", False)

    def _fail(*args, **kwargs):
        raise AssertionError("SMTP should not be contacted when notifications are disabled")

    monkeypatch.setattr(smtplib, "SMTP", _fail)
    email_module.send_email(["dispatcher@example.com"], "subject", "body")


def test_send_email_noop_without_recipients(monkeypatch):
    monkeypatch.setattr(email_module.settings, "enable_email_notifications", True)
    monkeypatch.setattr(email_module.settings, "smtp_host", "smtp.example.com")

    def _fail(*args, **kwargs):
        raise AssertionError("SMTP should not be contacted with no recipients")

    monkeypatch.setattr(smtplib, "SMTP", _fail)
    email_module.send_email([], "subject", "body")


def test_send_email_noop_when_host_not_configured(monkeypatch):
    monkeypatch.setattr(email_module.settings, "enable_email_notifications", True)
    monkeypatch.setattr(email_module.settings, "smtp_host", "")

    def _fail(*args, **kwargs):
        raise AssertionError("SMTP should not be contacted without a configured host")

    monkeypatch.setattr(smtplib, "SMTP", _fail)
    email_module.send_email(["dispatcher@example.com"], "subject", "body")


def test_send_email_sends_when_configured(monkeypatch):
    _FakeSMTP.sent_messages = []
    monkeypatch.setattr(email_module.settings, "enable_email_notifications", True)
    monkeypatch.setattr(email_module.settings, "smtp_host", "smtp.example.com")
    monkeypatch.setattr(email_module.settings, "smtp_username", "")
    monkeypatch.setattr(smtplib, "SMTP", _FakeSMTP)

    email_module.send_email(["dispatcher@example.com"], "Critical incident", "Something happened")

    assert len(_FakeSMTP.sent_messages) == 1
    sent = _FakeSMTP.sent_messages[0]
    assert sent["Subject"] == "Critical incident"
    assert sent["To"] == "dispatcher@example.com"
