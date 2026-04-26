import resend
from app.config import get_settings


def send_email(to: str, subject: str, html: str) -> None:
    """Send a transactional email via Resend."""
    settings = get_settings()
    if not settings.resend_api_key:
        return  # Skip if not configured

    resend.api_key = settings.resend_api_key
    resend.Emails.send({
        "from": "LockIn <noreply@lockin.app>",
        "to": [to],
        "subject": subject,
        "html": html,
    })


def send_task_assigned_email(to: str, creator_name: str, task_title: str) -> None:
    send_email(
        to=to,
        subject=f"New accountability request from {creator_name}",
        html=f"""
        <h2>You've been asked to verify a task!</h2>
        <p><strong>{creator_name}</strong> wants you to hold them accountable for: <strong>{task_title}</strong></p>
        <p><a href="{get_settings().frontend_url}/tasks">View Task</a></p>
        """,
    )


def send_task_completed_email(to: str, task_title: str) -> None:
    send_email(
        to=to,
        subject=f"Task verified: {task_title}",
        html=f"""
        <h2>Your task has been verified!</h2>
        <p><strong>{task_title}</strong> was approved. Your stake has been returned.</p>
        """,
    )
