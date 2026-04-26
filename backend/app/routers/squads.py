import secrets

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.models.squad import SquadCreate, SquadResponse, JoinSquad, SpendProposal, SpendProposalResponse, VoteRequest
from app.services import notification_service
from app.supabase_client import get_supabase

router = APIRouter()


@router.post("/", response_model=SquadResponse, status_code=status.HTTP_201_CREATED)
async def create_squad(body: SquadCreate, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    invite_code = body.invite_code or secrets.token_urlsafe(8)

    result = sb.table("squads").insert({
        "name": body.name,
        "description": body.description,
        "invite_code": invite_code,
        "max_members": body.max_members,
        "creator_id": user["id"],
        "pot_balance": 0,
    }).execute()

    squad = result.data[0]

    # Add creator as member
    sb.table("squad_members").insert({
        "squad_id": squad["id"],
        "user_id": user["id"],
        "role": "admin",
    }).execute()

    squad["member_count"] = 1
    return squad


@router.post("/join", response_model=SquadResponse)
async def join_squad(body: JoinSquad, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    squad = sb.table("squads").select("*").eq("invite_code", body.invite_code).single().execute().data

    if not squad:
        raise HTTPException(404, "Invalid invite code")

    # Check if already a member
    existing = sb.table("squad_members").select("id").eq("squad_id", squad["id"]).eq("user_id", user["id"]).execute()
    if existing.data:
        raise HTTPException(400, "Already a member of this squad")

    # Check member limit
    members = sb.table("squad_members").select("id", count="exact").eq("squad_id", squad["id"]).execute()
    if members.count >= squad["max_members"]:
        raise HTTPException(400, "Squad is full")

    sb.table("squad_members").insert({
        "squad_id": squad["id"],
        "user_id": user["id"],
        "role": "member",
    }).execute()

    squad["member_count"] = (members.count or 0) + 1
    return squad


@router.get("/my", response_model=list[SquadResponse])
async def get_my_squads(user: dict = Depends(get_current_user)):
    sb = get_supabase()
    memberships = sb.table("squad_members").select("squad_id").eq("user_id", user["id"]).execute()
    squad_ids = [m["squad_id"] for m in memberships.data]
    if not squad_ids:
        return []
    squads = sb.table("squads").select("*").in_("id", squad_ids).execute()
    return squads.data


@router.get("/{squad_id}", response_model=SquadResponse)
async def get_squad(squad_id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    squad = sb.table("squads").select("*").eq("id", squad_id).single().execute().data
    members = sb.table("squad_members").select("id", count="exact").eq("squad_id", squad_id).execute()
    squad["member_count"] = members.count or 0
    return squad


@router.get("/{squad_id}/members")
async def get_squad_members(squad_id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    members = sb.table("squad_members").select("*, profiles(*)").eq("squad_id", squad_id).execute()
    return members.data


@router.post("/{squad_id}/spend", response_model=SpendProposalResponse, status_code=status.HTTP_201_CREATED)
async def create_spend_proposal(squad_id: str, body: SpendProposal, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    squad = sb.table("squads").select("pot_balance").eq("id", squad_id).single().execute().data

    if body.amount > squad["pot_balance"]:
        raise HTTPException(400, "Insufficient pot balance")

    result = sb.table("spend_proposals").insert({
        "squad_id": squad_id,
        "title": body.title,
        "description": body.description,
        "amount": body.amount,
        "proposer_id": user["id"],
        "status": "open",
        "votes_for": 0,
        "votes_against": 0,
    }).execute()

    # Notify all squad members
    members = sb.table("squad_members").select("user_id").eq("squad_id", squad_id).neq("user_id", user["id"]).execute()
    for m in members.data:
        notification_service.create_notification(
            user_id=m["user_id"],
            title="New spend proposal",
            body=f"Vote on: {body.title} ({body.amount} LC)",
            type="spend_proposal",
            link=f"/squads/{squad_id}",
        )

    return result.data[0]


@router.post("/{squad_id}/vote")
async def vote_on_proposal(squad_id: str, body: VoteRequest, user: dict = Depends(get_current_user)):
    sb = get_supabase()

    # Check not already voted
    existing = sb.table("proposal_votes").select("id").eq("proposal_id", body.proposal_id).eq("user_id", user["id"]).execute()
    if existing.data:
        raise HTTPException(400, "Already voted on this proposal")

    sb.table("proposal_votes").insert({
        "proposal_id": body.proposal_id,
        "user_id": user["id"],
        "vote": body.vote,
    }).execute()

    # Update vote counts
    proposal = sb.table("spend_proposals").select("*").eq("id", body.proposal_id).single().execute().data
    field = "votes_for" if body.vote else "votes_against"
    sb.table("spend_proposals").update({field: proposal[field] + 1}).eq("id", body.proposal_id).execute()

    # Check if majority reached
    members = sb.table("squad_members").select("id", count="exact").eq("squad_id", squad_id).execute()
    total = members.count or 1
    updated_for = proposal["votes_for"] + (1 if body.vote else 0)
    updated_against = proposal["votes_against"] + (0 if body.vote else 1)

    if updated_for > total / 2:
        sb.table("spend_proposals").update({"status": "approved"}).eq("id", body.proposal_id).execute()
        # Deduct from pot
        squad = sb.table("squads").select("pot_balance").eq("id", squad_id).single().execute().data
        sb.table("squads").update({"pot_balance": squad["pot_balance"] - proposal["amount"]}).eq("id", squad_id).execute()
    elif updated_against > total / 2:
        sb.table("spend_proposals").update({"status": "rejected"}).eq("id", body.proposal_id).execute()

    return {"status": "voted"}
