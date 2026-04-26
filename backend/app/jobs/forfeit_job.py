"""Background jobs for automatic task management."""

from datetime import datetime, timezone, timedelta

from app.supabase_client import get_supabase
from app.services import coin_service, notification_service


def auto_forfeit():
    """Forfeit stakes for tasks past deadline with no proof."""
    sb = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    expired = sb.table("tasks").select("*").eq("status", "active").lt("deadline", now).execute()

    for task in expired.data:
        sb.table("tasks").update({"status": "failed"}).eq("id", task["id"]).execute()
        coin_service.forfeit_to_verifier(task["creator_id"], task["verifier_id"], task["stake_amount"])
        sb.table("profiles").update({"current_streak": 0}).eq("id", task["creator_id"]).execute()

        notification_service.create_notification(
            user_id=task["creator_id"],
            title="Task expired",
            body=f"'{task['title']}' deadline passed. Stake forfeited.",
            type="task_expired",
            link=f"/tasks/{task['id']}",
        )


def auto_approve():
    """Auto-approve tasks with proof submitted but not verified within 48h."""
    sb = get_supabase()
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat()

    stale = sb.table("tasks").select("*").eq("status", "proof_submitted").lt("submitted_at", cutoff).execute()

    for task in stale.data:
        sb.table("tasks").update({
            "status": "completed",
            "verified_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", task["id"]).execute()

        coin_service.return_stake(task["creator_id"], task["stake_amount"])

        profile = sb.table("profiles").select("current_streak, longest_streak").eq("id", task["creator_id"]).single().execute().data
        new_streak = profile["current_streak"] + 1
        longest = max(profile["longest_streak"], new_streak)
        sb.table("profiles").update({"current_streak": new_streak, "longest_streak": longest}).eq("id", task["creator_id"]).execute()

        notification_service.create_notification(
            user_id=task["creator_id"],
            title="Task auto-approved",
            body=f"'{task['title']}' was auto-approved after 48h.",
            type="task_completed",
            link=f"/tasks/{task['id']}",
        )


def cancel_expired_acceptance():
    """Cancel tasks not accepted within 24h."""
    sb = get_supabase()
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()

    expired = sb.table("tasks").select("*").eq("status", "pending_acceptance").lt("created_at", cutoff).execute()

    for task in expired.data:
        sb.table("tasks").update({"status": "expired"}).eq("id", task["id"]).execute()
        coin_service.return_stake(task["creator_id"], task["stake_amount"])

        notification_service.create_notification(
            user_id=task["creator_id"],
            title="Task expired",
            body=f"Verifier didn't respond to '{task['title']}'. Stake returned.",
            type="task_expired",
            link=f"/tasks/{task['id']}",
        )


def deadline_reminders():
    """Send reminders for tasks due within 4 hours."""
    sb = get_supabase()
    now = datetime.now(timezone.utc)
    window = (now + timedelta(hours=4)).isoformat()

    upcoming = sb.table("tasks").select("*").eq("status", "active").gt("deadline", now.isoformat()).lt("deadline", window).execute()

    for task in upcoming.data:
        notification_service.create_notification(
            user_id=task["creator_id"],
            title="Deadline approaching!",
            body=f"'{task['title']}' is due soon. Submit your proof!",
            type="deadline_reminder",
            link=f"/tasks/{task['id']}",
        )
