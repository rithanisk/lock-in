from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.models.task import TaskCreate, TaskResponse, ProofSubmit, VerifyRequest, TaskStatus
from app.services import coin_service, notification_service
from app.supabase_client import get_supabase

router = APIRouter()


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(body: TaskCreate, user: dict = Depends(get_current_user)):
    sb = get_supabase()

    if body.verifier_id == user["id"]:
        raise HTTPException(400, "Cannot assign yourself as verifier")

    if not coin_service.lock_stake(user["id"], body.stake_amount):
        raise HTTPException(400, "Insufficient LockCoin balance")

    result = sb.table("tasks").insert({
        "title": body.title,
        "description": body.description,
        "category": body.category.value,
        "stake_amount": body.stake_amount,
        "creator_id": user["id"],
        "verifier_id": body.verifier_id,
        "deadline": body.deadline.isoformat(),
        "proof_type": body.proof_type,
        "status": TaskStatus.pending_acceptance.value,
    }).execute()

    task = result.data[0]
    notification_service.create_notification(
        user_id=body.verifier_id,
        title="New verification request",
        body=f"You've been asked to verify: {body.title}",
        type="task_assigned",
        link=f"/tasks/{task['id']}",
    )
    return task


@router.post("/{task_id}/accept", response_model=TaskResponse)
async def accept_task(task_id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    task = sb.table("tasks").select("*").eq("id", task_id).single().execute().data

    if task["verifier_id"] != user["id"]:
        raise HTTPException(403, "Only the assigned verifier can accept")
    if task["status"] != TaskStatus.pending_acceptance.value:
        raise HTTPException(400, "Task is not pending acceptance")

    result = sb.table("tasks").update({"status": TaskStatus.active.value}).eq("id", task_id).execute()

    notification_service.create_notification(
        user_id=task["creator_id"],
        title="Verifier accepted!",
        body=f"Your task '{task['title']}' has been accepted. Time to lock in!",
        type="task_accepted",
        link=f"/tasks/{task_id}",
    )
    return result.data[0]


@router.post("/{task_id}/decline", response_model=TaskResponse)
async def decline_task(task_id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    task = sb.table("tasks").select("*").eq("id", task_id).single().execute().data

    if task["verifier_id"] != user["id"]:
        raise HTTPException(403, "Only the assigned verifier can decline")
    if task["status"] != TaskStatus.pending_acceptance.value:
        raise HTTPException(400, "Task is not pending acceptance")

    result = sb.table("tasks").update({"status": TaskStatus.declined.value}).eq("id", task_id).execute()

    # Return stake since verifier declined
    coin_service.return_stake(task["creator_id"], task["stake_amount"])

    notification_service.create_notification(
        user_id=task["creator_id"],
        title="Verifier declined",
        body=f"Your verifier declined '{task['title']}'. Stake returned.",
        type="task_declined",
        link=f"/tasks/{task_id}",
    )
    return result.data[0]


@router.post("/{task_id}/submit", response_model=TaskResponse)
async def submit_proof(task_id: str, body: ProofSubmit, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    task = sb.table("tasks").select("*").eq("id", task_id).single().execute().data

    if task["creator_id"] != user["id"]:
        raise HTTPException(403, "Only the task creator can submit proof")
    if task["status"] != TaskStatus.active.value:
        raise HTTPException(400, "Task is not active")

    from datetime import datetime, timezone
    result = sb.table("tasks").update({
        "status": TaskStatus.proof_submitted.value,
        "proof_text": body.proof_text,
        "proof_url": body.proof_url,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", task_id).execute()

    notification_service.create_notification(
        user_id=task["verifier_id"],
        title="Proof submitted!",
        body=f"Proof submitted for '{task['title']}'. Please verify.",
        type="proof_submitted",
        link=f"/tasks/{task_id}",
    )
    return result.data[0]


@router.post("/{task_id}/verify", response_model=TaskResponse)
async def verify_task(task_id: str, body: VerifyRequest, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    task = sb.table("tasks").select("*").eq("id", task_id).single().execute().data

    if task["verifier_id"] != user["id"]:
        raise HTTPException(403, "Only the assigned verifier can verify")
    if task["status"] != TaskStatus.proof_submitted.value:
        raise HTTPException(400, "No proof to verify")

    from datetime import datetime, timezone

    if body.approved:
        result = sb.table("tasks").update({
            "status": TaskStatus.completed.value,
            "verified_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", task_id).execute()

        coin_service.return_stake(task["creator_id"], task["stake_amount"])

        # Update streak
        profile = sb.table("profiles").select("current_streak, longest_streak").eq("id", task["creator_id"]).single().execute().data
        new_streak = profile["current_streak"] + 1
        longest = max(profile["longest_streak"], new_streak)
        sb.table("profiles").update({"current_streak": new_streak, "longest_streak": longest}).eq("id", task["creator_id"]).execute()

        notification_service.create_notification(
            user_id=task["creator_id"],
            title="Task verified!",
            body=f"'{task['title']}' approved! Stake returned. Streak: {new_streak}",
            type="task_completed",
            link=f"/tasks/{task_id}",
        )
    else:
        result = sb.table("tasks").update({
            "status": TaskStatus.failed.value,
            "verified_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", task_id).execute()

        coin_service.forfeit_to_verifier(task["creator_id"], task["verifier_id"], task["stake_amount"])

        # Reset streak
        sb.table("profiles").update({"current_streak": 0}).eq("id", task["creator_id"]).execute()

        notification_service.create_notification(
            user_id=task["creator_id"],
            title="Task failed",
            body=f"'{task['title']}' was not approved. Stake forfeited.",
            type="task_failed",
            link=f"/tasks/{task_id}",
        )

    return result.data[0]


@router.get("/my", response_model=list[TaskResponse])
async def get_my_tasks(user: dict = Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("tasks").select("*").eq("creator_id", user["id"]).order("created_at", desc=True).execute()
    return result.data


@router.get("/verifying", response_model=list[TaskResponse])
async def get_verifying_tasks(user: dict = Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("tasks").select("*").eq("verifier_id", user["id"]).order("created_at", desc=True).execute()
    return result.data


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    task = sb.table("tasks").select("*").eq("id", task_id).single().execute().data
    if task["creator_id"] != user["id"] and task["verifier_id"] != user["id"]:
        raise HTTPException(403, "Not authorized to view this task")
    return task
