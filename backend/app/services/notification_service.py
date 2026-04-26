from app.supabase_client import get_supabase


def create_notification(
    user_id: str,
    title: str,
    body: str,
    type: str = "general",
    link: str | None = None,
) -> None:
    """Create an in-app notification."""
    sb = get_supabase()
    sb.table("notifications").insert({
        "user_id": user_id,
        "title": title,
        "body": body,
        "type": type,
        "link": link,
        "read": False,
    }).execute()
