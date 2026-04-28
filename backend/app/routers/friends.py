from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.models.friend import FriendResponse, FriendAction
from app.services import notification_service
from app.supabase_client import get_supabase

router = APIRouter()


def _build_friend_response(row: dict, current_user_id: str) -> dict:
    """Attach the other user's profile to a friendship row."""
    if row["requester_id"] == current_user_id:
        profile = row.get("addressee_profile") or row.get("addressee:profiles")
    else:
        profile = row.get("requester_profile") or row.get("requester:profiles")
    return {
        "id": row["id"],
        "requester_id": row["requester_id"],
        "addressee_id": row["addressee_id"],
        "status": row["status"],
        "created_at": row["created_at"],
        "profile": profile,
    }


@router.get("/", response_model=list[FriendResponse])
async def list_friends(user: dict = Depends(get_current_user)):
    """List accepted friends with their profiles."""
    sb = get_supabase()

    # Friends where current user is requester
    as_requester = (
        sb.table("friendships")
        .select("*, addressee:profiles!friendships_addressee_id_fkey(*)")
        .eq("requester_id", user["id"])
        .eq("status", "accepted")
        .execute()
    )

    # Friends where current user is addressee
    as_addressee = (
        sb.table("friendships")
        .select("*, requester:profiles!friendships_requester_id_fkey(*)")
        .eq("addressee_id", user["id"])
        .eq("status", "accepted")
        .execute()
    )

    results = []
    for row in as_requester.data:
        row["addressee_profile"] = row.pop("addressee", None)
        results.append(_build_friend_response(row, user["id"]))
    for row in as_addressee.data:
        row["requester_profile"] = row.pop("requester", None)
        results.append(_build_friend_response(row, user["id"]))

    return results


@router.get("/requests", response_model=list[FriendResponse])
async def list_incoming_requests(user: dict = Depends(get_current_user)):
    """List pending incoming friend requests."""
    sb = get_supabase()
    result = (
        sb.table("friendships")
        .select("*, requester:profiles!friendships_requester_id_fkey(*)")
        .eq("addressee_id", user["id"])
        .eq("status", "pending")
        .order("created_at", desc=True)
        .execute()
    )

    responses = []
    for row in result.data:
        row["requester_profile"] = row.pop("requester", None)
        responses.append(_build_friend_response(row, user["id"]))
    return responses


@router.post("/{user_id}", response_model=FriendResponse, status_code=status.HTTP_201_CREATED)
async def send_friend_request(user_id: str, user: dict = Depends(get_current_user)):
    """Send a friend request to another user."""
    sb = get_supabase()

    if user_id == user["id"]:
        raise HTTPException(400, "Cannot send friend request to yourself")

    # Check target user exists
    target = sb.table("profiles").select("*").eq("id", user_id).single().execute().data
    if not target:
        raise HTTPException(404, "User not found")

    # Check for existing friendship in either direction
    existing = (
        sb.table("friendships")
        .select("*")
        .or_(
            f"and(requester_id.eq.{user['id']},addressee_id.eq.{user_id}),"
            f"and(requester_id.eq.{user_id},addressee_id.eq.{user['id']})"
        )
        .execute()
    )
    if existing.data:
        raise HTTPException(400, "Friend request already exists")

    result = sb.table("friendships").insert({
        "requester_id": user["id"],
        "addressee_id": user_id,
        "status": "pending",
    }).execute()

    row = result.data[0]

    # Notify the addressee
    requester_profile = sb.table("profiles").select("display_name").eq("id", user["id"]).single().execute().data
    notification_service.create_notification(
        user_id=user_id,
        title="Friend request",
        body=f"{requester_profile['display_name']} sent you a friend request",
        type="friend_request",
        link="/friends",
    )

    return {
        **row,
        "profile": target,
    }


@router.put("/{friendship_id}", response_model=FriendResponse)
async def respond_to_request(friendship_id: str, body: FriendAction, user: dict = Depends(get_current_user)):
    """Accept or decline a friend request."""
    sb = get_supabase()

    if body.action not in ("accept", "decline"):
        raise HTTPException(400, "Action must be 'accept' or 'decline'")

    friendship = sb.table("friendships").select("*").eq("id", friendship_id).single().execute().data
    if not friendship:
        raise HTTPException(404, "Friend request not found")

    if friendship["addressee_id"] != user["id"]:
        raise HTTPException(403, "Only the addressee can respond")

    if friendship["status"] != "pending":
        raise HTTPException(400, "Request already responded to")

    new_status = "accepted" if body.action == "accept" else "declined"
    sb.table("friendships").update({"status": new_status}).eq("id", friendship_id).execute()

    # Notify the requester
    addressee_profile = sb.table("profiles").select("display_name").eq("id", user["id"]).single().execute().data
    notification_service.create_notification(
        user_id=friendship["requester_id"],
        title="Friend request accepted" if body.action == "accept" else "Friend request declined",
        body=f"{addressee_profile['display_name']} {body.action}ed your friend request",
        type="friend_response",
        link="/friends",
    )

    # Return with requester's profile
    requester = sb.table("profiles").select("*").eq("id", friendship["requester_id"]).single().execute().data
    return {
        "id": friendship_id,
        "requester_id": friendship["requester_id"],
        "addressee_id": friendship["addressee_id"],
        "status": new_status,
        "created_at": friendship["created_at"],
        "profile": requester,
    }


@router.delete("/{friendship_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_friend(friendship_id: str, user: dict = Depends(get_current_user)):
    """Remove a friendship."""
    sb = get_supabase()

    friendship = sb.table("friendships").select("*").eq("id", friendship_id).single().execute().data
    if not friendship:
        raise HTTPException(404, "Friendship not found")

    if friendship["requester_id"] != user["id"] and friendship["addressee_id"] != user["id"]:
        raise HTTPException(403, "Not part of this friendship")

    sb.table("friendships").delete().eq("id", friendship_id).execute()
